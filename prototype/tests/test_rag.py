"""Unit tests for the RAG module."""

import json
from pathlib import Path

import pytest

from flowmind.rag.corpus_loader import chunk_documents, infer_metadata_filter, load_documents
from flowmind.rag.simple_rag import HybridRag, build_rag, evaluate_retrieval

SAMPLE_DOCS = [
    {
        "id": "doc-a",
        "topic": "macro-structure",
        "region": "hubei",
        "method": "network-analysis",
        "text": "Wuhan is the core city of Hubei's urban network.",
    },
    {
        "id": "doc-b",
        "topic": "causal-inference",
        "region": "general",
        "method": "synthetic-control",
        "text": "Railway openings increase inter-city migration flows.",
    },
    {
        "id": "doc-c",
        "topic": "forecasting",
        "region": "general",
        "method": "stgcn",
        "text": "Spatio-temporal models predict future mobility demand.",
    },
    {
        "id": "doc-d",
        "topic": "network-analysis",
        "region": "general",
        "method": "louvain",
        "text": "Louvain community detection reveals urban clusters.",
    },
]


@pytest.fixture
def sample_json(tmp_path: Path) -> Path:
    p = tmp_path / "docs.json"
    p.write_text(json.dumps(SAMPLE_DOCS))
    return p


class TestCorpusLoader:
    def test_chunk_short_documents_unchanged(self) -> None:
        chunks = chunk_documents(SAMPLE_DOCS)
        assert len(chunks) == len(SAMPLE_DOCS)
        assert chunks[0]["parent_id"] == "doc-a"

    def test_infer_hubei_metadata(self) -> None:
        assert infer_metadata_filter("Analyze Hubei urban structure")["region"] == "hubei"

    def test_load_documents_from_json(self, sample_json: Path) -> None:
        docs = load_documents(sample_json)
        assert len(docs) == len(SAMPLE_DOCS)


class TestHybridRag:
    def test_search_returns_top_k(self) -> None:
        rag = HybridRag(documents=SAMPLE_DOCS)
        results = rag.search("urban network migration forecasting", top_k=2, metadata_filter={})
        assert 1 <= len(results) <= 2

    def test_search_fields_present(self) -> None:
        rag = HybridRag(documents=SAMPLE_DOCS)
        results = rag.search("railway migration", top_k=1)
        assert len(results) == 1
        result = results[0]
        assert "id" in result
        assert "score" in result
        assert "text" in result
        assert "backend" in result
        assert "hybrid" in result["backend"]

    def test_metadata_filter_prefers_topic(self) -> None:
        rag = HybridRag(documents=SAMPLE_DOCS)
        results = rag.search("Louvain community detection clusters", metadata_filter={"topic": "network-analysis"})
        assert results[0]["topic"] == "network-analysis"

    def test_relevant_doc_ranks_first(self) -> None:
        rag = HybridRag(documents=SAMPLE_DOCS)
        results = rag.search("Louvain community detection clusters")
        assert results[0]["id"] == "doc-d"

    def test_answer_returns_expected_keys(self) -> None:
        rag = HybridRag(documents=SAMPLE_DOCS)
        out = rag.answer("Hubei core city")
        assert "query" in out
        assert "retrieved" in out
        assert "answer" in out
        assert "draft_answer" in out
        assert "generation" in out
        assert out["generation"] == "template"

    def test_from_json_loads_documents(self, sample_json: Path) -> None:
        rag = HybridRag.from_json(sample_json)
        assert len(rag.documents) == len(SAMPLE_DOCS)


class TestBuildRag:
    def test_returns_hybrid_rag(self, sample_json: Path) -> None:
        rag = build_rag(sample_json)
        results = rag.search("urban Wuhan")
        assert len(results) > 0

    def test_search_result_has_score(self, sample_json: Path) -> None:
        rag = build_rag(sample_json)
        results = rag.search("railway station opening", top_k=2)
        for result in results:
            assert isinstance(result["score"], float)


class TestRetrievalEval:
    def test_evaluate_retrieval_on_sample_cases(self, sample_json: Path) -> None:
        rag = build_rag(sample_json)
        cases = [
            {"query": "Wuhan core city", "expected_parent_ids": ["doc-a"]},
            {"query": "Louvain clusters", "expected_parent_ids": ["doc-d"]},
        ]
        metrics = evaluate_retrieval(rag, cases, top_k=3)
        assert metrics["cases"] == 2.0
        assert metrics["recall_at_k"] >= 0.5

    def test_full_eval_set_meets_baseline(self) -> None:
        eval_path = Path(__file__).resolve().parents[1] / "config" / "rag_eval.json"
        rag = build_rag()
        cases = json.loads(eval_path.read_text(encoding="utf-8"))
        metrics = evaluate_retrieval(rag, cases, top_k=5)
        assert metrics["recall_at_k"] >= 0.75
