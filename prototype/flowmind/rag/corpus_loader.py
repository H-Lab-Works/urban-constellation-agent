"""Load planning corpus JSON and optionally split long entries into chunks."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


DEFAULT_DOCUMENT_PATH = Path(__file__).resolve().parents[2] / "config" / "rag_documents.json"
MAX_WORDS_PER_CHUNK = 80
CHUNK_OVERLAP_WORDS = 15


def load_documents(path: str | Path = DEFAULT_DOCUMENT_PATH) -> list[dict[str, Any]]:
    with Path(path).open(encoding="utf-8") as fh:
        raw_docs = json.load(fh)
    return chunk_documents(raw_docs)


def chunk_documents(raw_docs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Split long notes into overlapping word windows; short notes stay as one chunk."""
    chunks: list[dict[str, Any]] = []
    for doc in raw_docs:
        text = doc["text"].strip()
        words = text.split()
        if len(words) <= MAX_WORDS_PER_CHUNK:
            chunks.append(_chunk_record(doc, text, chunk_index=0, chunk_total=1))
            continue

        step = max(1, MAX_WORDS_PER_CHUNK - CHUNK_OVERLAP_WORDS)
        windows: list[str] = []
        for start in range(0, len(words), step):
            piece = " ".join(words[start : start + MAX_WORDS_PER_CHUNK]).strip()
            if piece:
                windows.append(piece)
            if start + MAX_WORDS_PER_CHUNK >= len(words):
                break

        for index, piece in enumerate(windows):
            chunks.append(_chunk_record(doc, piece, chunk_index=index, chunk_total=len(windows)))
    return chunks


def _chunk_record(
    doc: dict[str, Any],
    text: str,
    *,
    chunk_index: int,
    chunk_total: int,
) -> dict[str, Any]:
    base_id = doc["id"]
    chunk_id = base_id if chunk_total == 1 else f"{base_id}::chunk-{chunk_index}"
    return {
        "id": chunk_id,
        "parent_id": base_id,
        "chunk_index": chunk_index,
        "chunk_total": chunk_total,
        "topic": doc.get("topic", "general"),
        "region": doc.get("region", "general"),
        "method": doc.get("method", "general"),
        "text": text,
    }


def infer_metadata_filter(query: str) -> dict[str, str]:
    """Lightweight metadata hints from the user query."""
    lowered = query.lower()
    filters: dict[str, str] = {}

    if any(kw in lowered for kw in ["hubei", "wuhan", "xiangyang", "yichang", "湖北", "武汉"]):
        filters["region"] = "hubei"
    if any(kw in lowered for kw in ["policy", "causal", "railway", "政策", "因果"]):
        filters["topic"] = "causal-inference"
    elif any(kw in lowered for kw in ["forecast", "predict", "flow", "预测"]):
        filters["topic"] = "forecasting"
    elif any(kw in lowered for kw in ["louvain", "community", "network", "结构", "社群"]):
        filters["topic"] = "network-analysis"
    elif any(kw in lowered for kw in ["report", "recommend", "规划报告"]):
        filters["topic"] = "reporting"

    return filters


def matches_metadata(doc: dict[str, Any], filters: dict[str, str]) -> bool:
    if not filters:
        return True
    for key, value in filters.items():
        if doc.get(key) != value:
            return False
    return True


def normalize_query(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip())
