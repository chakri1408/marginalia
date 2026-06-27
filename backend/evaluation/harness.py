import json
import random
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from sqlmodel import Session

import config
from database import EvalRun, engine
from evaluation.metrics import judge_answer, score_retrieval
from pipeline.generation import generate
from pipeline.retrieval import retrieve

MAX_WORKERS = 8


def _load(notebook_id: str) -> list[dict]:
    path = config.KB_TEST_FILES.get(notebook_id)
    if not path or not Path(path).exists():
        raise FileNotFoundError(f"No test file for {notebook_id}")
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def _by_category(rows: list[dict]) -> dict[str, list[dict]]:
    buckets = defaultdict(list)
    for r in rows:
        buckets[r.get("category", "uncategorized")].append(r)
    return buckets


def _sample(rows: list[dict], n_per_category: int) -> list[dict]:
    out = []
    for items in _by_category(rows).values():
        out.extend(items if len(items) <= n_per_category else random.sample(items, n_per_category))
    return out


def _aggregate(per_item: list[dict], keys: list[str]) -> dict:
    def mean(items):
        return {k: round(sum(i["scores"][k] for i in items) / len(items), 4) for k in keys} if items else {k: 0 for k in keys}
    cats = defaultdict(list)
    for it in per_item:
        cats[it["category"]].append(it)
    return {"overall": mean(per_item), "per_category": {c: mean(v) for c, v in cats.items()}}


def _bump(run_id: str):
    """Increment the live completed counter in its own short-lived session."""
    with Session(engine) as s:
        run = s.get(EvalRun, run_id)
        m = dict(run.metrics or {})
        m["completed"] = m.get("completed", 0) + 1
        run.metrics = m
        s.add(run)
        s.commit()


def _run_pooled(rows, work, run_id):
    per_item = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
        futures = [ex.submit(work, r) for r in rows]
        for fut in as_completed(futures):
            per_item.append(fut.result())
            _bump(run_id)
    return per_item


def _retrieval_work(row):
    chunks, _ = retrieve(row["notebook_id"], row["question"])
    texts = [c["text"] for c in chunks]
    return {"category": row.get("category", "uncategorized"),
            "scores": score_retrieval(row.get("keywords", []), texts)}


def _answer_work(row):
    chunks, _ = retrieve(row["notebook_id"], row["question"])
    texts = [c["text"] for c in chunks]
    answer, _ = generate(row["question"], chunks)
    scores = judge_answer(row["question"], answer, row.get("reference_answer", ""), texts)
    return {"category": row.get("category", "uncategorized"), "scores": scores}


def run_eval_job(run_id: str, notebook_id: str, kind: str, n_per_category: int):
    try:
        rows = _load(notebook_id)
        for r in rows:
            r["notebook_id"] = notebook_id

        if kind == "retrieval":
            used, work, keys = rows, _retrieval_work, ["keyword_hit_rate", "full_coverage", "mrr", "ndcg_binary"]
        else:
            used, work, keys = _sample(rows, n_per_category), _answer_work, ["faithfulness", "correctness", "relevance"]

        # initialise progress
        with Session(engine) as s:
            run = s.get(EvalRun, run_id)
            run.sample_size = len(used)
            run.metrics = {"status": "running", "completed": 0, "total": len(used)}
            s.add(run); s.commit()

        per_item = _run_pooled(used, work, run_id)
        result = _aggregate(per_item, keys)

        with Session(engine) as s:
            run = s.get(EvalRun, run_id)
            run.metrics = {"status": "done", "completed": len(used), "total": len(used), **result}
            s.add(run); s.commit()
    except Exception as e:
        with Session(engine) as s:
            run = s.get(EvalRun, run_id)
            run.metrics = {"status": "error", "error": str(e)}
            s.add(run); s.commit()