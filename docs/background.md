# Project Background

Urban planning often relies on static spatial indicators, while population, industry, and public-service demand keep moving. Urban Constellation asks a practical question: how can planners use natural language to call advanced urban-science analysis tools and quickly understand migration-flow structure and policy impact?

## Problem

- Population mobility changes faster than traditional planning evaluation cycles.
- GIS, network analysis, and machine-learning tools have a high usage barrier.
- General-purpose language models lack city-science tools and data constraints, so their planning conclusions can be hard to trust.

## Product Idea

Urban Constellation uses a model-brain-plus-domain-tools Agent architecture:

- The model brain understands planning questions, decomposes tasks, and drafts reports.
- The RAG layer retrieves migration data, policy context, and domain knowledge.
- The tool layer runs prediction, causal evaluation, community detection, and multi-scale network analysis.
- The frontend turns complex analysis into maps, indicators, and reports.

## Portfolio Scope

This repository is a portfolio version. It prioritizes a runnable demo, a backend control-flow prototype, technical narrative, and competition context.

What is included: static frontend demo, ReAct Agent loop (Ollama or rule-based planner), embedding RAG with TF-IDF fallback, hash-based mock tools, Flask API, unit tests, GitHub Actions CI, Dockerfile, and Makefile.

What is excluded: fine-tuned model weights, STGCN/SCM/Louvain production models, and real migration corpora. Full raw data, training weights, oversized videos, and raw submission packages are also excluded.

