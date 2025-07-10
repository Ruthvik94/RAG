from transformers import pipeline
import asyncio
import redis.asyncio as redis
import json
import base64
from services.file_utils import extract_text_from_file, chunk_text
from services.embedding import generate_embedding
from config import REDIS_HOST, REDIS_PORT, QA_MODEL

REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}"
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

qa_pipeline = pipeline("question-answering", model=QA_MODEL)

async def handle_ingest(redis_conn, db_pool, model):
    pubsub = redis_conn.pubsub()
    await pubsub.subscribe("ingest_requests")
    print("Subscribed to ingest_requests")
    async for message in pubsub.listen():
        if message is None or message['type'] != 'message':
            continue
        data = json.loads(message['data'])
        file_content = base64.b64decode(data['file_content'])
        filename = data['filename']
        request_id = data['request_id']
        print(f"Received ingest request: filename={filename}, request_id={request_id}")

        # File size check
        if len(file_content) > MAX_FILE_SIZE:
            print(f"File too large: {filename}")
            await redis_conn.publish("ingest_responses", json.dumps({
                "status": "error", "detail": "File too large (max 5MB).", "request_id": request_id
            }))
            continue

        # Minimal dummy for extract_text_from_file
        class DummyUploadFile:
            def __init__(self, filename):
                self.filename = filename
        dummy_file = DummyUploadFile(filename)

        text = await extract_text_from_file(dummy_file, file_content)
        if not text or not text.strip():
            print("No text extracted from file, publishing error response")
            await redis_conn.publish("ingest_responses", json.dumps({
                "status": "error", "detail": "No text extracted", "request_id": request_id
            }))
            continue

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

        # Convert embedding to pgvector string format
        embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"
        async with db_pool.acquire() as conn:
            await conn.execute(
                "INSERT INTO documents (content, embedding) VALUES ($1, $2)",
                text, embedding_str
            )
        print("Publishing ingest success response")
        await redis_conn.publish("ingest_responses", json.dumps({
            "status": "success", "request_id": request_id
        }))

async def handle_query(redis_conn, db_pool, model):
    pubsub = redis_conn.pubsub()
    await pubsub.subscribe("query_requests")
    print("Subscribed to query_requests")
    async for message in pubsub.listen():
        if message is None or message['type'] != 'message':
            continue
        data = json.loads(message['data'])
        request_id = data['request_id']
        print(f"Received query request: request_id={request_id}")
        question = data['question']
        if not question or not question.strip():
            print("Empty question, publishing error response")
            await redis_conn.publish("query_responses", json.dumps({
                "status": "error", "detail": "Question cannot be empty.", "request_id": request_id
            }))
            continue
        query_embedding = await generate_embedding(question, model)
        embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"
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
        print("Publishing query success response")
        await redis_conn.publish("query_responses", json.dumps({
            "status": "success", "answer": answer, "request_id": request_id
        }))

async def start_redis_worker(app):
    redis_conn = redis.from_url(REDIS_URL)
    db_pool = app.state.db_pool
    model = app.state.model
    await asyncio.gather(
        handle_ingest(redis_conn, db_pool, model),
        handle_query(redis_conn, db_pool, model)
    )