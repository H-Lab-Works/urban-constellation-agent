# Prototype Notes

This folder contains a runnable backend prototype for the portfolio version.

## What Runs

- `flowmind/agent/core_agent.py`: multi-turn ReAct loop. Uses `OllamaPlanner` when a local Ollama model is available, otherwise `RuleBasedPlanner`.
- `flowmind/tools/flow_tools.py`: SHA-256 hash pseudo-random mock tools for flow prediction, policy evaluation, and macro-structure analysis.
- `flowmind/rag/simple_rag.py`: `EmbeddingRag` (sentence-transformers + FAISS) with `TfidfRag` fallback.
- `flowmind/models/simulator.py`: deterministic causal and scenario simulation demos.
- `flowmind/api.py`: Flask API exposing the Agent, RAG, and mock tools.
- `config/rag_documents.json`: 28-note planning corpus.
- `models.yaml`: documented target-model configuration for the production direction.

## What Does Not Ship

- Fine-tuned Qwen tool-calling weights
- STGCN / SCM / Louvain production models
- Real migration corpora

## Quick Start

```bash
make install   # creates .venv and installs dependencies
make test      # runs unit tests
make run-api   # starts Flask API on port 5050
```

Or step by step:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. python3 flowmind/agent/core_agent.py
```

## Example API Requests

```bash
curl -X POST http://127.0.0.1:5050/api/agent \
  -H 'Content-Type: application/json' \
  -d '{"query":"Analyze Hubei macro urban structure"}'

curl -X POST http://127.0.0.1:5050/api/rag \
  -H 'Content-Type: application/json' \
  -d '{"query":"How should Hubei mobility communities be interpreted?","top_k":3}'
```

## Boundary

The control flow is real: the Agent calls a tool, receives an observation, and then answers from that observation.

The intelligence layer is partially mocked: tool outputs are deterministic mocks; RAG runs over a small hand-written corpus rather than real migration data.
