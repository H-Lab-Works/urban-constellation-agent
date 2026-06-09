import argparse
import json
from dataclasses import dataclass

import faiss
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer


DOCUMENTS = [
    {
        "id": "hubei-core",
        "text": "Hubei's mobility network is centered on Wuhan, with Xiangyang and Yichang acting as major sub-centers.",
    },
    {
        "id": "policy-evaluation",
        "text": "A railway station opening can be evaluated by comparing observed migration flow against a counterfactual baseline.",
    },
    {
        "id": "scenario-simulation",
        "text": "Future planning scenarios can estimate how investment intensity changes inter-city mobility demand.",
    },
    {
        "id": "community-detection",
        "text": "Louvain community detection is useful for identifying cohesive urban clusters in a migration network.",
    },
]


@dataclass
class FaissRagDemo:
    documents: list[dict[str, str]]

    def __post_init__(self) -> None:
        self.vectorizer = TfidfVectorizer()
        matrix = self.vectorizer.fit_transform([doc["text"] for doc in self.documents])
        dense = matrix.astype("float32").toarray()
        faiss.normalize_L2(dense)
        self.index = faiss.IndexFlatIP(dense.shape[1])
        self.index.add(dense)

    def search(self, query: str, top_k: int = 2) -> list[dict[str, str | float]]:
        query_vector = self.vectorizer.transform([query]).astype("float32").toarray()
        faiss.normalize_L2(query_vector)
        scores, indices = self.index.search(query_vector, top_k)
        results = []
        for score, index in zip(scores[0], indices[0]):
            doc = self.documents[int(index)]
            results.append(
                {
                    "id": doc["id"],
                    "score": round(float(score), 4),
                    "text": doc["text"],
                }
            )
        return results


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the minimal FAISS RAG demo.")
    parser.add_argument("query", nargs="?", default="How should Hubei's urban structure be analyzed?")
    parser.add_argument("--top-k", type=int, default=2)
    args = parser.parse_args()

    rag = FaissRagDemo(DOCUMENTS)
    print(json.dumps(rag.search(args.query, args.top_k), indent=2))


if __name__ == "__main__":
    main()

