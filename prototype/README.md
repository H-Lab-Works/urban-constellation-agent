# Prototype Notes

This folder contains a runnable minimal prototype for the portfolio version.

## What Runs

- `flowmind/agent/core_agent.py`: multi-turn ReAct loop with a **rule-based keyword planner** by default. A real model adapter can be injected through `planner`, but none is bundled.
- `flowmind/tools/flow_tools.py`: **SHA-256 hash pseudo-random mock tools** for flow prediction, policy evaluation, and macro-structure analysis.
- `flowmind/rag/simple_rag.py`: retrieval over **12 English planning notes** using **TF-IDF + FAISS**. This is not embedding hybrid retrieval and does not use real migration corpora.
- `flowmind/models/simulator.py`: deterministic causal and scenario simulation demos.
- `flowmind/api.py`: lightweight Flask API that exposes the Agent and mock tools.
- `config/rag_documents.json`: the 12-note sample retrieval corpus.
- `models.yaml`: documented target-model configuration for the production direction.

## What Does Not Ship

- Real LLM inference or fine-tuned Qwen tool-calling
- STGCN / SCM / Louvain production models
- Embedding-based hybrid RAG
- Unit tests, CI, Docker, or one-click bootstrap scripts

`requirements.txt` contains only 4 dependencies. That is enough for a portfolio walkthrough, not a reproducible research prototype.

## Install

```bash
cd prototype
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run The ReAct Agent

```bash
PYTHONPATH=. python3 flowmind/agent/core_agent.py
```

## Run The TF-IDF RAG Demo

```bash
PYTHONPATH=. python3 flowmind/rag/simple_rag.py "How should Hubei's urban structure be analyzed?"
```

## Run The Simulation Demo

```bash
PYTHONPATH=. python3 flowmind/models/simulator.py --origin Wuhan --dest Xiangyang --baseline 70 --strength medium
```

## Run The Flask API

```bash
PYTHONPATH=. python3 flowmind/api.py
```

Example request:

```bash
curl -X POST http://127.0.0.1:5050/api/agent \
  -H 'Content-Type: application/json' \
  -d '{"query":"Analyze Hubei macro urban structure"}'
```

RAG request:

```bash
curl -X POST http://127.0.0.1:5050/api/rag \
  -H 'Content-Type: application/json' \
  -d '{"query":"How should Hubei mobility communities be interpreted?","top_k":3}'
```

## Boundary

The control flow is real: the Agent calls a tool, receives an observation, and then answers from that observation.

The intelligence layer is not: planner routing, tool outputs, and retrieval evidence are all deterministic mock/demo implementations.
