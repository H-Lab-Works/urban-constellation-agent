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

| Layer | Role |
| --- | --- |
| Frontend demo | Presents maps, controls, metrics, and AI-style reports. |
| Agent planner | Converts natural-language planning questions into tool calls. |
| RAG knowledge layer | Supplies migration data and planning context for report generation. |
| Tool layer | Runs prediction, causal evaluation, community detection, and structure analysis. |
| Report layer | Summarizes outputs into planning recommendations. |

## Model Proposal

The technical proposal used the following configuration as the target direction:

| Area | Choice |
| --- | --- |
| Base model | Qwen-7B-Chat |
| Fine-tuning | QLoRA, 4-bit quantization, LoRA rank 64 |
| Training data | 1.2K+ high-quality instruction pairs |
| Retrieval | Hybrid vector and keyword search |
| Knowledge base | Multi-year migration and planning data |

## Prototype Boundary

`prototype/` preserves interface sketches and simplified logic from the competition handoff package. Some model functions are placeholders, so the production-quality artifact in this repo is the static interactive demo plus the documented architecture.

