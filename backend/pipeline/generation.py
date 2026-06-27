import re

from clients import complete

_SYS = (
    "You are Marginalia, a precise research assistant that answers questions about a "
    "specific collection of documents. Answer using ONLY the numbered context below, "
    "and cite the chunks you use in square brackets, e.g. [1] or [2][3]. "
    "Write in clear, professional prose. If the context does not contain the answer, "
    "say so plainly and do not guess."
)


def _format_context(chunks) -> str:
    out = []
    for i, c in enumerate(chunks, start=1):
        page = f" p.{c['page']}" if c.get("page") else ""
        out.append(f"[{i}] (source: {c.get('source', '?')}{page})\n{c['text']}")
    return "\n\n".join(out)


def generate(query: str, chunks, model: str | None = None):
    if not chunks:
        return "I don't have enough information to answer that.", []
    messages = [
        {"role": "system", "content": _SYS},
        {"role": "user", "content": f"Context:\n{_format_context(chunks)}\n\nQuestion: {query}"},
    ]
    answer = complete(messages, model=model).strip()
    cited = sorted({int(n) for n in re.findall(r"\[(\d+)\]", answer)})
    citations = [
        {"n": n, "source": chunks[n - 1].get("source"), "page": chunks[n - 1].get("page")}
        for n in cited if 1 <= n <= len(chunks)
    ]
    return answer, citations