# Prototype Notes

This folder contains a runnable minimal prototype for the portfolio version.

## What Runs

- `flowmind/agent/core_agent.py`: a multi-turn ReAct Agent. Tool observations are appended to the message history before the Agent produces a final answer.
- `flowmind/tools/flow_tools.py`: deterministic mock tools for flow prediction, policy evaluation, and macro-structure analysis.
- `flowmind/rag/simple_rag.py`: a minimal FAISS retrieval example over configurable planning notes.
- `flowmind/models/simulator.py`: deterministic causal and scenario simulation demos.
- `flowmind/api.py`: a lightweight Flask API that exposes the Agent and mock tools.
- `config/rag_documents.json`: sample retrieval corpus for the RAG demo.
- `models.yaml`: documented target-model configuration for the production direction.

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

## Run The FAISS RAG Demo

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

The tools are mock implementations, but the control flow is real: the Agent reasons, calls a tool, receives an observation, and then answers from that observation.

The `.env.example` file documents local runtime values. The prototype currently reads defaults directly from code so it can run without environment setup.
