"""Unit tests for FlowTools mock tool layer."""

import pytest

from flowmind.tools.flow_tools import FlowTools


@pytest.fixture
def tools() -> FlowTools:
    return FlowTools()


class TestPredictFlow:
    def test_returns_required_fields(self, tools: FlowTools) -> None:
        result = tools.predict_flow("Wuhan", "Xiangyang", 2025)
        assert "origin_city" in result
        assert "dest_city" in result
        assert "future_year" in result
        assert "predicted_flow_index" in result
        assert "confidence" in result

    def test_deterministic_for_same_input(self, tools: FlowTools) -> None:
        r1 = tools.predict_flow("Wuhan", "Xiangyang", 2025)
        r2 = tools.predict_flow("Wuhan", "Xiangyang", 2025)
        assert r1 == r2

    def test_different_city_pairs_produce_different_values(self, tools: FlowTools) -> None:
        r1 = tools.predict_flow("Wuhan", "Xiangyang", 2025)
        r2 = tools.predict_flow("Beijing", "Shanghai", 2025)
        assert r1["predicted_flow_index"] != r2["predicted_flow_index"]

    def test_future_year_changes_prediction(self, tools: FlowTools) -> None:
        r_near = tools.predict_flow("Wuhan", "Xiangyang", 2025)
        r_far = tools.predict_flow("Wuhan", "Xiangyang", 2035)
        # Different years must produce different values (hash seed is year-independent).
        assert r_near["predicted_flow_index"] != r_far["predicted_flow_index"]

    def test_confidence_in_valid_range(self, tools: FlowTools) -> None:
        result = tools.predict_flow("Wuhan", "Yichang", 2026)
        assert 0.0 < result["confidence"] <= 1.0


class TestCausalInference:
    def test_returns_required_fields(self, tools: FlowTools) -> None:
        result = tools.run_causal_inference(
            ["Wuhan", "Xiangyang"], "railway station opening", 2021
        )
        assert "net_impact" in result
        assert "p_value" in result
        assert "policy_name" in result
        assert "treated_city_pair" in result

    def test_deterministic_for_same_input(self, tools: FlowTools) -> None:
        r1 = tools.run_causal_inference(["Wuhan", "Xiangyang"], "railway", 2021)
        r2 = tools.run_causal_inference(["Wuhan", "Xiangyang"], "railway", 2021)
        assert r1 == r2

    def test_p_value_between_zero_and_one(self, tools: FlowTools) -> None:
        result = tools.run_causal_inference(["Wuhan", "Xiangyang"], "highway", 2020)
        assert 0.0 < result["p_value"] < 1.0

    def test_different_policies_produce_different_impacts(self, tools: FlowTools) -> None:
        r1 = tools.run_causal_inference(["Wuhan", "Xiangyang"], "railway station opening", 2021)
        r2 = tools.run_causal_inference(["Wuhan", "Xiangyang"], "industrial park opening", 2021)
        assert r1["net_impact"] != r2["net_impact"]


class TestMacroStructure:
    def test_hubei_returns_known_structure(self, tools: FlowTools) -> None:
        result = tools.analyze_macro_structure("Hubei Province")
        assert result["core_city"] == "Wuhan"
        assert "Xiangyang" in result["sub_centers"]
        assert "Yichang" in result["sub_centers"]

    def test_hubei_lowercase_alias(self, tools: FlowTools) -> None:
        result = tools.analyze_macro_structure("hubei")
        assert result["core_city"] == "Wuhan"

    def test_unknown_region_returns_generic(self, tools: FlowTools) -> None:
        result = tools.analyze_macro_structure("Unknown Region")
        assert "structure" in result
        assert result["core_city"] == "largest migration hub"

    def test_potential_nodes_present(self, tools: FlowTools) -> None:
        result = tools.analyze_macro_structure("Hubei Province")
        assert len(result.get("potential_nodes", [])) > 0
