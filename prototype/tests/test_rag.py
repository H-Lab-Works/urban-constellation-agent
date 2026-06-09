"""Unit tests for the RAG module (TfidfRag; EmbeddingRag skipped without sentence-transformers)."""

import json
import tempfile
from pathlib import Path

import pytest

from flowmind.rag.simple_rag import TfidfRag, build_rag

SAMPLE_DOCS = [
    {"id": "doc-a", "topic": "macro-structure", "text": "Wuhan is the core city of Hubei's urban network."},
    {"id": "doc-b", "topic": "causal-inference", "text": "Railway openings increase inter-city migration flows."},
    {"id": "doc-c", "topic": "forecasting", "text": "Spatio-temporal models predict future mobility demand."},
    {"id": "doc-d", "topic": "network-analysis", "text": "Louvain community detection reveals urban clusters."},
]


@pytest.fixture
def sample_json(tmp_path: Path) -> Path:
    p = tmp_path / "docs.json"
    p.write_text(json.dumps(SAMPLE_DOCS))
    return p


class TestTfidfRag:
    def test_search_returns_top_k(self) -> None:
        rag = TfidfRag(documents=SAMPLE_DOCS)
        results = rag.search("Wuhan urban core", top_k=2)
        assert len(results) == 2

    def test_search_fields_present(self) -> None:
        rag = TfidfRag(documents=SAMPLE_DOCS)
        results = rag.search("railway migration", top_k=1)
        assert len(results) == 1
        r = results[0]
        assert "id" in r
        assert "score" in r
        assert "text" in r
        assert "backend" in r
        assert r["backend"] == "tfidf"

    def test_search_top_k_capped_at_corpus_size(self) -> None:
        rag = TfidfRag(documents=SAMPLE_DOCS)
        results = rag.search("urban", top_k=100)
        assert len(results) == len(SAMPLE_DOCS)

    def test_relevant_doc_ranks_first(self) -> None:
        rag = TfidfRag(documents=SAMPLE_DOCS)
        results = rag.search("Louvain community detection clusters")
        assert results[0]["id"] == "doc-d"

    def test_answer_returns_expected_keys(self) -> None:
        rag = TfidfRag(documents=SAMPLE_DOCS)
        out = rag.answer("Hubei core city")
        assert "query" in out
        assert "retrieved" in out
        assert "draft_answer" in out
        assert "backend" in out

    def test_from_json_loads_documents(self, sample_json: Path) -> None:
        rag = TfidfRag.from_json(sample_json)
        assert len(rag.documents) == len(SAMPLE_DOCS)


class TestBuildRag:
    def test_returns_some_rag(self, sample_json: Path) -> None:
        rag = build_rag(sample_json)
        results = rag.search("urban Wuhan")
        assert len(results) > 0

    def test_search_result_has_score(self, sample_json: Path) -> None:
        rag = build_rag(sample_json)
        results = rag.search("railway station opening", top_k=2)
        for r in results:
            assert isinstance(r["score"], float)
