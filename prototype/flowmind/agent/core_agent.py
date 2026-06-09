"""Urban Constellation core ReAct agent.

Three planner backends are provided:

- OllamaPlanner  — calls a local Ollama model (real LLM inference, preferred).
- RuleBasedPlanner — keyword routing, no model required (fallback / offline).

`build_planner()` tries OllamaPlanner first, falls back to RuleBasedPlanner
when Ollama is not reachable.

The planner interface is a plain callable:
    (messages: list[dict], user_query: str) -> ModelStep

so any model adapter (OpenAI, Anthropic, vLLM …) can be swapped in.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from typing import Any, Callable

from flowmind.tools.flow_tools import FlowTools

ToolCall = dict[str, Any]
ModelStep = dict[str, Any]

_TOOL_SCHEMA = """
Available tools (respond with strict JSON matching one of these):

1. predict_flow
   {"tool_call": {"name": "predict_flow", "arguments": {"origin_city": "...", "dest_city": "...", "future_year": 2026}}}

2. run_causal_inference
   {"tool_call": {"name": "run_causal_inference", "arguments": {"treated_city_pair": ["...", "..."], "policy_name": "...", "policy_year": 2021}}}

3. analyze_macro_structure
   {"tool_call": {"name": "analyze_macro_structure", "arguments": {"region": "Hubei Province"}}}

When you have enough information to answer, respond with:
   {"final_answer": "...your answer..."}

Always include a "thought" field explaining your reasoning.
"""


class OllamaPlanner:
    """Real LLM inference via a local Ollama server.

    Requires Ollama running locally and a compatible model pulled,
    e.g. `ollama pull qwen2:7b`.
    """

    def __init__(self, model: str = "qwen2:7b") -> None:
        import ollama  # imported here so the rest of the module loads without it

        self._ollama = ollama
        self.model = model

    def __call__(self, messages: list[dict[str, str]], user_query: str) -> ModelStep:
        system = messages[0]["content"] if messages and messages[0]["role"] == "system" else ""
        history = messages[1:]  # drop the system message; we'll pass it separately

        try:
            response = self._ollama.chat(
                model=self.model,
                messages=[
                    {"role": "system", "content": system + "\n\n" + _TOOL_SCHEMA},
                    *history,
                ],
                format="json",
            )
            raw = response["message"]["content"]
            parsed = json.loads(raw)
            if "thought" not in parsed:
                parsed["thought"] = "(no thought provided)"
            return parsed
        except (json.JSONDecodeError, KeyError) as exc:
            return {
                "thought": f"LLM response could not be parsed: {exc}. Falling back to final answer.",
                "final_answer": "I was unable to parse the model response. Please try rephrasing.",
            }

    @staticmethod
    def available(model: str = "qwen2:7b") -> bool:
        """Return True if Ollama is reachable and the target model is available."""
        try:
            import ollama

            pulled = [m["name"] for m in ollama.list().get("models", [])]
            return any(model in name for name in pulled)
        except Exception:
            return False


class RuleBasedPlanner:
    """Keyword-routing fallback planner. No model or network required.

    Routing logic:
    - causal / policy keywords  → run_causal_inference
    - structure / macro keywords → analyze_macro_structure
    - default                    → predict_flow
    After any tool observation the planner produces a final answer.
    """

    def __call__(self, messages: list[dict[str, str]], user_query: str) -> ModelStep:
        observations = [m for m in messages if m["role"] == "tool"]
        if observations:
            latest = json.loads(observations[-1]["content"])
            return {
                "thought": "Tool observation received; summarising result.",
                "final_answer": self._summarize(latest),
            }

        query = user_query.lower()
        if any(kw in query for kw in ["policy", "effect", "impact", "railway", "causal", "因果", "政策"]):
            return {
                "thought": "Query mentions policy evaluation; routing to causal inference tool.",
                "tool_call": {
                    "name": "run_causal_inference",
                    "arguments": {
                        "treated_city_pair": _extract_city_pair(user_query),
                        "policy_name": _extract_policy_name(user_query),
                        "policy_year": _extract_year(user_query, default=2021),
                    },
                },
            }

        if any(kw in query for kw in ["structure", "hubei", "macro", "community", "结构", "湖北", "社群"]):
            return {
                "thought": "Query mentions macro structure; routing to network analysis tool.",
                "tool_call": {
                    "name": "analyze_macro_structure",
                    "arguments": {"region": "Hubei Province"},
                },
            }

        return {
            "thought": "Defaulting to city-pair flow prediction.",
            "tool_call": {
                "name": "predict_flow",
                "arguments": {
                    "origin_city": _extract_city_pair(user_query)[0],
                    "dest_city": _extract_city_pair(user_query)[1],
                    "future_year": _extract_year(user_query, default=2026),
                },
            },
        }

    @staticmethod
    def _summarize(observation: dict) -> str:
        result = observation.get("result", {})
        tool = observation.get("tool", "")
        if tool == "predict_flow":
            return (
                f"Predicted flow index from {result['origin_city']} to "
                f"{result['dest_city']} in {result['future_year']}: "
                f"{result['predicted_flow_index']} (confidence {result['confidence']})."
            )
        if tool == "run_causal_inference":
            pair = " → ".join(result.get("treated_city_pair", []))
            return (
                f"Causal estimate for '{result['policy_name']}' on {pair}: "
                f"net impact = {result['net_impact']}, p-value = {result['p_value']}."
            )
        if tool == "analyze_macro_structure":
            sub = ", ".join(result.get("sub_centers", []))
            return (
                f"{result['region']} shows a '{result['structure']}' pattern. "
                f"Core: {result['core_city']}. Sub-centers: {sub}."
            )
        return json.dumps(result)


def build_planner(model: str = "qwen2:7b") -> OllamaPlanner | RuleBasedPlanner:
    """Return OllamaPlanner if Ollama is reachable, else RuleBasedPlanner."""
    if OllamaPlanner.available(model):
        print(f"[planner] Ollama reachable — using LLM inference ({model})")
        return OllamaPlanner(model)
    print("[planner] Ollama not available — using rule-based fallback")
    return RuleBasedPlanner()


# ── helpers ──────────────────────────────────────────────────────────────────

def _extract_city_pair(text: str) -> list[str]:
    known_pairs = [
        ("Wuhan", "Xiangyang"),
        ("Wuhan", "Yichang"),
        ("Beijing", "Shanghai"),
        ("Shanghai", "Hangzhou"),
        ("武汉", "襄阳"),
        ("武汉", "宜昌"),
    ]
    lowered = text.lower()
    for origin, dest in known_pairs:
        if origin.lower() in lowered and dest.lower() in lowered:
            return [origin, dest]
    return ["Wuhan", "Xiangyang"]


def _extract_policy_name(text: str) -> str:
    kw_map = {
        "railway": "railway station opening",
        "高铁": "high-speed rail opening",
        "highway": "highway opening",
        "高速": "highway opening",
    }
    lower = text.lower()
    for kw, name in kw_map.items():
        if kw in lower:
            return name
    return "planning intervention"


def _extract_year(text: str, default: int) -> int:
    match = re.search(r"\b(20\d{2})\b", text)
    return int(match.group(1)) if match else default


# ── agent ────────────────────────────────────────────────────────────────────

@dataclass
class CoreAgent:
    """Multi-turn ReAct agent with swappable planner backend.

    Usage:
        # Auto-select planner (Ollama if available, else rule-based)
        agent = CoreAgent()

        # Force rule-based (no Ollama needed)
        agent = CoreAgent(planner=RuleBasedPlanner())

        # Use a specific Ollama model
        agent = CoreAgent(planner=OllamaPlanner("qwen2:7b"))
    """

    tool_config: dict | None = None
    planner: Callable[[list[dict[str, str]], str], ModelStep] | None = None
    max_steps: int = 5
    tools: FlowTools = field(init=False)

    def __post_init__(self) -> None:
        self.tools = FlowTools(self.tool_config or {})
        if self.planner is None:
            self.planner = build_planner()

    def run(self, user_query: str) -> dict:
        messages: list[dict[str, str]] = [
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
                    "answer": "Agent stopped: no tool call or final answer produced.",
                    "trace": trace,
                    "messages": messages,
                }

            observation = self._execute_tool(tool_call)
            trace[-1]["action"] = tool_call
            trace[-1]["observation"] = observation
            messages.append({"role": "assistant", "content": json.dumps(model_step)})
            messages.append({"role": "tool", "content": json.dumps(observation)})

        return {
            "answer": "Agent reached the step limit without producing a final answer.",
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

    @staticmethod
    def _system_prompt() -> str:
        return (
            "You are an urban planning AI assistant. "
            "Use the ReAct pattern: think step by step, call one tool at a time, "
            "observe the result, then produce a grounded final answer. "
            "Do not fabricate data; rely only on tool outputs."
        )


if __name__ == "__main__":
    agent = CoreAgent()
    result = agent.run("Analyze Hubei macro urban structure")
    print(json.dumps(result, indent=2, ensure_ascii=False))
