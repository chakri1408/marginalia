import asyncio
from contextlib import asynccontextmanager
from datetime import timedelta
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
import config
from database import engine, init_db, Notebook, _now
from pipeline.ingestion import purge_notebook
from routers import notebooks, sources, chat, evals
from clients import init_qdrant, close_qdrant

async def ttl_loop():
    while True:
        cutoff = _now() - timedelta(hours=config.NOTEBOOK_TTL_HOURS)
        with Session(engine) as s:
            old = s.exec(select(Notebook).where(
                Notebook.type == "user", Notebook.created_at < cutoff)).all()
            for nb in old:
                purge_notebook(s, nb.id)
        await asyncio.sleep(3600)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    init_qdrant()                       # open the local client once
    task = asyncio.create_task(ttl_loop())
    yield
    task.cancel()
    close_qdrant()                      # release the lock cleanly

app = FastAPI(title="Production RAG", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=[config.FRONTEND_ORIGIN],
                   allow_methods=["*"], allow_headers=["*"])
for r in (notebooks, sources, chat, evals):
    app.include_router(r.router)