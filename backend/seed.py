import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from sqlmodel import Session

import config
from clients import qdrant
from database import Notebook, Source, engine, init_db
from pipeline.ingestion import ensure_collection, prepare_points, purge_notebook

KB_DIR = Path("kb")
EXTS = {".pdf", ".md", ".txt"}
MAX_WORKERS = 8
DEFAULTS = [
    ("default-kb-1", "knowledge-base", "Knowledge Base"),
    ("default-kb-2", "Nivara_Assurance_Technologies", "Nivara Assurance Technologies"),
]


def seed():
    init_db()
    # Hard reset: drop the entire collection so reseed is fully clean
    client = qdrant()
    if client.collection_exists(config.COLLECTION):
        client.delete_collection(config.COLLECTION)

    ensure_collection()
    with Session(engine) as session:
        tasks = []  # (notebook_id, source_id, path)
        for nb_id, folder, title in DEFAULTS:
            purge_notebook(session, nb_id)
            session.add(Notebook(id=nb_id, type="default", title=title))
            session.commit()
            files = sorted(f for f in (KB_DIR / folder).rglob("*")
                           if f.is_file() and f.suffix.lower() in EXTS)
            print(f"[{title}] {len(files)} files")
            for f in files:
                src_id = str(uuid.uuid4())
                session.add(Source(id=src_id, notebook_id=nb_id, filename=f.name))
                session.commit()
                tasks.append((nb_id, src_id, str(f)))

        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as ex:
            futures = {ex.submit(prepare_points, nb, path): (sid, Path(path).name)
                       for nb, sid, path in tasks}
            for fut in as_completed(futures):
                sid, name = futures[fut]
                src = session.get(Source, sid)
                try:
                    points, n = fut.result()
                    if points:
                        qdrant().upsert(collection_name=config.COLLECTION, points=points)
                    src.status, src.num_chunks = "ready", n
                    print(f"  ✓ {name} ({n} chunks)")
                except Exception as e:
                    src.status = "error"
                    print(f"  ✗ {name}: {e}")
                session.add(src)
                session.commit()

    print("Total points in Qdrant:",
          qdrant().count(collection_name=config.COLLECTION).count)


if __name__ == "__main__":
    seed()