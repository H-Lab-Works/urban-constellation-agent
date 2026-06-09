import argparse
import json
from dataclasses import dataclass
from pathlib import Path

import faiss
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer


DEFAULT_DOCUMENT_PATH = Path(__file__).resolve().parents[2] / "config" / "rag_documents.json"


@dataclass
class FaissRagDemo:
    documents: list[dict[str, str]]

    def __post_init__(self) -> None:
        self.vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        matrix = self.vectorizer.fit_transform([doc["text"] for doc in self.documents])
        dense = matrix.astype("float32").toarray()
        faiss.normalize_L2(dense)
        self.index = faiss.IndexFlatIP(dense.shape[1])
        self.index.add(dense)

    @classmethod
    def from_json(cls, path: str | Path = DEFAULT_DOCUMENT_PATH) -> "FaissRagDemo":
        with Path(path).open() as file:
            documents = json.load(file)
        return cls(documents=documents)

    def search(self, query: str, top_k: int = 3) -> list[dict[str, str | float]]:
        query_vector = self.vectorizer.transform([query]).astype("float32").toarray()
        faiss.normalize_L2(query_vector)
        scores, indices = self.index.search(query_vector, min(top_k, len(self.documents)))
        results = []
        for score, index in zip(scores[0], indices[0]):
            doc = self.documents[int(index)]
            results.append(
                {
                    "id": doc["id"],
                    "topic": doc.get("topic", "general"),
                    "score": round(float(score), 4),
                    "text": doc["text"],
                }
            )
        return results

    def answer(self, query: str, top_k: int = 3) -> dict:
        retrieved = self.search(query, top_k)
        evidence = " ".join(item["text"] for item in retrieved)
        return {
            "query": query,
            "retrieved": retrieved,
            "draft_answer": (
                "Based on the retrieved planning notes, the answer should connect "
                f"the user's question to this evidence: {evidence}"
            ),
        }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the minimal TF-IDF + FAISS RAG demo.")
    parser.add_argument("query", nargs="?", default="How should Hubei's urban structure be analyzed?")
    parser.add_argument("--top-k", type=int, default=3)
    parser.add_argument("--documents", default=str(DEFAULT_DOCUMENT_PATH))
    args = parser.parse_args()

    rag = FaissRagDemo.from_json(args.documents)
    print(json.dumps(rag.answer(args.query, args.top_k), indent=2))


if __name__ == "__main__":
    main()

