from transformers import pipeline
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse
from models.schemas import QueryRequest, QueryResponse
from services.embedding import generate_embedding
from services.file_utils import extract_text_from_file, chunk_text
from config import QA_MODEL

router = APIRouter()

qa_pipeline = pipeline("question-answering", model=QA_MODEL)

@router.post("/ingest/", response_class=JSONResponse)
async def ingest(request: Request, file: UploadFile = File(...)):
    """
    Ingest a document file, extract text, generate embedding, and store in DB.
    """
    db_pool = request.app.state.db_pool
    model = request.app.state.model

    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 5MB).")
    text = await extract_text_from_file(file, content)
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="No text extracted from file.")
    
    # Chunk text
    chunks = chunk_text(text, max_chunk_size=500)

    async with db_pool.acquire() as conn:
        for chunk in chunks:
            if chunk.strip():
                embedding = await generate_embedding(chunk, model)
                embedding_str = "[" + ",".join([str(x) for x in embedding.tolist()]) + "]"
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
    model = request.app.state.model

    question = query_request.question
    if not question or not question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    query_embedding = await generate_embedding(question, model)
    embedding_str = "[" + ",".join([str(x) for x in query_embedding]) + "]"
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT content FROM documents
            ORDER BY embedding <-> $1::vector
            LIMIT 5
        """, embedding_str)
    context = " ".join([r["content"] for r in rows]) if rows else ""
    if context:
        result = qa_pipeline(question=question, context=context)
        answer = result.get("answer", "No answer found.")
    else:
        answer = "No relevant documents found."
    return QueryResponse(answer=answer)