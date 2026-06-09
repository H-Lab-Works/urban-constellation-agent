<div align="center">

<img src="assets/banner.png" alt="Urban Constellation banner" width="100%" />

# Urban Constellation Agent

**城市星图 · Urban mobility intelligence for smart city planning**

[![Competition](https://img.shields.io/badge/竞赛-智慧城市三等奖-2563EB?style=for-the-badge)](docs/competition.md)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](prototype/requirements.txt)
[![Flask](https://img.shields.io/badge/Flask-API-000000?style=for-the-badge&logo=flask&logoColor=white)](prototype/flowmind/api.py)
[![Agent](https://img.shields.io/badge/Agent-Rule--based_Planner-7C3AED?style=for-the-badge)](prototype/flowmind/agent/core_agent.py)
[![RAG](https://img.shields.io/badge/RAG-TF--IDF_Demo-059669?style=for-the-badge)](prototype/flowmind/rag/simple_rag.py)
[![JavaScript Demo](https://img.shields.io/badge/JavaScript-Demo-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](demo/index.html)
[![Proposal](https://img.shields.io/badge/Proposal-Qwen--7B-6D28D9?style=for-the-badge)](docs/architecture.md)
[![Portfolio](https://img.shields.io/badge/Type-Portfolio-64748B?style=for-the-badge)](docs/background.md)
[![Demo](https://img.shields.io/badge/Video-Bilibili-00A1D6?style=for-the-badge&logo=bilibili&logoColor=white)](https://www.bilibili.com/video/BV1WyEm6WEut/)
[![GitHub](https://img.shields.io/badge/GitHub-H--Lab--Works-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/H-Lab-Works/urban-constellation-agent)

[Demo Video](https://www.bilibili.com/video/BV1WyEm6WEut/) · [Run Locally](#run-locally) · [Backend Prototype](#backend-prototype) · [Architecture](docs/architecture.md) · [Competition](docs/competition.md)

</div>

---

An urban mobility analysis and AI decision-support Agent prototype for smart city planning. The project explores a human-centered planning workflow: translating migration-flow patterns into interactive maps, city-pair prediction, policy-effect evaluation, future scenario simulation, and macro urban-structure insight.

This repository is a portfolio-ready version of **Urban Constellation**. It focuses on a runnable frontend demo, a Bilibili walkthrough, a minimal backend control-flow prototype, and clearly scoped mock tooling.

## Highlights

- National urban-flow network visualization with city coordinates and GeoJSON maps.
- City-pair flow prediction with origin, destination, and target-year controls.
- Policy-effect evaluation with simulated net impact and decision-support reporting.
- Future scenario simulation with adjustable planning-investment intensity.
- Macro urban-structure insight for Hubei, including network skeletons, Louvain communities, city hierarchy, and AI-style analysis reports.
- Multi-turn ReAct Agent with swappable planner (Ollama LLM or rule-based fallback), sentence-transformers embedding RAG, mock tools, Flask API, unit tests, and Docker support.

## Demo

[![Watch on Bilibili](https://img.shields.io/badge/Watch-Full_Demo-00A1D6?style=for-the-badge&logo=bilibili&logoColor=white)](https://www.bilibili.com/video/BV1WyEm6WEut/)

**[▶ Watch the full demo video on Bilibili](https://www.bilibili.com/video/BV1WyEm6WEut/)**

### Run Locally

Clone or download the full repository first. The demo cannot run from `index.html` alone because it depends on local JavaScript, CSS, GeoJSON, and city-coordinate data files.

```bash
git clone https://github.com/H-Lab-Works/urban-constellation-agent.git
cd urban-constellation-agent/demo
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser.

The demo uses:

- `demo/index.html`
- `demo/script.js`
- `demo/style.css`
- `demo/data/china.json`
- `demo/data/hubei.json`
- `demo/data/china_city_coords.csv`

### Troubleshooting

- If the page is blank, make sure the command is run inside the `demo/` folder.
- If the map does not load, do not open the file with `file://`; use the local HTTP server above.

## Technical Direction

The competition proposal described this target architecture:

```text
Natural language request
  -> domain LLM planner
  -> RAG retrieval over migration and planning knowledge
  -> tool execution layer
  -> visualization and decision report
```

Planned production stack in the proposal:

- Base model: Qwen-7B-Chat
- Fine-tuning: QLoRA / LoRA for domain tool-calling behavior
- Retrieval: hybrid embedding + keyword search over migration corpora
- Tools: flow prediction, causal-effect evaluation, community detection, multi-scale network analysis

What is implemented in `prototype/` today:

- Multi-turn ReAct control flow with message history and tool observations
- OllamaPlanner for real LLM inference (requires local Ollama); RuleBasedPlanner as fallback
- Sentence-transformers embedding RAG (auto-falls back to TF-IDF without the package)
- 28-note planning corpus covering causal inference, network analysis, forecasting, and urban science
- Hash-based deterministic mock tools (clearly labelled)
- Flask API, unit tests (34), Dockerfile, Makefile

## Backend Prototype

```bash
cd prototype
make install   # creates .venv and installs dependencies
make test      # runs 34 unit tests
make run-api   # starts Flask API on port 5050
```

Or step by step:

```bash
cd prototype
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. python3 flowmind/agent/core_agent.py
```

Example API request:

```bash
curl -X POST http://127.0.0.1:5050/api/agent \
  -H 'Content-Type: application/json' \
  -d '{"query":"Analyze Hubei macro urban structure"}'
```

Example RAG request:

```bash
curl -X POST http://127.0.0.1:5050/api/rag \
  -H 'Content-Type: application/json' \
  -d '{"query":"How should Hubei mobility communities be interpreted?","top_k":3}'
```

## Repository Structure

```text
.
├── assets/        # Banner and portfolio assets
├── demo/          # Runnable static front-end demo
├── docs/          # Background, architecture, sample output, and competition notes
└── prototype/     # Agent, RAG, simulation, Flask API, tests, Dockerfile, Makefile
```

## My Contribution

- Defined the project positioning around human-centered urban flow intelligence.
- Designed the Agent workflow that maps natural language planning questions to analysis tools.
- Organized the population-flow analysis scenarios, including prediction, policy evaluation, future simulation, and macro structure insight.
- Built and packaged the competition demo narrative, technical proposal, and final presentation storyline.
- Consolidated this portfolio version into a runnable, reviewable GitHub project.

## Competition Result

The project won a third prize in the China Graduate Smart City Technology and Creative Design Competition. Personal certificates and official proof files are intentionally excluded from this portfolio repository to avoid exposing private information; they can be provided separately when needed.

## Notes

Large model files, raw migration data, raw submission packages, certificates, official proof files, and files containing private contact details are intentionally excluded from this portfolio repository.

The demo video is hosted on [Bilibili](https://www.bilibili.com/video/BV1WyEm6WEut/).
