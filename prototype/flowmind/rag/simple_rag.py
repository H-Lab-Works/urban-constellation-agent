"""Urban Constellation RAG module.

Features:
- Corpus loading with optional chunking and metadata (topic, region, method)
- Hybrid retrieval: BM25 + dense/TF-IDF fused with reciprocal rank fusion (RRF)
- Grounded answer synthesis via Ollama with template fallback
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Protocol

import faiss
import numpy as np

from flowmind.rag.corpus_loader import (
    DEFAULT_DOCUMENT_PATH,
    infer_metadata_filter,
    load_documents,
    matches_metadata,
    normalize_query,
)
from flowmind.rag.llm import format_evidence, synthesize_answer

try:
    from rank_bm25 import BM25Okapi

    _HAS_BM25 = True
except ImportError:  # pragma: no cover
    _HAS_BM25 = False

try:
    from sentence_transformers import SentenceTransformer

    _HAS_ST = True
except ImportError:  # pragma: no cover
    _HAS_ST = False

DEFAULT_EMBEDDING_MODEL = "all-MiniLM-L6-v2"
RRF_K = 60


class RagBackend(Protocol):
    def search(
        self,
        query: str,
        top_k: int = 5,
        metadata_filter: dict[str, str] | None = None,
    ) -> list[dict[str, Any]]:
        ...

    def answer(
        self,
        query: str,
        top_k: int = 5,
        metadata_filter: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        ...


def reciprocal_rank_fusion(rank_lists: list[list[str]], *, k: int = RRF_K) -> list[tuple[str, float]]:
    scores: dict[str, float] = {}
    for ranks in rank_lists:
        for rank, doc_id in enumerate(ranks):
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank + 1)
    return sorted(scores.items(), key=lambda item: item[1], reverse=True)


def _tokenize(text: str) -> list[str]:
    return normalize_query(text).lower().split()


@dataclass
class HybridRag:
    """Hybrid BM25 + dense/TF-IDF retrieval with optional metadata filtering."""

    documents: list[dict[str, Any]]
    model_name: str = DEFAULT_EMBEDDING_MODEL
    _bm25: Any = field(init=False, repr=False)
    _dense_backend: str = field(init=False, repr=False)
    _vectorizer: Any = field(init=False, repr=False, default=None)
    _model: Any = field(init=False, repr=False, default=None)
    _index: Any = field(init=False, repr=False)

    def __post_init__(self) -> None:
        tokenized = [_tokenize(doc["text"]) for doc in self.documents]
        if _HAS_BM25:
            self._bm25 = BM25Okapi(tokenized)
        else:
            self._bm25 = None

        texts = [doc["text"] for doc in self.documents]
        if _HAS_ST:
            self._model = SentenceTransformer(self.model_name)
            embeddings = self._model.encode(texts, normalize_embeddings=True).astype("float32")
            self._dense_backend = "embedding"
        else:
            from sklearn.feature_extraction.text import TfidfVectorizer

            self._vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
            matrix = self._vectorizer.fit_transform(texts)
            embeddings = matrix.astype("float32").toarray()
            faiss.normalize_L2(embeddings)
            self._dense_backend = "tfidf"

        self._index = faiss.IndexFlatIP(embeddings.shape[1])
        self._index.add(embeddings)

    @classmethod
    def from_json(
        cls,
        path: str | Path = DEFAULT_DOCUMENT_PATH,
        model_name: str = DEFAULT_EMBEDDING_MODEL,
    ) -> "HybridRag":
        return cls(documents=load_documents(path), model_name=model_name)

    def _candidate_indices(self, metadata_filter: dict[str, str] | None) -> list[int]:
        if not metadata_filter:
            return list(range(len(self.documents)))
        return [
            index
            for index, doc in enumerate(self.documents)
            if matches_metadata(doc, metadata_filter)
        ]

    def _bm25_ranked_ids(self, query: str, candidate_indices: list[int], top_k: int) -> list[str]:
        if not self._bm25 or not candidate_indices:
            return []

        scores = self._bm25.get_scores(_tokenize(query))
        ranked = sorted(
            ((index, scores[index]) for index in candidate_indices),
            key=lambda item: item[1],
            reverse=True,
        )
        return [self.documents[index]["id"] for index, _ in ranked[:top_k]]

    def _dense_ranked_ids(self, query: str, candidate_indices: list[int], top_k: int) -> list[str]:
        if not candidate_indices:
            return []

        if self._dense_backend == "embedding":
            query_vec = self._model.encode([query], normalize_embeddings=True).astype("float32")
        else:
            query_vec = self._vectorizer.transform([query]).astype("float32").toarray()
            faiss.normalize_L2(query_vec)

        subset = np.array(candidate_indices, dtype="int64")
        if len(subset) == 1:
            vec = self._index.reconstruct(int(subset[0])).reshape(1, -1)
            if self._dense_backend == "embedding":
                score = float(np.dot(vec, query_vec.T)[0][0])
            else:
                score = float(np.dot(vec, query_vec.T)[0][0])
            return [self.documents[int(subset[0])]["id"]] if score > 0 else []

        # Search globally then keep candidates (small corpus; simple and test-friendly).
        scores, indices = self._index.search(query_vec, min(len(self.documents), top_k * 4))
        ranked_ids: list[str] = []
        candidate_set = set(candidate_indices)
        for score, index in zip(scores[0], indices[0]):
            if int(index) in candidate_set:
                ranked_ids.append(self.documents[int(index)]["id"])
            if len(ranked_ids) >= top_k:
                break
        return ranked_ids

    def search(
        self,
        query: str,
        top_k: int = 5,
        metadata_filter: dict[str, str] | None = None,
    ) -> list[dict[str, Any]]:
        query = normalize_query(query)
        metadata_filter = metadata_filter or infer_metadata_filter(query)
        candidate_indices = self._candidate_indices(metadata_filter)
        if not candidate_indices:
            candidate_indices = list(range(len(self.documents)))

        fetch_k = min(max(top_k * 3, top_k), len(candidate_indices))
        bm25_ids = self._bm25_ranked_ids(query, candidate_indices, fetch_k)
        dense_ids = self._dense_ranked_ids(query, candidate_indices, fetch_k)

        rank_lists = [ids for ids in (bm25_ids, dense_ids) if ids]
        if not rank_lists:
            return []

        if len(rank_lists) == 1:
            fused = [(doc_id, 1.0) for doc_id in rank_lists[0][:top_k]]
        else:
            fused = reciprocal_rank_fusion(rank_lists)[:top_k]

        doc_by_id = {doc["id"]: doc for doc in self.documents}
        results: list[dict[str, Any]] = []
        for doc_id, score in fused:
            doc = doc_by_id[doc_id]
            results.append(
                {
                    "id": doc["id"],
                    "parent_id": doc.get("parent_id", doc["id"]),
                    "topic": doc.get("topic", "general"),
                    "region": doc.get("region", "general"),
                    "method": doc.get("method", "general"),
                    "score": round(float(score), 4),
                    "text": doc["text"],
                    "backend": self.backend_name(),
                }
            )
        return results

    def backend_name(self) -> str:
        dense = self._dense_backend
        sparse = "bm25" if self._bm25 else "none"
        return f"hybrid({sparse}+{dense})"

    def answer(
        self,
        query: str,
        top_k: int = 5,
        metadata_filter: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        retrieved = self.search(query, top_k=top_k, metadata_filter=metadata_filter)
        answer_text, generation_backend = synthesize_answer(query, retrieved)
        return {
            "query": query,
            "backend": self.backend_name(),
            "generation": generation_backend,
            "retrieved": retrieved,
            "answer": answer_text,
            "draft_answer": answer_text,
        }


# Backward-compatible aliases used in tests
TfidfRag = HybridRag
EmbeddingRag = HybridRag


def build_rag(
    path: str | Path = DEFAULT_DOCUMENT_PATH,
    model_name: str = DEFAULT_EMBEDDING_MODEL,
) -> HybridRag:
    return HybridRag.from_json(path, model_name=model_name)


def evaluate_retrieval(
    rag: RagBackend,
    eval_cases: list[dict[str, Any]],
    *,
    top_k: int = 5,
) -> dict[str, float]:
    if not eval_cases:
        return {"cases": 0.0, "recall_at_k": 0.0, "mrr": 0.0}

    recalls: list[float] = []
    reciprocal_ranks: list[float] = []

    for case in eval_cases:
        expected = set(case.get("expected_ids", []))
        parent_expected = set(case.get("expected_parent_ids", [])) or expected
        results = rag.search(case["query"], top_k=top_k)
        hit_ids = [item["id"] for item in results]
        hit_parents = [item.get("parent_id", item["id"]) for item in results]

        matched = any(
            doc_id in expected or parent in parent_expected
            for doc_id, parent in zip(hit_ids, hit_parents)
        )
        recalls.append(1.0 if matched else 0.0)

        rr = 0.0
        for rank, (doc_id, parent) in enumerate(zip(hit_ids, hit_parents), start=1):
            if doc_id in expected or parent in parent_expected:
                rr = 1.0 / rank
                break
        reciprocal_ranks.append(rr)

    count = len(eval_cases)
    return {
        "cases": float(count),
        "recall_at_k": sum(recalls) / count,
        "mrr": sum(reciprocal_ranks) / count,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the hybrid RAG demo.")
    parser.add_argument(
        "query",
        nargs="?",
        default="How should Hubei's urban structure be analyzed?",
    )
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument("--documents", default=str(DEFAULT_DOCUMENT_PATH))
    parser.add_argument("--eval", action="store_true", help="Run retrieval evaluation.")
    parser.add_argument(
        "--eval-path",
        default=str(Path(__file__).resolve().parents[2] / "config" / "rag_eval.json"),
    )
    args = parser.parse_args()

    rag = build_rag(args.documents)

    if args.eval:
        with Path(args.eval_path).open(encoding="utf-8") as fh:
            eval_cases = json.load(fh)
        metrics = evaluate_retrieval(rag, eval_cases, top_k=args.top_k)
        print(json.dumps(metrics, indent=2))
        return

    print(json.dumps(rag.answer(args.query, args.top_k), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
