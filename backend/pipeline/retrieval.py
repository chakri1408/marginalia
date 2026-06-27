from qdrant_client import models

import config
from clients import complete, embed_texts, qdrant, rerank, sparse_embed

_HYDE_PROMPT = (
    "Write a short, plausible passage (2-3 sentences) that directly answers the "
    "question as if it were an excerpt from a source document. Do not hedge or say "
    "you are unsure — just write the hypothetical answer.\n\nQuestion: {q}"
)


def _hyde(query: str) -> str:
    if not config.ENABLE_HYDE:
        return query
    try:
        return complete([{"role": "user", "content": _HYDE_PROMPT.format(q=query)}]).strip()
    except Exception:
        return query


def _nb_filter(notebook_id: str) -> models.Filter:
    return models.Filter(must=[models.FieldCondition(
        key="notebook_id", match=models.MatchValue(value=notebook_id))])


def _hybrid_search(notebook_id: str, dense_text: str, sparse_text: str, k: int):
    dense_vec = embed_texts([dense_text])[0]
    sp = sparse_embed([sparse_text])[0]
    sparse_vec = models.SparseVector(indices=sp.indices.tolist(), values=sp.values.tolist())
    flt = _nb_filter(notebook_id)
    res = qdrant().query_points(
        collection_name=config.COLLECTION,
        prefetch=[
            models.Prefetch(query=dense_vec, using="dense", limit=k, filter=flt),
            models.Prefetch(query=sparse_vec, using="sparse", limit=k, filter=flt),
        ],
        query=models.FusionQuery(fusion=models.Fusion.RRF),
        limit=k,
        with_payload=True,
    )
    return res.points


def retrieve(notebook_id: str, query: str, k: int | None = None, top_n: int | None = None):
    k = k or config.RETRIEVE_K
    top_n = top_n or config.RERANK_TOP_N

    hyde_text = _hyde(query)
    points = _hybrid_search(notebook_id, dense_text=hyde_text, sparse_text=query, k=k)
    if not points:
        return [], hyde_text

    docs = [p.payload["text"] for p in points]
    scores = rerank(query, docs)                       # cross-encoder on the REAL question
    ranked = sorted(zip(points, scores), key=lambda x: x[1], reverse=True)[:top_n]

    chunks = [{
        "text": p.payload["text"],
        "source": p.payload.get("source"),
        "page": p.payload.get("page"),
        "score": float(score),
    } for p, score in ranked]
    return chunks, hyde_text