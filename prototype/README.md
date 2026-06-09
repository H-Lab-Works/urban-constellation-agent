# Prototype Notes

This folder contains a runnable backend prototype for the portfolio version.

## What Runs

- `flowmind/agent/core_agent.py`: multi-turn ReAct loop with **RAG-grounded context** before tool calls. Uses `OllamaPlanner` when available, otherwise `RuleBasedPlanner`.
- `flowmind/rag/simple_rag.py`: **HybridRag** — BM25 + embedding (TF-IDF fallback) with RRF fusion, metadata filters, chunking, and Ollama/template answer synthesis.
- `flowmind/tools/flow_tools.py`: SHA-256 hash pseudo-random mock tools.
- `flowmind/models/simulator.py`: deterministic causal and scenario simulation demos.
- `flowmind/api.py`: Flask API exposing the RAG-grounded Agent, RAG endpoint, and mock tools.
- `config/rag_documents.json`: 105-note planning corpus with `topic`, `region`, and `method` metadata.
- `config/rag_eval.json`: 20-case retrieval benchmark for Recall@k / MRR.
- `scripts/generate_corpus.py`: regenerates the planning corpus JSON.

## Quick Start

```bash
make install
make test
make eval-rag
make run-api
```

## Example API Requests

```bash
curl -X POST http://127.0.0.1:5050/api/agent \
  -H 'Content-Type: application/json' \
  -d '{"query":"Analyze Hubei macro urban structure"}'

curl -X POST http://127.0.0.1:5050/api/rag \
  -H 'Content-Type: application/json' \
  -d '{"query":"How should Hubei mobility communities be interpreted?","top_k":5}'
```

## Boundary

The control flow is real: the Agent retrieves planning evidence, calls a tool, and answers from both retrieved context and tool observations.

Tool outputs remain deterministic mocks; the corpus is hand-written planning knowledge rather than raw migration data.
