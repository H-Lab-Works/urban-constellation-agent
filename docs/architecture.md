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

`prototype/` is runnable end to end with deterministic mock tools. It is not a production model-training stack, but it does demonstrate the intended backend control flow: ReAct planning, tool execution, observation handling, FAISS retrieval, and Flask API exposure.
