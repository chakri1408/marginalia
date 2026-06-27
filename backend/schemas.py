from datetime import datetime
from pydantic import BaseModel


class CreateNotebookResp(BaseModel):
    id: str
    title: str


class NotebookOut(BaseModel):
    id: str
    type: str
    title: str
    created_at: datetime


class SourceOut(BaseModel):
    id: str
    filename: str
    status: str
    num_chunks: int


class ChatRequest(BaseModel):
    question: str
    history: list[dict] = []      # [{"role": "user"|"assistant", "content": "..."}]


class ChatResponse(BaseModel):
    answer: str
    citations: list[dict]
    trace: dict


class EvalRequest(BaseModel):
    kind: str            # "retrieval" | "answer"
    n_per_category: int = 3


class EvalResult(BaseModel):
    id: str
    kind: str
    sample_size: int
    metrics: dict
    created_at: datetime

class RenameRequest(BaseModel):
    title: str