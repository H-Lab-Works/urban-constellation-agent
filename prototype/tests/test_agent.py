"""Unit tests for CoreAgent using the RuleBasedPlanner (no Ollama required)."""

import json

import pytest

from flowmind.agent.core_agent import CoreAgent, RuleBasedPlanner, _extract_year, _extract_city_pair


@pytest.fixture
def agent() -> CoreAgent:
    return CoreAgent(planner=RuleBasedPlanner())


class TestCoreAgent:
    def test_run_returns_answer(self, agent: CoreAgent) -> None:
        result = agent.run("Analyze Hubei macro urban structure")
        assert "answer" in result
        assert isinstance(result["answer"], str)
        assert len(result["answer"]) > 0

    def test_run_returns_trace(self, agent: CoreAgent) -> None:
        result = agent.run("Predict flow from Wuhan to Xiangyang in 2026")
        assert "trace" in result
        assert len(result["trace"]) >= 1

    def test_trace_has_thought_field(self, agent: CoreAgent) -> None:
        result = agent.run("Analyze Hubei macro urban structure")
        for step in result["trace"]:
            assert "thought" in step

    def test_macro_query_uses_correct_tool(self, agent: CoreAgent) -> None:
        result = agent.run("Analyze Hubei macro urban structure")
        actions = [step.get("action", {}) for step in result["trace"] if step.get("action")]
        assert any(a.get("name") == "analyze_macro_structure" for a in actions)

    def test_policy_query_uses_causal_tool(self, agent: CoreAgent) -> None:
        result = agent.run("What is the policy impact on Wuhan to Xiangyang flows?")
        actions = [step.get("action", {}) for step in result["trace"] if step.get("action")]
        assert any(a.get("name") == "run_causal_inference" for a in actions)

    def test_prediction_query_uses_predict_tool(self, agent: CoreAgent) -> None:
        result = agent.run("Forecast flow from Wuhan to Xiangyang in 2030")
        actions = [step.get("action", {}) for step in result["trace"] if step.get("action")]
        assert any(a.get("name") == "predict_flow" for a in actions)

    def test_observation_present_in_trace(self, agent: CoreAgent) -> None:
        result = agent.run("Analyze Hubei macro urban structure")
        steps_with_obs = [s for s in result["trace"] if s.get("observation")]
        assert len(steps_with_obs) >= 1

    def test_messages_alternating_roles(self, agent: CoreAgent) -> None:
        result = agent.run("Analyze Hubei macro urban structure")
        roles = [m["role"] for m in result["messages"]]
        assert roles[0] == "system"
        assert roles[1] == "user"

    def test_unknown_tool_returns_error(self, agent: CoreAgent) -> None:
        bad_call = {"name": "nonexistent_tool", "arguments": {}}
        obs = agent._execute_tool(bad_call)
        assert obs["status"] == "error"


class TestHelpers:
    def test_extract_year_found(self) -> None:
        assert _extract_year("flow in 2028", default=2024) == 2028

    def test_extract_year_default(self) -> None:
        assert _extract_year("no year here", default=2024) == 2024

    def test_extract_city_pair_known(self) -> None:
        pair = _extract_city_pair("flow from Wuhan to Xiangyang")
        assert pair == ["Wuhan", "Xiangyang"]

    def test_extract_city_pair_fallback(self) -> None:
        pair = _extract_city_pair("some unknown cities")
        assert len(pair) == 2
