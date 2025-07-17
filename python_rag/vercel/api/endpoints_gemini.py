# import sys
# import os

# # Get the directory containing this file (/var/task/api/)
# current_dir = os.path.dirname(os.path.abspath(__file__))
# # Get the parent directory (/var/task/)
# parent_dir = os.path.dirname(current_dir)
# # Add parent directory to Python path
# if parent_dir not in sys.path:
#     sys.path.insert(0, parent_dir)

from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse
from .models.schemas import QueryRequest, QueryResponse
from services.file_utils_light import extract_text_from_file, chunk_text_sliding_window
from services.embedding_gemini import (
    generate_document_embedding_gemini,
    generate_query_embedding_gemini,
    get_answer_gemini,
    get_cache_stats
)
# from config import GEMINI_API_KEY
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

@router.post("/ingest/", response_class=JSONResponse)
async def ingest(request: Request, file: UploadFile = File(...)):
    """
    Ingest a document file, extract text, generate embedding, and store in DB.
    """
    db_pool = request.app.state.db_pool

    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 5MB).")
    text = await extract_text_from_file(file, content)
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="No text extracted from file.")
    
    # Chunk text
    chunks = chunk_text_sliding_window(text, chunk_size=400, overlap=50)

    async with db_pool.acquire() as conn:
        for chunk in chunks:
            if chunk.strip():
                embedding = await generate_document_embedding_gemini(chunk)
                embedding_str = "[" + ",".join([str(x) for x in embedding]) + "]"
                await conn.execute(
                    "INSERT INTO documents (content, embedding) VALUES ($1, $2)",
                    chunk, embedding_str
                )
    return {"status": "success"}

@router.post("/query/", response_model=QueryResponse)
async def query(request: Request, query_request: QueryRequest):
    """
    Query the DB for relevant documents and return a generated answer.
    """
    db_pool = request.app.state.db_pool

    question = query_request.question
    if not question or not question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    
    query_embedding = await generate_query_embedding_gemini(question)
    embedding_str = "[" + ",".join([str(x) for x in query_embedding]) + "]"
    
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT content FROM documents
            ORDER BY embedding <-> $1::vector
            LIMIT 5
        """, embedding_str)
    
    context = " ".join([r["content"] for r in rows]) if rows else ""
    if context:
        answer = await get_answer_gemini(question, context)
    else:
        answer = "No relevant documents found."
    
    return QueryResponse(answer=answer)

@router.get("/cache-info/")
async def cache_info():
    """Get cache statistics for monitoring"""
    return get_cache_stats()