import os
from dotenv import load_dotenv
from pathlib import Path
load_dotenv()

_ROOT = Path(__file__).resolve().parent.parent

LLM_MODEL       = os.getenv("LLM_MODEL", "gpt-4o-mini")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
RERANK_MODEL    = os.getenv("RERANK_MODEL", "Xenova/ms-marco-MiniLM-L-6-v2")
SPARSE_MODEL    = os.getenv("SPARSE_MODEL", "Qdrant/bm25")

QDRANT_PATH = os.getenv("QDRANT_PATH", "./data/qdrant")
DB_PATH     = os.getenv("DB_PATH", "./data/app.db")
COLLECTION  = "chunks"
EMBED_DIM   = 1536

# Ensure the parent directories exist
Path(QDRANT_PATH).parent.mkdir(parents=True, exist_ok=True)
Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

NOTEBOOK_TTL_HOURS = int(os.getenv("NOTEBOOK_TTL_HOURS", "24"))
MAX_UPLOAD_MB      = int(os.getenv("MAX_UPLOAD_MB", "20"))
MAX_FILES          = int(os.getenv("MAX_FILES", "10"))
DEFAULT_NOTEBOOK_IDS = ["default-kb-1", "default-kb-2"]
ENABLE_CONTEXTUAL = os.getenv("ENABLE_CONTEXTUAL", "true").lower() == "true"

RETRIEVE_K   = int(os.getenv("RETRIEVE_K", "30"))     # fused hybrid candidates
RERANK_TOP_N = int(os.getenv("RERANK_TOP_N", "6"))    # kept after rerank
ENABLE_HYDE  = os.getenv("ENABLE_HYDE", "true").lower() == "true"

KB_TEST_FILES = {
    "default-kb-1": _ROOT / "kb" / "knowledge-base" / "tests_1.jsonl",
    "default-kb-2": _ROOT / "kb" / "Nivara_Assurance_Technologies" / "tests_2.jsonl",
}

