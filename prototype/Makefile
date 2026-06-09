# Urban Constellation backend prototype — common commands.
# Requires Python 3.11+ and (optionally) Docker.

VENV   := .venv
PYTHON := $(VENV)/bin/python
PIP    := $(VENV)/bin/pip
PYTEST := $(VENV)/bin/pytest

.PHONY: install run-agent run-rag run-api test docker-build docker-run clean

## ── setup ──────────────────────────────────────────────────────────────────

install:
	python3 -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
	@echo "✓  Virtual environment ready.  Activate with: source $(VENV)/bin/activate"

## ── run ────────────────────────────────────────────────────────────────────

run-agent:
	PYTHONPATH=. $(PYTHON) flowmind/agent/core_agent.py

run-rag:
	PYTHONPATH=. $(PYTHON) flowmind/rag/simple_rag.py "How should Hubei's urban structure be analyzed?"

run-api:
	PYTHONPATH=. $(PYTHON) flowmind/api.py

## ── test ───────────────────────────────────────────────────────────────────

test:
	PYTHONPATH=. $(PYTEST) tests/ -v

## ── docker ─────────────────────────────────────────────────────────────────

docker-build:
	docker build -t urban-constellation .

docker-run:
	docker run --rm -p 5050:5050 urban-constellation

## ── misc ────────────────────────────────────────────────────────────────────

clean:
	rm -rf $(VENV) __pycache__ .pytest_cache
