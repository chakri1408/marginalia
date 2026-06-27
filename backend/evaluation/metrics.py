import json
import math
import re

from clients import complete


# ---------- retrieval metrics (keyword-based, LLM-free) ----------

def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower())


def _kw_hits(keywords: list[str], chunk_texts: list[str]) -> list[bool]:
    """Per-chunk: does this chunk contain ANY of the keywords?"""
    kws = [k.lower() for k in keywords]
    return [any(k in _norm(t) for k in kws) for t in chunk_texts]


def keyword_hit_rate(keywords: list[str], chunk_texts: list[str]) -> float:
    """Fraction of keywords found anywhere in the retrieved chunks."""
    if not keywords:
        return 0.0
    blob = _norm(" ".join(chunk_texts))
    found = sum(1 for k in keywords if k.lower() in blob)
    return found / len(keywords)


def full_coverage(keywords: list[str], chunk_texts: list[str]) -> float:
    """1.0 if every keyword is present, else 0.0."""
    if not keywords:
        return 0.0
    blob = _norm(" ".join(chunk_texts))
    return 1.0 if all(k.lower() in blob for k in keywords) else 0.0


def reciprocal_rank(keywords: list[str], chunk_texts: list[str]) -> float:
    """1/rank of the first chunk containing any keyword (0 if none)."""
    hits = _kw_hits(keywords, chunk_texts)
    for i, hit in enumerate(hits, start=1):
        if hit:
            return 1.0 / i
    return 0.0


def ndcg_binary(keywords: list[str], chunk_texts: list[str]) -> float:
    """nDCG with binary relevance (chunk relevant if it holds any keyword)."""
    hits = _kw_hits(keywords, chunk_texts)
    if not any(hits):
        return 0.0
    dcg = sum((1.0 / math.log2(i + 1)) for i, hit in enumerate(hits, start=1) if hit)
    n_rel = sum(hits)
    idcg = sum(1.0 / math.log2(i + 1) for i in range(1, n_rel + 1))
    return dcg / idcg if idcg else 0.0


def score_retrieval(keywords: list[str], chunk_texts: list[str]) -> dict:
    return {
        "keyword_hit_rate": keyword_hit_rate(keywords, chunk_texts),
        "full_coverage": full_coverage(keywords, chunk_texts),
        "mrr": reciprocal_rank(keywords, chunk_texts),
        "ndcg_binary": ndcg_binary(keywords, chunk_texts),
    }


# ---------- answer metric (LLM-as-judge) ----------

_JUDGE_PROMPT = (
    "You are a strict evaluator of a RAG system's answer. Compare the GENERATED answer "
    "to the REFERENCE answer and the retrieved CONTEXT.\n\n"
    "Score each 1-5 (integers):\n"
    "- faithfulness: is the generated answer supported by the CONTEXT (no hallucination)?\n"
    "- correctness: does it match the facts in the REFERENCE answer?\n"
    "- relevance: does it directly address the QUESTION?\n\n"
    "QUESTION:\n{q}\n\nREFERENCE:\n{ref}\n\nCONTEXT:\n{ctx}\n\nGENERATED:\n{gen}\n\n"
    'Respond with ONLY JSON: {{"faithfulness": int, "correctness": int, "relevance": int}}'
)


def judge_answer(question: str, generated: str, reference: str, chunk_texts: list[str]) -> dict:
    ctx = "\n\n".join(chunk_texts)[:6000]
    prompt = _JUDGE_PROMPT.format(q=question, ref=reference, ctx=ctx, gen=generated)
    raw = complete([{"role": "user", "content": prompt}])
    try:
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        data = json.loads(m.group(0))
        return {k: int(data.get(k, 0)) for k in ("faithfulness", "correctness", "relevance")}
    except Exception:
        return {"faithfulness": 0, "correctness": 0, "relevance": 0}