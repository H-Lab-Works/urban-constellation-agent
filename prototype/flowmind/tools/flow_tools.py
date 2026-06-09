import hashlib
from dataclasses import dataclass


@dataclass
class FlowTools:
    """Deterministic mock tools for the portfolio prototype."""

    config: dict | None = None

    def predict_flow(self, origin_city: str, dest_city: str, future_year: int) -> dict:
        seed = self._stable_seed(origin_city, dest_city, str(future_year))
        baseline = 40 + seed % 35
        growth = 1 + ((future_year - 2024) * 0.035)
        prediction = round(baseline * growth, 2)
        return {
            "origin_city": origin_city,
            "dest_city": dest_city,
            "future_year": future_year,
            "predicted_flow_index": prediction,
            "model": "mock_stgcn_ensemble",
            "confidence": round(0.72 + (seed % 18) / 100, 2),
        }

    def run_causal_inference(
        self,
        treated_city_pair: list[str],
        policy_name: str,
        policy_year: int,
    ) -> dict:
        origin_city, dest_city = treated_city_pair
        seed = self._stable_seed(origin_city, dest_city, policy_name, str(policy_year))
        net_impact = round(8 + (seed % 160) / 10, 2)
        return {
            "treated_city_pair": treated_city_pair,
            "policy_name": policy_name,
            "policy_year": policy_year,
            "net_impact": net_impact,
            "p_value": round(0.01 + (seed % 4) / 100, 3),
            "method": "mock_synthetic_control",
        }

    def analyze_macro_structure(self, region: str) -> dict:
        if region.lower() in {"hubei", "hubei province"}:
            return {
                "region": region,
                "structure": "one core, two sub-centers, multiple potential nodes",
                "core_city": "Wuhan",
                "sub_centers": ["Xiangyang", "Yichang"],
                "potential_nodes": ["Xiaogan", "Jingzhou", "Huanggang"],
                "method": "mock_louvain_and_multiscale_network_analysis",
            }
        return {
            "region": region,
            "structure": "polycentric urban network",
            "core_city": "largest migration hub",
            "method": "mock_louvain_and_multiscale_network_analysis",
        }

    @staticmethod
    def _stable_seed(*parts: str) -> int:
        text = "::".join(parts).encode("utf-8")
        return int(hashlib.sha256(text).hexdigest()[:8], 16)

