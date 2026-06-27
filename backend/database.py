from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, create_engine, Session
from sqlalchemy import Column, JSON
import config

engine = create_engine(f"sqlite:///{config.DB_PATH}",
                       connect_args={"check_same_thread": False})

def _now(): return datetime.now(timezone.utc)

class Notebook(SQLModel, table=True):
    id: str = Field(primary_key=True)
    type: str = "user"
    title: str = "Untitled notebook"
    created_at: datetime = Field(default_factory=_now)

class Source(SQLModel, table=True):
    id: str = Field(primary_key=True)
    notebook_id: str = Field(index=True)
    filename: str
    status: str = "pending"
    num_chunks: int = 0
    created_at: datetime = Field(default_factory=_now)

class QueryTrace(SQLModel, table=True):
    id: str = Field(primary_key=True)
    notebook_id: str = Field(index=True)
    question: str
    answer: str = ""
    trace: dict = Field(default_factory=dict, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=_now)

class EvalRun(SQLModel, table=True):
    id: str = Field(primary_key=True)
    notebook_id: str = Field(index=True)
    kind: str
    sample_size: int = 0
    metrics: dict = Field(default_factory=dict, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=_now)

def init_db(): SQLModel.metadata.create_all(engine)
def get_session():
    with Session(engine) as s: yield s