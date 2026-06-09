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
| Agent planner | Domain LLM planner for tool calling | OllamaPlanner when available; RuleBasedPlanner fallback |
| RAG knowledge layer | Migration corpora + hybrid retrieval | 105 planning notes + hybrid BM25/embedding RAG + grounded synthesis |
| Tool layer | STGCN, SCM, Louvain, multi-scale analysis | SHA-256 hash pseudo-random mock tools |
| Report layer | Planning recommendations from model outputs | Tool summaries plus retrieved citations |
| Agent integration | RAG evidence informs planner and final answer | Retrieve → inject context → ReAct tool loop → cited answer |
| Quality | CI, tests, containerization | pytest suite, retrieval eval, GitHub Actions, Dockerfile, Makefile |

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

`prototype/` demonstrates backend control flow:

- Retrieve planning evidence and inject it into the Agent message history
- Swappable planner backend (Ollama or rule-based fallback)
- Hash-based mock tools, not trained models
- Hybrid BM25 + embedding retrieval over a 105-note corpus with metadata/chunking
- Grounded answer synthesis for `/api/rag` (Ollama when available)
- Flask API for local inspection
- Unit tests, retrieval eval set, GitHub Actions CI, Docker, and Makefile

Not included: raw migration data and trained model weights.
