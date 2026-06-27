import json
import uuid
from collections import Counter
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlmodel import Session, select

import config
from database import EvalRun, get_session
from evaluation.harness import run_eval_job
from schemas import EvalRequest

router = APIRouter(prefix="/api/notebooks/{notebook_id}/evals", tags=["evals"])


@router.get("")
def list_eval_runs(notebook_id: str, session: Session = Depends(get_session)):
    return session.exec(select(EvalRun).where(EvalRun.notebook_id == notebook_id)
                        .order_by(EvalRun.created_at.desc())).all()


@router.get("/info")
def eval_info(notebook_id: str):
    path = config.KB_TEST_FILES.get(notebook_id)
    if not path or not Path(path).exists():
        raise HTTPException(404, "No test set for this notebook")
    cats = Counter()
    total = 0
    with open(path, encoding="utf-8") as f:
        for line in f:
            if line.strip():
                total += 1
                cats[json.loads(line).get("category", "uncategorized")] += 1
    return {"total": total, "categories": len(cats),
            "max_answer_sample": min(4, *cats.values()) if cats else 0,
            "per_category_max": dict(cats)}


@router.get("/{run_id}")
def get_eval_run(notebook_id: str, run_id: str, session: Session = Depends(get_session)):
    run = session.get(EvalRun, run_id)
    if not run or run.notebook_id != notebook_id:
        raise HTTPException(404, "Run not found")
    return run


@router.post("")
def run_eval(notebook_id: str, body: EvalRequest, background: BackgroundTasks,
             session: Session = Depends(get_session)):
    if notebook_id not in config.KB_TEST_FILES:
        raise HTTPException(403, "Evals run on default knowledge bases only")
    if body.kind not in ("retrieval", "answer"):
        raise HTTPException(400, "kind must be 'retrieval' or 'answer'")
    # keep only the latest run per kind — delete older ones
    old = session.exec(
        select(EvalRun).where(EvalRun.notebook_id == notebook_id, EvalRun.kind == body.kind)
    ).all()
    for r in old:
        session.delete(r)
    session.commit()

    run = EvalRun(id=str(uuid.uuid4()), notebook_id=notebook_id, kind=body.kind,
                  sample_size=0, metrics={"status": "running", "completed": 0, "total": 0})
    session.add(run); session.commit(); session.refresh(run)
    background.add_task(run_eval_job, run.id, notebook_id, body.kind, body.n_per_category)
    return {"id": run.id, "kind": run.kind, "status": "running"}