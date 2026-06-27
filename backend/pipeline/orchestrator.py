import uuid

from sqlmodel import Session

from clients import complete
from database import QueryTrace
from pipeline.generation import generate
from pipeline.guard import is_injection
from pipeline.resolver import resolve_query
from pipeline.retrieval import retrieve

_REFUSAL = ("That message looks like it may be trying to manipulate the assistant, so "
            "I can't process it. Please rephrase as a normal question about the documents.")

_INTENT_PROMPT = (
    "Classify the user's message. Reply with exactly one word:\n"
    "- CHAT if it is a greeting, small talk, or a question about you/the assistant "
    "(e.g. 'hi', 'who are you', 'what can you do').\n"
    "- SEARCH if it is a question that should be answered from documents.\n\n"
    "Message: {q}"
)

_CHAT_PROMPT = (
    "You are Marginalia, a research assistant that answers questions about a collection "
    "of documents. The user said something conversational rather than asking about the "
    "documents. Reply briefly and warmly (1-2 sentences), and invite them to ask a "
    "question about the documents. Do not invent facts.\n\nUser: {q}"
)


def _intent(question: str) -> str:
    try:
        verdict = complete([{"role": "user", "content": _INTENT_PROMPT.format(q=question)}]).strip().upper()
        return "CHAT" if verdict.startswith("CHAT") else "SEARCH"
    except Exception:
        return "SEARCH"  # fail toward retrieval


def run_query(notebook_id: str, question: str, history: list[dict] | None = None,
              session: Session | None = None) -> dict:
    if is_injection(question):
        result = {"question": question, "answer": _REFUSAL, "citations": [],
                  "trace": {"blocked": True, "reason": "prompt_injection"}}
        _save(session, notebook_id, result)
        return result

    # Non-retrieval path: greetings / meta questions
    if _intent(question) == "CHAT":
        try:
            answer = complete([{"role": "user", "content": _CHAT_PROMPT.format(q=question)}]).strip()
        except Exception:
            answer = "Hello — ask me a question about the documents and I'll answer with sources."
        result = {"question": question, "answer": answer, "citations": [],
                  "trace": {"blocked": False, "no_retrieval": True, "original_query": question}}
        _save(session, notebook_id, result)
        return result

    resolved = resolve_query(question, history)
    chunks, hyde_text = retrieve(notebook_id, resolved)
    answer, citations = generate(resolved, chunks)
    result = {
        "question": question,
        "answer": answer,
        "citations": citations,
        "trace": {"blocked": False, "no_retrieval": False, "original_query": question,
                  "resolved_query": resolved, "hyde_text": hyde_text, "final_chunks": chunks},
    }
    _save(session, notebook_id, result)
    return result


def _save(session: Session | None, notebook_id: str, result: dict):
    if session is None:
        return
    session.add(QueryTrace(
        id=str(uuid.uuid4()), notebook_id=notebook_id,
        question=result["question"], answer=result["answer"], trace=result["trace"]))
    session.commit()