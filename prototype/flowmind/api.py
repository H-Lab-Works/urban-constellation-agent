from flask import Flask, jsonify, request

from flowmind.agent.core_agent import CoreAgent
from flowmind.tools.flow_tools import FlowTools


app = Flask(__name__)
agent = CoreAgent()
tools = FlowTools()


@app.post("/api/agent")
def run_agent():
    payload = request.get_json(silent=True) or {}
    query = payload.get("query", "Analyze Hubei macro urban structure")
    return jsonify(agent.run(query))


@app.post("/api/predict-flow")
def predict_flow():
    payload = request.get_json(silent=True) or {}
    result = tools.predict_flow(
        origin_city=payload.get("origin_city", "Wuhan"),
        dest_city=payload.get("dest_city", "Xiangyang"),
        future_year=int(payload.get("future_year", 2026)),
    )
    return jsonify(result)


@app.post("/api/evaluate-policy")
def evaluate_policy():
    payload = request.get_json(silent=True) or {}
    result = tools.run_causal_inference(
        treated_city_pair=payload.get("treated_city_pair", ["Wuhan", "Xiangyang"]),
        policy_name=payload.get("policy_name", "railway station opening"),
        policy_year=int(payload.get("policy_year", 2021)),
    )
    return jsonify(result)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5050, debug=True)

