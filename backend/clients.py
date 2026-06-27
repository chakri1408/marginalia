from functools import lru_cache

import litellm
from fastembed import SparseTextEmbedding
from fastembed.rerank.cross_encoder import TextCrossEncoder
from qdrant_client import QdrantClient
from tenacity import retry, stop_after_attempt, wait_exponential

import config

_EMBED_BATCH = 128
_retry = retry(wait=wait_exponential(multiplier=1, min=2, max=30),
               stop=stop_after_attempt(6), reraise=True)

_qdrant_client: QdrantClient | None = None


def init_qdrant() -> QdrantClient:
    """Open the single local client. Called once at app startup."""
    global _qdrant_client
    if _qdrant_client is None:
        _qdrant_client = QdrantClient(path=config.QDRANT_PATH)
    return _qdrant_client


def qdrant() -> QdrantClient:
    """Accessor used everywhere else. Opens lazily if not already open
    (so seed.py / ask.py still work as standalone scripts)."""
    return init_qdrant()


def close_qdrant() -> None:
    """Release the local file lock deterministically. Called at shutdown."""
    global _qdrant_client
    if _qdrant_client is not None:
        _qdrant_client.close()
        _qdrant_client = None


@lru_cache
def sparse_model() -> SparseTextEmbedding:
    return SparseTextEmbedding(model_name=config.SPARSE_MODEL)


@lru_cache
def reranker() -> TextCrossEncoder:
    return TextCrossEncoder(model_name=config.RERANK_MODEL)


@_retry
def _embed_batch(texts: list[str]) -> list[list[float]]:
    resp = litellm.embedding(model=config.EMBEDDING_MODEL, input=texts)
    return [d["embedding"] for d in resp.data]


def embed_texts(texts: list[str]) -> list[list[float]]:
    out: list[list[float]] = []
    for i in range(0, len(texts), _EMBED_BATCH):
        out.extend(_embed_batch(texts[i:i + _EMBED_BATCH]))
    return out


@_retry
def complete(messages: list[dict], model: str | None = None, **kw) -> str:
    resp = litellm.completion(model=model or config.LLM_MODEL, messages=messages, **kw)
    return resp.choices[0].message.content


def sparse_embed(texts: list[str]):
    return list(sparse_model().embed(texts))


def rerank(query: str, docs: list[str]):
    return list(reranker().rerank(query, docs))