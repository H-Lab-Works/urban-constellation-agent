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
| RAG knowledge layer | Migration corpora + hybrid retrieval | 28 planning notes + embedding RAG (TF-IDF fallback) |
| Tool layer | STGCN, SCM, Louvain, multi-scale analysis | SHA-256 hash pseudo-random mock tools |
| Report layer | Planning recommendations from model outputs | Template-style summaries from mock observations |
| Quality | CI, tests, containerization | pytest suite, GitHub Actions, Dockerfile, Makefile |

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

- ReAct loop with tool observations appended to message history
- Swappable planner backend (Ollama or rule-based fallback)
- Hash-based mock tools, not trained models
- Embedding or TF-IDF retrieval over a 28-note planning corpus
- Flask API for local inspection
- Unit tests, GitHub Actions CI, Docker, and Makefile

Not included: raw migration data and trained model weights.
