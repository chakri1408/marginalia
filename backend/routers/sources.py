import shutil
import tempfile
import uuid
from pathlib import Path

from fastapi import (APIRouter, BackgroundTasks, Depends, File, HTTPException,
                     UploadFile)
from sqlmodel import Session, select

import config
from database import Notebook, Source, engine, get_session
from pipeline.ingestion import ingest_source, clear_notebook
from schemas import SourceOut

router = APIRouter(prefix="/api/notebooks/{notebook_id}/sources", tags=["sources"])
_ALLOWED = {".pdf", ".md", ".txt"}


def _ingest_job(notebook_id: str, source_id: str, path: str):
    with Session(engine) as session:       # own session for the background thread
        try:
            ingest_source(notebook_id, source_id, path, session)
        finally:
            Path(path).unlink(missing_ok=True)


@router.get("", response_model=list[SourceOut])
def list_sources(notebook_id: str, session: Session = Depends(get_session)):
    return session.exec(select(Source).where(Source.notebook_id == notebook_id)).all()


@router.post("", response_model=list[SourceOut])
async def upload_sources(
    notebook_id: str,
    background: BackgroundTasks,
    files: list[UploadFile] = File(...),
    session: Session = Depends(get_session),
):
    nb = session.get(Notebook, notebook_id)
    if not nb:
        raise HTTPException(404, "Notebook not found")
    if nb.type == "default":
        raise HTTPException(403, "Default notebooks are read-only")

    existing = session.exec(select(Source).where(Source.notebook_id == notebook_id)).all()
    if len(existing) + len(files) > config.MAX_FILES:
        raise HTTPException(400, f"Max {config.MAX_FILES} files per notebook")

    created = []
    total = 0
    for f in files:
        ext = Path(f.filename).suffix.lower()
        if ext not in _ALLOWED:
            raise HTTPException(400, f"Unsupported file type: {ext}")
        tmp = Path(tempfile.gettempdir()) / f"{uuid.uuid4()}{ext}"
        with tmp.open("wb") as out:
            shutil.copyfileobj(f.file, out)
        total += tmp.stat().st_size
        if total > config.MAX_UPLOAD_MB * 1024 * 1024:
            tmp.unlink(missing_ok=True)
            raise HTTPException(400, f"Upload exceeds {config.MAX_UPLOAD_MB} MB")

        src = Source(id=str(uuid.uuid4()), notebook_id=notebook_id,
                     filename=f.filename, status="pending")
        session.add(src)
        session.commit()
        background.add_task(_ingest_job, notebook_id, src.id, str(tmp))
        created.append(src)

    return created


@router.delete("")
def clear_sources(notebook_id: str, session: Session = Depends(get_session)):
    nb = session.get(Notebook, notebook_id)
    if not nb:
        raise HTTPException(404, "Notebook not found")
    if nb.type == "default":
        raise HTTPException(403, "Default notebooks are read-only")
    clear_notebook(session, notebook_id)
    return {"cleared": notebook_id}