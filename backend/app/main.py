from uuid import uuid4

import fitz
from fastapi import File, HTTPException, UploadFile
from app.services.document_processor import(extract_pdf_pages, chunk_pages,)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel, Field

from app.services.rag_service import generate_answer

from app.services.vector_store import (
    client,
    COLLECTION_NAME, 
    replace_document_chunks,
    get_indexed_documents, 
    search_document_chunks,
)


app = FastAPI(
    title="Advanced RAG Document Intelligence API",
    description="Document ingestion, semantic retrieval and cited AI answers.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173",],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "project": "Advanced RAG Document Intelligence",
        "status": "running",
    }

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "rag-backend",
    }

MAX_FILE_SIZE = 10 * 1024 * 1024 # 10 MB

@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    filename = file.filename or "document.pdf"

    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported",)

    try:
        pdf_bytes = await file.read(MAX_FILE_SIZE + 1)

    finally:
        await file.close()

    if len(pdf_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="PDF exceeds the 10MB limit.",
        )

    try:
        pages = extract_pdf_pages(pdf_bytes)
    except (fitz.FileDataError, ValueError) as exc:
        raise HTTPException(
            status_code=400,
            detail="Invalid or unreadable PDF.",
        ) from exc

    if not pages:
        raise HTTPException(
            status_code=422,
            detail="No extractable text found in this PDF",
        )

    chunks = chunk_pages(pages)
    document_id = str(uuid4())

    try:
        stored_chunks = replace_document_chunks(
            document_id=document_id,
            filename=filename,
            chunks=chunks,
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to index document.",
        )

    return {
        "document_id": document_id,
        "filename": filename,
        "pages_processed": len(pages),
        "chunks_stored": stored_chunks,
        "status": "indexed",
    }

class SearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=1000)
    limit: int = Field(default=5, ge=1, le=20)
    document_id: str | None = None

@app.post("/api/search")
def search_documents(request: SearchRequest):
    try:
        results = search_document_chunks(
            query=request.query,
            limit=request.limit,
            document_id=request.document_id,
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Document search failed.",
        )

    return {
        "query": request.query,
        "total_results": len(results),
        "results": results,
    }

@app.get("/api/documents/count")
def document_count():
    if not client.collection_exists(COLLECTION_NAME):
        return {"chunks_stored": 0}

    count = client.count(
        collection_name=COLLECTION_NAME,
        exact=True,
    )

    return {
        "chunks_stored": count.count,
    }

class AskRequest(BaseModel):
    question: str = Field(min_length=2, max_length=1000)
    limit: int = Field(default=5, ge=1, le=10)

@app.post("/api/ask")
def ask_document(request: AskRequest):
    try:
        result = generate_answer(
            question=request.question,
            limit=request.limit,
        )
        return {
            "question": request.question,
            **result,
        }
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="AI answer generation failed. Check backend logs.",
        )

@app.get("/api/documents")
def list_documents():
    documents = get_indexed_documents()

    return {
        "total_documents": len(documents),
        "documents": documents,
    }