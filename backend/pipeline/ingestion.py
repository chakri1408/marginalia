import uuid
from pathlib import Path

import fitz
import tiktoken
from qdrant_client import models
from sqlmodel import Session, select

import config
from clients import complete, embed_texts, qdrant, sparse_embed
from database import EvalRun, Notebook, QueryTrace, Source
from pipeline.chunking import semantic_chunk

_enc = tiktoken.get_encoding("cl100k_base")

_CTX_PROMPT = (
    "<document>\n{doc}\n</document>\n\n"
    "Here is a chunk from that document:\n<chunk>\n{chunk}\n</chunk>\n\n"
    "Give a short single sentence (max 25 words) situating this chunk within the "
    "document to improve search retrieval. Respond with ONLY that sentence."
)


def ensure_collection():
    client = qdrant()
    if client.collection_exists(config.COLLECTION):
        return
    client.create_collection(
        collection_name=config.COLLECTION,
        vectors_config={"dense": models.VectorParams(
            size=config.EMBED_DIM, distance=models.Distance.COSINE)},
        sparse_vectors_config={"sparse": models.SparseVectorParams()},
    )


def parse_file(path: str) -> list[dict]:
    p = Path(path)
    if p.suffix.lower() == ".pdf":
        blocks = []
        with fitz.open(path) as doc:
            for i, page in enumerate(doc, start=1):
                txt = page.get_text().strip()
                if txt:
                    blocks.append({"text": txt, "page": i})
        return blocks
    return [{"text": p.read_text(encoding="utf-8", errors="ignore"), "page": None}]


def _truncate(text: str, n: int = 2000) -> str:
    toks = _enc.encode(text)
    return _enc.decode(toks[:n]) if len(toks) > n else text


def _context_line(doc_text: str, chunk_text: str) -> str:
    msg = [{"role": "user",
            "content": _CTX_PROMPT.format(doc=_truncate(doc_text), chunk=chunk_text)}]
    return complete(msg).strip().replace("\n", " ")


def prepare_points(notebook_id: str, path: str,
                   contextualize: bool = config.ENABLE_CONTEXTUAL,
                   display_name: str | None = None):
    source_name = display_name or Path(path).name
    blocks = parse_file(path)
    chunks = semantic_chunk(blocks, source=source_name) 
    if not chunks:
        return [], 0

    doc_text = "\n\n".join(b["text"] for b in blocks)
    if contextualize:
        to_embed = [f"{_context_line(doc_text, c['text'])}\n\n{c['text']}" for c in chunks]
    else:
        to_embed = [c["text"] for c in chunks]

    dense = embed_texts(to_embed)
    sparse = sparse_embed(to_embed)

    points = [
        models.PointStruct(
            id=str(uuid.uuid4()),
            vector={"dense": d,
                    "sparse": models.SparseVector(
                        indices=s.indices.tolist(), values=s.values.tolist())},
            payload={"notebook_id": notebook_id, "text": c["text"],
                     "source": c["source"], "page": c["page"],
                     "chunk_index": c["chunk_index"]},
        )
        for c, d, s in zip(chunks, dense, sparse)
    ]
    return points, len(chunks)

def maybe_autotitle(session: Session, notebook_id: str):
    """If a user notebook is still 'Untitled', name it from its first chunks."""
    nb = session.get(Notebook, notebook_id)
    if not nb or nb.type != "user" or nb.title != "Untitled notebook":
        return
    pts = qdrant().scroll(
        collection_name=config.COLLECTION,
        scroll_filter=models.Filter(must=[models.FieldCondition(
            key="notebook_id", match=models.MatchValue(value=notebook_id))]),
        limit=5, with_payload=True,
    )[0]
    if not pts:
        return
    sample = "\n\n".join(p.payload.get("text", "")[:300] for p in pts)
    try:
        title = complete([{"role": "user", "content":
            "Give a short, specific title (3-6 words, no quotes) for a notebook "
            f"containing these excerpts:\n\n{sample}"}]).strip().strip('"')[:80]
        if title:
            nb.title = title
            session.add(nb)
            session.commit()
    except Exception:
        pass

def ingest_source(notebook_id: str, source_id: str, path: str, session: Session,
                  contextualize: bool = False):
    src = session.get(Source, source_id)
    try:
        src.status = "ingesting"
        session.add(src)
        session.commit()
        points, n = prepare_points(notebook_id, path, contextualize=contextualize,
                                   display_name=src.filename)
        if points:
            qdrant().upsert(collection_name=config.COLLECTION, points=points)
        src.status, src.num_chunks = "ready", n
        session.add(src)
        session.commit()
        maybe_autotitle(session, notebook_id)
    except Exception:
        src.status = "error"
        session.add(src)
        session.commit()
        raise

def clear_notebook(session: Session, notebook_id: str):
    """Delete all of a notebook's data (chunks, sources, traces, evals) but keep the notebook."""
    qdrant().delete(
        collection_name=config.COLLECTION,
        points_selector=models.FilterSelector(filter=models.Filter(
            must=[models.FieldCondition(
                key="notebook_id", match=models.MatchValue(value=notebook_id))])),
    )
    for tbl in (Source, QueryTrace, EvalRun):
        for row in session.exec(select(tbl).where(tbl.notebook_id == notebook_id)).all():
            session.delete(row)
    session.commit()


def purge_notebook(session: Session, notebook_id: str):
    clear_notebook(session, notebook_id)
    nb = session.get(Notebook, notebook_id)
    if nb:
        session.delete(nb)
        session.commit()

    qdrant().delete(
        collection_name=config.COLLECTION,
        points_selector=models.FilterSelector(filter=models.Filter(
            must=[models.FieldCondition(
                key="notebook_id", match=models.MatchValue(value=notebook_id))])),
    )
    for tbl in (Source, QueryTrace, EvalRun):
        for row in session.exec(select(tbl).where(tbl.notebook_id == notebook_id)).all():
            session.delete(row)
    nb = session.get(Notebook, notebook_id)
    if nb:
        session.delete(nb)
    session.commit()