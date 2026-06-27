from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from database import Notebook, QueryTrace, get_session
from pipeline.orchestrator import run_query
from schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/api/notebooks/{notebook_id}", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
def chat(notebook_id: str, body: ChatRequest, session: Session = Depends(get_session)):
    if not session.get(Notebook, notebook_id):
        raise HTTPException(404, "Notebook not found")
    if not body.question.strip():
        raise HTTPException(400, "Empty question")
    result = run_query(notebook_id, body.question, history=body.history)
    return ChatResponse(answer=result["answer"],
                        citations=result["citations"], trace=result["trace"])


@router.get("/traces")
def list_traces(notebook_id: str, session: Session = Depends(get_session)):
    rows = session.exec(
        select(QueryTrace).where(QueryTrace.notebook_id == notebook_id)
        .order_by(QueryTrace.created_at.desc())).all()
    return [{"id": r.id, "question": r.question, "answer": r.answer,
             "trace": r.trace, "created_at": r.created_at} for r in rows]