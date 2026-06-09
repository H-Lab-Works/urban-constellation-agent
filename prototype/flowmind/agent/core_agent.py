import json
import re
from dataclasses import dataclass, field
from typing import Any, Callable

from flowmind.tools.flow_tools import FlowTools


ToolCall = dict[str, Any]
ModelStep = dict[str, Any]


@dataclass
class CoreAgent:
    """Minimal multi-turn ReAct agent.

    The default planner is rule-based so the prototype runs without a local LLM.
    A real model adapter can be injected through `planner`.
    """

    tool_config: dict | None = None
    planner: Callable[[list[dict[str, str]], str], ModelStep] | None = None
    max_steps: int = 4
    tools: FlowTools = field(init=False)

    def __post_init__(self) -> None:
        self.tools = FlowTools(self.tool_config or {})
        if self.planner is None:
            self.planner = self._mock_planner

    def run(self, user_query: str) -> dict:
        messages = [
            {"role": "system", "content": self._system_prompt()},
            {"role": "user", "content": user_query},
        ]
        trace: list[dict[str, Any]] = []

        for step_index in range(1, self.max_steps + 1):
            model_step = self.planner(messages, user_query)
            trace.append({"step": step_index, "thought": model_step.get("thought")})

            if model_step.get("final_answer"):
                return {
                    "answer": model_step["final_answer"],
                    "trace": trace,
                    "messages": messages,
                }

            tool_call = model_step.get("tool_call")
            if not tool_call:
                return {
                    "answer": "The agent stopped because no tool call or final answer was produced.",
                    "trace": trace,
                    "messages": messages,
                }

            observation = self._execute_tool(tool_call)
            trace[-1]["action"] = tool_call
            trace[-1]["observation"] = observation
            messages.append({"role": "assistant", "content": json.dumps(model_step)})
            messages.append({"role": "tool", "content": json.dumps(observation)})

        return {
            "answer": "The agent reached the step limit before producing a final answer.",
            "trace": trace,
            "messages": messages,
        }

    def _execute_tool(self, tool_call: ToolCall) -> dict:
        name = tool_call.get("name")
        args = tool_call.get("arguments", {})

        try:
            if name == "predict_flow":
                result = self.tools.predict_flow(
                    origin_city=args["origin_city"],
                    dest_city=args["dest_city"],
                    future_year=int(args["future_year"]),
                )
            elif name == "run_causal_inference":
                result = self.tools.run_causal_inference(
                    treated_city_pair=args["treated_city_pair"],
                    policy_name=args["policy_name"],
                    policy_year=int(args["policy_year"]),
                )
            elif name == "analyze_macro_structure":
                result = self.tools.analyze_macro_structure(region=args["region"])
            else:
                return {"status": "error", "error": f"Unknown tool: {name}"}
        except (KeyError, TypeError, ValueError) as exc:
            return {"status": "error", "error": str(exc), "tool_call": tool_call}

        return {"status": "success", "tool": name, "result": result}

    def _mock_planner(self, messages: list[dict[str, str]], user_query: str) -> ModelStep:
        observations = [m for m in messages if m["role"] == "tool"]
        if observations:
            latest = json.loads(observations[-1]["content"])
            return {
                "thought": "I have received the observation and can now summarize it.",
                "final_answer": self._summarize_observation(latest),
            }

        query = user_query.lower()
        if any(keyword in query for keyword in ["policy", "effect", "impact", "railway"]):
            return {
                "thought": "The user asks for policy impact, so I should run causal inference.",
                "tool_call": {
                    "name": "run_causal_inference",
                    "arguments": {
                        "treated_city_pair": self._extract_city_pair(user_query),
                        "policy_name": self._extract_policy_name(user_query),
                        "policy_year": self._extract_year(user_query, default=2021),
                    },
                },
            }

        if any(keyword in query for keyword in ["structure", "hubei", "macro", "community"]):
            return {
                "thought": "The user asks for macro structure, so I should analyze the urban network.",
                "tool_call": {
                    "name": "analyze_macro_structure",
                    "arguments": {"region": "Hubei Province"},
                },
            }

        return {
            "thought": "The user asks for a city-pair forecast, so I should call the flow predictor.",
            "tool_call": {
                "name": "predict_flow",
                "arguments": {
                    "origin_city": self._extract_city_pair(user_query)[0],
                    "dest_city": self._extract_city_pair(user_query)[1],
                    "future_year": self._extract_year(user_query, default=2026),
                },
            },
        }

    @staticmethod
    def _summarize_observation(observation: dict) -> str:
        result = observation.get("result", {})
        if observation.get("tool") == "predict_flow":
            return (
                f"The predicted flow index from {result['origin_city']} to "
                f"{result['dest_city']} in {result['future_year']} is "
                f"{result['predicted_flow_index']} with confidence {result['confidence']}."
            )
        if observation.get("tool") == "run_causal_inference":
            return (
                f"The estimated net impact of {result['policy_name']} on "
                f"{' to '.join(result['treated_city_pair'])} is {result['net_impact']} "
                f"with p-value {result['p_value']}."
            )
        if observation.get("tool") == "analyze_macro_structure":
            return (
                f"{result['region']} shows a {result['structure']} pattern, with "
                f"{result['core_city']} as the core and "
                f"{', '.join(result.get('sub_centers', []))} as sub-centers."
            )
        return json.dumps(result)

    @staticmethod
    def _extract_city_pair(text: str) -> list[str]:
        known_pairs = [
            ("Wuhan", "Xiangyang"),
            ("Wuhan", "Yichang"),
            ("Beijing", "Shanghai"),
            ("Shanghai", "Hangzhou"),
        ]
        lowered = text.lower()
        for origin, dest in known_pairs:
            if origin.lower() in lowered and dest.lower() in lowered:
                return [origin, dest]
        return ["Wuhan", "Xiangyang"]

    @staticmethod
    def _extract_policy_name(text: str) -> str:
        if "railway" in text.lower():
            return "railway station opening"
        return "planning intervention"

    @staticmethod
    def _extract_year(text: str, default: int) -> int:
        match = re.search(r"\b(20\d{2})\b", text)
        return int(match.group(1)) if match else default

    @staticmethod
    def _system_prompt() -> str:
        return (
            "You are an urban planning Agent. Use ReAct: think, call one tool, "
            "receive the tool observation, then answer. Available tools are "
            "predict_flow, run_causal_inference, and analyze_macro_structure."
        )


if __name__ == "__main__":
    agent = CoreAgent()
    print(json.dumps(agent.run("Analyze Hubei macro urban structure"), indent=2))

