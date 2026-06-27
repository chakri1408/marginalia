import re

import numpy as np
import tiktoken

from clients import embed_texts

_enc = tiktoken.get_encoding("cl100k_base")
BUFFER = 1                 # sentences of context on each side before embedding
BREAKPOINT_PCT = 90        # split where consecutive distance exceeds this percentile
MAX_TOKENS = 600           # hard ceiling per chunk
MIN_TOKENS = 50            # merge anything smaller into its neighbour


def _ntok(t: str) -> int:
    return len(_enc.encode(t))


def _sentences(blocks: list[dict]) -> list[tuple[str, int | None]]:
    out = []
    for b in blocks:
        for s in re.split(r"(?<=[.!?])\s+|\n{2,}", b["text"]):
            s = s.strip()
            if s:
                out.append((s, b.get("page")))
    return out


def _windows(sents: list[str]) -> list[str]:
    return [" ".join(sents[max(0, i - BUFFER): i + BUFFER + 1]) for i in range(len(sents))]


def _hard_split(text: str, page) -> list[dict]:
    toks = _enc.encode(text)
    if len(toks) <= MAX_TOKENS:
        return [{"text": text, "page": page}]
    return [{"text": _enc.decode(toks[i:i + MAX_TOKENS]), "page": page}
            for i in range(0, len(toks), MAX_TOKENS)]


def semantic_chunk(blocks: list[dict], source: str) -> list[dict]:
    sp = _sentences(blocks)
    if not sp:
        return []
    sents = [s for s, _ in sp]
    pages = [p for _, p in sp]

    if len(sents) <= 3:
        groups = [list(range(len(sents)))]
    else:
        embs = np.array(embed_texts(_windows(sents)))
        embs = embs / (np.linalg.norm(embs, axis=1, keepdims=True) + 1e-9)
        dists = 1 - np.sum(embs[:-1] * embs[1:], axis=1)
        threshold = np.percentile(dists, BREAKPOINT_PCT)
        groups, cur = [], [0]
        for i, d in enumerate(dists):
            if d > threshold:
                groups.append(cur)
                cur = []
            cur.append(i + 1)
        groups.append(cur)

    raw = []
    for g in groups:
        text = " ".join(sents[i] for i in g).strip()
        if text:
            raw.extend(_hard_split(text, pages[g[0]]))

    merged: list[dict] = []
    for c in raw:
        if merged and _ntok(c["text"]) < MIN_TOKENS:
            merged[-1]["text"] += " " + c["text"]
        else:
            merged.append(c)

    return [{"text": c["text"], "source": source, "page": c["page"], "chunk_index": i}
            for i, c in enumerate(merged)]