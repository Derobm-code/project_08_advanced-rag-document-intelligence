from pathlib import Path
from uuid import uuid4
from threading import Lock

from qdrant_client import QdrantClient, models
from sentence_transformers import SentenceTransformer

COLLECTION_NAME = "document_chunks"

STORAGE_PATH = Path(__file__).resolve().parents[2] / "qdrant_storage"

client = QdrantClient(path=str(STORAGE_PATH))
replacement_lock = Lock()

embedding_model = SentenceTransformer(
    "sentence-transformers/all-MiniLM-L6-v2",
    local_files_only=True,
)

def ensure_collection():
    if not client.collection_exists(COLLECTION_NAME):
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=models.VectorParams(
                size=384,
                distance=models.Distance.COSINE,
            ),
        )


def replace_document_chunks(
    document_id: str,
    filename: str,
    chunks: list[dict],
) -> int:
    if not chunks:
        raise ValueError("Cannot index an empty document.")

    texts = [chunk["text"] for chunk in chunks]
    embeddings = embedding_model.encode(texts, normalize_embeddings=True)

    points = [
        models.PointStruct(
            id=str(uuid4()),
            vector=embedding.tolist(),
            payload={
                "document_id": document_id,
                "filename": filename,
                "page": chunk["page"],
                "text": chunk["text"],
            },
        )
        for chunk, embedding in zip(chunks, embeddings)
    ]

    with replacement_lock:
        ensure_collection()
        client.upsert(
            collection_name=COLLECTION_NAME,
            points=points,
            wait=True,
        )

        client.delete(
            collection_name=COLLECTION_NAME,
            points_selector=models.FilterSelector(
                filter=models.Filter(
                    must_not=[
                        models.FieldCondition(
                            key="document_id",
                            match=models.MatchValue(value=document_id),
                        )
                    ]
                )
            ),
            wait=True,
        )

        stored = client.count(
            collection_name=COLLECTION_NAME,
            exact=True,
        ).count
        if stored != len(points):
            raise RuntimeError(
                f"Expected {len(points)} chunks for {filename}, found {stored}."
            )

    return len(points)


def search_document_chunks(
        query: str,
        limit: int = 5,
        document_id: str | None = None,
) -> list[dict]:
    ensure_collection()

    query_vector = embedding_model.encode(
        query,
        normalize_embeddings=True,
    ).tolist()

    query_filter = None

    if document_id:
        query_filter = models.Filter(
            must=[
                models.FieldCondition(
                    key="document_id",
                    match=models.MatchValue(value=document_id),
                )
            ]
        )

    response = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        query_filter=query_filter,
        limit=limit,
        with_payload=True,
    )

    results = []

    for point in response.points:
        payload = point.payload or {}

        results.append({
            "document_id": payload.get("document_id"),
            "filename": payload.get("filename"),
            "page": payload.get("page"),
            "text": payload.get("text"),
            "score": round(float(point.score), 4),
        })

    return results

def get_indexed_documents() -> list[dict]:
    if not client.collection_exists(COLLECTION_NAME):
        return []

    documents = {}

    offset = None

    while True:
        points, offset = client.scroll(
            collection_name=COLLECTION_NAME,
            limit=100,
            offset=offset,
            with_payload=True,
            with_vectors=False,
        )

        for point in points:
            payload = point.payload or {}
            document_id = payload.get("document_id")

            if document_id:
                documents[document_id] = {
                    "document_id": document_id,
                    "filename": payload.get("filename"),
                }

        if offset is None:
            break

    return list(documents.values())