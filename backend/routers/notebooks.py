import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

import config
from database import Notebook, Source, get_session
from pipeline.ingestion import purge_notebook
from schemas import CreateNotebookResp, NotebookOut, RenameRequest

router = APIRouter(prefix="/api/notebooks", tags=["notebooks"])


@router.post("", response_model=CreateNotebookResp)
def create_notebook(session: Session = Depends(get_session)):
    nb = Notebook(id=str(uuid.uuid4()), type="user", title="Untitled notebook")
    session.add(nb)
    session.commit()
    return CreateNotebookResp(id=nb.id, title=nb.title)


@router.get("", response_model=list[NotebookOut])
def list_notebooks(session: Session = Depends(get_session)):
    rows = session.exec(select(Notebook).order_by(Notebook.created_at.desc())).all()
    return rows


@router.get("/{notebook_id}", response_model=NotebookOut)
def get_notebook(notebook_id: str, session: Session = Depends(get_session)):
    nb = session.get(Notebook, notebook_id)
    if not nb:
        raise HTTPException(404, "Notebook not found")
    return nb


@router.delete("/{notebook_id}")
def wipe_notebook(notebook_id: str, session: Session = Depends(get_session)):
    if notebook_id in config.DEFAULT_NOTEBOOK_IDS:
        raise HTTPException(403, "Default notebooks are read-only")
    purge_notebook(session, notebook_id)
    return {"deleted": notebook_id}

@router.patch("/{notebook_id}", response_model=NotebookOut)
def rename_notebook(notebook_id: str, body: RenameRequest, session: Session = Depends(get_session)):
    nb = session.get(Notebook, notebook_id)
    if not nb:
        raise HTTPException(404, "Notebook not found")
    if nb.type == "default":
        raise HTTPException(403, "Default notebooks cannot be renamed")
    title = body.title.strip()[:80] or "Untitled notebook"
    nb.title = title
    session.add(nb)
    session.commit()
    session.refresh(nb)
    return nb