import argparse
import json
from dataclasses import dataclass


@dataclass
class SimulationModels:
    """Small deterministic simulators for decision evaluation and scenarios."""

    def causal_simulator(
        self,
        origin_city: str,
        dest_city: str,
        policy_year: int,
        observed_after_policy: float,
    ) -> dict:
        counterfactual = round(observed_after_policy * 0.88, 2)
        net_effect = round(observed_after_policy - counterfactual, 2)
        return {
            "origin_city": origin_city,
            "dest_city": dest_city,
            "policy_year": policy_year,
            "observed_after_policy": observed_after_policy,
            "counterfactual_baseline": counterfactual,
            "net_effect": net_effect,
            "method": "deterministic_synthetic_control_demo",
        }

    def scenario_simulator(
        self,
        origin_city: str,
        dest_city: str,
        baseline_prediction: float,
        policy_strength: str,
    ) -> dict:
        strength_factors = {
            "low": 1.05,
            "medium": 1.15,
            "high": 1.30,
        }
        factor = strength_factors.get(policy_strength, strength_factors["medium"])
        simulated_value = round(baseline_prediction * factor, 2)
        return {
            "origin_city": origin_city,
            "dest_city": dest_city,
            "baseline_prediction": baseline_prediction,
            "policy_strength": policy_strength,
            "simulated_value": simulated_value,
            "increment": round(simulated_value - baseline_prediction, 2),
        }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run deterministic simulation demos.")
    parser.add_argument("--origin", default="Wuhan")
    parser.add_argument("--dest", default="Xiangyang")
    parser.add_argument("--baseline", type=float, default=70.0)
    parser.add_argument("--strength", choices=["low", "medium", "high"], default="medium")
    args = parser.parse_args()

    simulator = SimulationModels()
    print(
        json.dumps(
            {
                "causal": simulator.causal_simulator(
                    origin_city=args.origin,
                    dest_city=args.dest,
                    policy_year=2021,
                    observed_after_policy=args.baseline,
                ),
                "scenario": simulator.scenario_simulator(
                    origin_city=args.origin,
                    dest_city=args.dest,
                    baseline_prediction=args.baseline,
                    policy_strength=args.strength,
                ),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

