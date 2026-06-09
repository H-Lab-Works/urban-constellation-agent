"""Urban Constellation RAG module.

Two backends are provided:
- EmbeddingRag  — sentence-transformers + FAISS (dense retrieval, preferred).
- TfidfRag      — TF-IDF + FAISS (no model download, used as fallback).

`build_rag()` tries EmbeddingRag first and falls back to TfidfRag when
sentence-transformers is not installed.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Protocol

import faiss
import numpy as np

try:
    from sentence_transformers import SentenceTransformer

    _HAS_ST = True
except ImportError:  # pragma: no cover
    _HAS_ST = False


DEFAULT_DOCUMENT_PATH = Path(__file__).resolve().parents[2] / "config" / "rag_documents.json"
DEFAULT_EMBEDDING_MODEL = "all-MiniLM-L6-v2"


class RagBackend(Protocol):
    def search(self, query: str, top_k: int = 3) -> list[dict]:
        ...

    def answer(self, query: str, top_k: int = 3) -> dict:
        ...


@dataclass
class EmbeddingRag:
    """Dense retrieval using sentence-transformers + FAISS IndexFlatIP.

    The model is downloaded on first use (~90 MB for all-MiniLM-L6-v2).
    Embeddings are L2-normalised so inner product equals cosine similarity.
    """

    documents: list[dict]
    model_name: str = DEFAULT_EMBEDDING_MODEL
    _model: object = field(init=False, repr=False)
    _index: object = field(init=False, repr=False)

    def __post_init__(self) -> None:
        if not _HAS_ST:
            raise ImportError(
                "sentence-transformers is required for EmbeddingRag. "
                "Run: pip install sentence-transformers"
            )
        self._model = SentenceTransformer(self.model_name)
        texts = [doc["text"] for doc in self.documents]
        embeddings = self._model.encode(texts, normalize_embeddings=True).astype("float32")
        self._index = faiss.IndexFlatIP(embeddings.shape[1])
        self._index.add(embeddings)

    @classmethod
    def from_json(
        cls,
        path: str | Path = DEFAULT_DOCUMENT_PATH,
        model_name: str = DEFAULT_EMBEDDING_MODEL,
    ) -> "EmbeddingRag":
        with Path(path).open() as fh:
            documents = json.load(fh)
        return cls(documents=documents, model_name=model_name)

    def search(self, query: str, top_k: int = 3) -> list[dict]:
        qvec = self._model.encode([query], normalize_embeddings=True).astype("float32")
        scores, indices = self._index.search(qvec, min(top_k, len(self.documents)))
        return [
            {
                "id": self.documents[int(i)]["id"],
                "topic": self.documents[int(i)].get("topic", "general"),
                "score": round(float(s), 4),
                "text": self.documents[int(i)]["text"],
                "backend": "embedding",
            }
            for s, i in zip(scores[0], indices[0])
        ]

    def answer(self, query: str, top_k: int = 3) -> dict:
        retrieved = self.search(query, top_k)
        evidence = " ".join(item["text"] for item in retrieved)
        return {
            "query": query,
            "backend": "embedding (sentence-transformers)",
            "retrieved": retrieved,
            "draft_answer": (
                "Based on the retrieved planning knowledge, the analysis should connect "
                f"the query to this evidence: {evidence}"
            ),
        }


@dataclass
class TfidfRag:
    """Sparse retrieval using TF-IDF + FAISS IndexFlatIP.

    Used as a fallback when sentence-transformers is not installed.
    No model download required.
    """

    documents: list[dict]

    def __post_init__(self) -> None:
        from sklearn.feature_extraction.text import TfidfVectorizer

        self._vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        matrix = self._vectorizer.fit_transform([doc["text"] for doc in self.documents])
        dense = matrix.astype("float32").toarray()
        faiss.normalize_L2(dense)
        self._index = faiss.IndexFlatIP(dense.shape[1])
        self._index.add(dense)

    @classmethod
    def from_json(cls, path: str | Path = DEFAULT_DOCUMENT_PATH) -> "TfidfRag":
        with Path(path).open() as fh:
            documents = json.load(fh)
        return cls(documents=documents)

    def search(self, query: str, top_k: int = 3) -> list[dict]:
        qvec = self._vectorizer.transform([query]).astype("float32").toarray()
        faiss.normalize_L2(qvec)
        scores, indices = self._index.search(qvec, min(top_k, len(self.documents)))
        return [
            {
                "id": self.documents[int(i)]["id"],
                "topic": self.documents[int(i)].get("topic", "general"),
                "score": round(float(s), 4),
                "text": self.documents[int(i)]["text"],
                "backend": "tfidf",
            }
            for s, i in zip(scores[0], indices[0])
        ]

    def answer(self, query: str, top_k: int = 3) -> dict:
        retrieved = self.search(query, top_k)
        evidence = " ".join(item["text"] for item in retrieved)
        return {
            "query": query,
            "backend": "tfidf (fallback — install sentence-transformers for embedding retrieval)",
            "retrieved": retrieved,
            "draft_answer": (
                "Based on the retrieved planning knowledge, the analysis should connect "
                f"the query to this evidence: {evidence}"
            ),
        }


def build_rag(
    path: str | Path = DEFAULT_DOCUMENT_PATH,
    model_name: str = DEFAULT_EMBEDDING_MODEL,
) -> EmbeddingRag | TfidfRag:
    """Return an EmbeddingRag if sentence-transformers is available, else TfidfRag."""
    if _HAS_ST:
        return EmbeddingRag.from_json(path, model_name=model_name)
    return TfidfRag.from_json(path)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run the RAG demo (embedding or TF-IDF fallback)."
    )
    parser.add_argument(
        "query",
        nargs="?",
        default="How should Hubei's urban structure be analyzed?",
    )
    parser.add_argument("--top-k", type=int, default=3)
    parser.add_argument("--documents", default=str(DEFAULT_DOCUMENT_PATH))
    parser.add_argument(
        "--backend",
        choices=["auto", "embedding", "tfidf"],
        default="auto",
        help="'auto' prefers embedding and falls back to tfidf.",
    )
    args = parser.parse_args()

    if args.backend == "tfidf":
        rag: EmbeddingRag | TfidfRag = TfidfRag.from_json(args.documents)
    elif args.backend == "embedding":
        rag = EmbeddingRag.from_json(args.documents)
    else:
        rag = build_rag(args.documents)

    print(json.dumps(rag.answer(args.query, args.top_k), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
