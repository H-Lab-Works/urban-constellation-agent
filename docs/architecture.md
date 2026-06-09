# Architecture

## Agent Flow

```text
User query
  -> intent understanding
  -> tool selection
  -> data/model execution
  -> visualization
  -> decision report
```

## Layers

| Layer | Competition proposal | Portfolio prototype in this repo |
| --- | --- | --- |
| Frontend demo | Maps, controls, metrics, and AI-style reports | Static JS demo with mock narrative outputs |
| Agent planner | Domain LLM planner for tool calling | Rule-based keyword planner with injectable interface |
| RAG knowledge layer | Migration corpora + hybrid retrieval | 12 English planning notes + TF-IDF + FAISS |
| Tool layer | STGCN, SCM, Louvain, multi-scale analysis | SHA-256 hash pseudo-random mock tools |
| Report layer | Planning recommendations from model outputs | Template-style summaries from mock observations |

## Model Proposal

The technical proposal used the following configuration as the target direction:

| Area | Choice |
| --- | --- |
| Base model | Qwen-7B-Chat |
| Fine-tuning | QLoRA, 4-bit quantization, LoRA rank 64 |
| Training data | 1.2K+ high-quality instruction pairs |
| Retrieval | Hybrid embedding and keyword search |
| Knowledge base | Multi-year migration and planning data |

## Prototype Boundary

`prototype/` demonstrates backend control flow only:

- ReAct loop with tool observations appended to message history
- Rule-based planner, not real model inference
- Hash-based mock tools, not trained models
- TF-IDF retrieval over 12 hand-written planning notes, not embedding hybrid RAG
- Flask API for local inspection

Missing for a reproducible research prototype:

- Unit tests
- CI
- Docker or one-click startup scripts
- Production dependencies beyond the 4 packages in `requirements.txt`
