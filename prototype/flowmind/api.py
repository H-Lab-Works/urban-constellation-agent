import os

from flask import Flask, jsonify, request

from flowmind.agent.core_agent import CoreAgent
from flowmind.rag.simple_rag import FaissRagDemo
from flowmind.tools.flow_tools import FlowTools


app = Flask(__name__)
agent = CoreAgent()
tools = FlowTools()
rag = FaissRagDemo.from_json(os.getenv("RAG_DOCUMENT_PATH", "config/rag_documents.json"))


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/api/agent")
def run_agent():
    payload = request.get_json(silent=True) or {}
    query = payload.get("query", "Analyze Hubei macro urban structure")
    return jsonify(agent.run(query))


@app.post("/api/rag")
def run_rag():
    payload = request.get_json(silent=True) or {}
    query = payload.get("query", "How should Hubei's urban structure be analyzed?")
    top_k = int(payload.get("top_k", 3))
    return jsonify(rag.answer(query, top_k))


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
    app.run(
        host=os.getenv("FLASK_HOST", "127.0.0.1"),
        port=int(os.getenv("FLASK_PORT", 5050)),
        debug=os.getenv("FLASK_DEBUG", "false").lower() == "true",
    )
