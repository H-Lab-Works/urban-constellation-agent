"""LLM answer synthesis for RAG with Ollama fallback to templates."""

from __future__ import annotations


def ollama_available(model: str = "qwen2:7b") -> bool:
    try:
        import ollama

        pulled = [m["name"] for m in ollama.list().get("models", [])]
        return any(model in name for name in pulled)
    except Exception:
        return False


def format_evidence(retrieved: list[dict]) -> str:
    lines = []
    for item in retrieved:
        topic = item.get("topic", "general")
        region = item.get("region", "general")
        lines.append(f"[{item['id']}|{topic}|{region}] {item['text']}")
    return "\n".join(lines)


def template_answer(query: str, retrieved: list[dict]) -> str:
    if not retrieved:
        return "No relevant planning knowledge was retrieved for this query."

    citations = ", ".join(item["id"] for item in retrieved[:3])
    evidence = " ".join(item["text"] for item in retrieved[:3])
    return (
        f"For the question '{query}', the retrieved planning evidence suggests: {evidence} "
        f"(sources: {citations})."
    )


def synthesize_answer(
    query: str,
    retrieved: list[dict],
    *,
    model: str = "qwen2:7b",
) -> tuple[str, str]:
    """Return (answer_text, generation_backend)."""
    if not retrieved:
        return template_answer(query, retrieved), "template"

    if not ollama_available(model):
        return template_answer(query, retrieved), "template"

    import ollama

    evidence = format_evidence(retrieved)
    citations = ", ".join(item["id"] for item in retrieved)
    system = (
        "You are an urban planning assistant. Answer ONLY from the provided evidence. "
        "If the evidence is insufficient, say so explicitly. "
        f"Cite source ids inline like [doc-id]. Available sources: {citations}."
    )
    user = f"Evidence:\n{evidence}\n\nQuestion: {query}"

    try:
        response = ollama.chat(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )
        answer = response["message"]["content"].strip()
        if answer:
            return answer, f"ollama ({model})"
    except Exception:
        pass

    return template_answer(query, retrieved), "template"
