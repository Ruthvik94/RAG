import asyncio
import redis.asyncio as redis
import json
import base64
import hashlib
import time
from utils.logger import logger
from services.embedding_gemini import (
    generate_query_embedding_gemini,
    get_answer_gemini,
    start_heartbeat
)
from services.batch_processor import process_embeddings_batch
from services.text_processor import TextProcessor
from db.document_manager import DocumentManager
from db.database import get_db_pool, create_documents_table
from config import REDIS_URL
from dotenv import load_dotenv

load_dotenv()

class IngestProcessor:
    """Handle document ingestion workflow"""
    
    def __init__(self, db_pool):
        self.text_processor = TextProcessor(max_chunk_size=500)
        self.document_manager = DocumentManager(db_pool)
    
    async def process_ingest_request(self, data: dict) -> dict:
        """Process a complete ingest request with hash-based deduplication"""
        overall_start_time = time.time()
        
        file_content = base64.b64decode(data['file_content'])
        filename = data['filename']
        request_id = data['request_id']
        
        logger.info(f"Processing: {filename} ({len(file_content)} bytes)")
        
        # Validate file size
        validation_start = time.time()
        self.text_processor.validate_file_size(file_content, max_size_mb=5)
        validation_time = time.time() - validation_start
        logger.timing("File validation", validation_time)
        
        # Extract and chunk text
        text_processing_start = time.time()
        text, chunks = await self.text_processor.process_file_content(filename, file_content)
        text_processing_time = time.time() - text_processing_start
        logger.timing("Text extraction & chunking", text_processing_time)
        logger.debug(f"Generated {len(chunks)} chunks")
        
        # Generate hashes for all chunks
        hash_generation_start = time.time()
        chunk_hash_map = {}
        chunk_hashes = []
        for chunk in chunks:
            content_hash = hashlib.sha256(chunk.encode()).hexdigest()
            chunk_hash_map[content_hash] = chunk
            chunk_hashes.append(content_hash)
        hash_generation_time = time.time() - hash_generation_start
        logger.timing("Hash generation", hash_generation_time)
        
        # Bulk check for existing hashes
        dedup_start_time = time.time()
        existing_hashes = await self.document_manager.find_existing_chunk_hashes(chunk_hashes)
        check_time = time.time() - dedup_start_time
        logger.timing("Database deduplication check", check_time)
        
        # Filter out existing chunks
        filtering_start = time.time()
        new_chunks = [chunk_hash_map[h] for h in chunk_hashes if h not in existing_hashes]
        filtering_time = time.time() - filtering_start
        logger.timing("Chunk filtering", filtering_time)
        
        logger.info(f"Processing: {len(new_chunks)}/{len(chunks)} new chunks (skipping {len(existing_hashes)} duplicates)")
        
        if not new_chunks:
            total_time = time.time() - overall_start_time
            logger.info(f"All chunks already exist - Total time: {total_time:.3f}s")
            return {
                "status": "success",
                "request_id": request_id,
                "processed_chunks": 0,
                "skipped_chunks": len(existing_hashes),
                "message": "All chunks already exist",
                "processing_time": f"{total_time:.2f}s"
            }
        
        # Generate embeddings for new chunks only
        embedding_start_time = time.time()
        logger.info(f"Starting embedding generation for {len(new_chunks)} chunks")
        
        # Use Gemini Batch Mode for large files (>500 chunks)
        use_batch_mode = len(new_chunks) > 500
        if use_batch_mode:
            logger.info("Using Gemini Batch Mode for large file processing")
        
        chunk_embedding_pairs = await process_embeddings_batch(
            new_chunks, 
            batch_size=75,
            use_gemini_batch=use_batch_mode
        )
        embedding_time = time.time() - embedding_start_time
        logger.timing("Embedding generation", embedding_time)
        
        # Insert to database with hash-based deduplication
        db_start_time = time.time()
        logger.debug("Starting database insertion")
        await self.document_manager.batch_insert_documents_with_hash(chunk_embedding_pairs, batch_size=100)
        db_time = time.time() - db_start_time
        logger.timing("Database insertion", db_time)
        
        # Calculate total time
        total_time = time.time() - overall_start_time
        
        # Performance summary (always logged)
        logger.performance({
            "file": filename,
            "total_time": f"{total_time:.2f}s",
            "processed_chunks": len(chunk_embedding_pairs),
            "chunks_per_second": f"{len(new_chunks)/total_time:.1f}",
            "embedding_efficiency": f"{len(chunk_embedding_pairs)/embedding_time:.1f}/s"
        })
        
        return {
            "status": "success",
            "request_id": request_id,
            "processed_chunks": len(chunk_embedding_pairs),
            "skipped_chunks": len(existing_hashes),
            "total_chunks": len(chunks),
            "processing_time": f"{total_time:.2f}s"
        }

class QueryProcessor:
    """Handle query processing workflow"""
    
    def __init__(self, db_pool):
        self.document_manager = DocumentManager(db_pool)
    
    async def process_query_request(self, data: dict) -> dict:
        """Process a complete query request"""
        overall_start_time = time.time()
        
        question = data['question']
        request_id = data['request_id']
        
        if not question or not question.strip():
            raise ValueError("Question cannot be empty")
        
        logger.debug(f"Question: {question[:100]}...")
        
        # Generate query embedding
        embedding_start_time = time.time()
        query_embedding = await generate_query_embedding_gemini(question)
        embedding_time = time.time() - embedding_start_time
        logger.timing("Query embedding generation", embedding_time)
        
        # Search similar documents
        search_start_time = time.time()
        documents = await self.document_manager.search_similar_documents(query_embedding, limit=5)
        search_time = time.time() - search_start_time
        logger.timing("Document search", search_time)
        logger.debug(f"Found {len(documents)} relevant documents")
        
        # Generate answer
        answer_start_time = time.time()
        if documents:
            context = " ".join(documents)
            logger.debug(f"Generating answer with {len(context)} chars of context")
            answer = await get_answer_gemini(question, context)
        else:
            answer = "No relevant documents found."
        answer_time = time.time() - answer_start_time
        logger.timing("Answer generation", answer_time)
        
        # Calculate total time
        total_time = time.time() - overall_start_time
        
        # Performance summary (always logged)
        logger.performance({
            "query_time": f"{total_time:.2f}s",
            "documents_found": len(documents),
            "answer_length": len(answer)
        })
        
        return {
            "status": "success",
            "answer": answer,
            "request_id": request_id,
            "response_time": f"{total_time:.2f}s",
            "documents_found": len(documents)
        }

# Simplified Redis handlers
async def handle_ingest(redis_conn, db_pool):
    """Handle ingest requests from Redis"""
    pubsub = redis_conn.pubsub()
    await pubsub.subscribe("ingest_requests")
    logger.info("Subscribed to ingest_requests")
    
    processor = IngestProcessor(db_pool)
    
    async for message in pubsub.listen():
        if message is None or message['type'] != 'message':
            continue
            
        try:
            request_start = time.time()
            data = json.loads(message['data'])
            request_id = data.get('request_id', 'unknown')
            
            logger.debug(f"Received ingest request: {request_id}")
            result = await processor.process_ingest_request(data)
            
            await redis_conn.publish("ingest_responses", json.dumps(result))
            
            total_request_time = time.time() - request_start
            logger.debug(f"Request {request_id} completed in {total_request_time:.3f}s")
            
        except Exception as e:
            logger.error(f"Ingest error: {e}")
            await redis_conn.publish("ingest_responses", json.dumps({
                "status": "error",
                "detail": str(e),
                "request_id": data.get('request_id', 'unknown')
            }))

async def handle_query(redis_conn, db_pool):
    """Handle query requests from Redis"""
    pubsub = redis_conn.pubsub()
    await pubsub.subscribe("query_requests")
    logger.info("Subscribed to query_requests")
    
    processor = QueryProcessor(db_pool)
    
    async for message in pubsub.listen():
        if message is None or message['type'] != 'message':
            continue
            
        try:
            request_start = time.time()
            data = json.loads(message['data'])
            request_id = data.get('request_id', 'unknown')
            
            logger.debug(f"Received query request: {request_id}")
            result = await processor.process_query_request(data)
            
            await redis_conn.publish("query_responses", json.dumps(result))
            
            total_request_time = time.time() - request_start
            logger.debug(f"Query {request_id} completed in {total_request_time:.3f}s")
            
        except Exception as e:
            logger.error(f"Query error: {e}")
            await redis_conn.publish("query_responses", json.dumps({
                "status": "error",
                "detail": str(e),
                "request_id": data.get('request_id', 'unknown')
            }))

async def start_redis_worker(app):
    """Start Redis worker with heartbeat"""
    logger.info("Redis worker starting")
    
    await start_heartbeat()
    
    redis_conn = redis.from_url(
        REDIS_URL,
        decode_responses=True,
        ssl_cert_reqs=None
    )
    
    logger.info("Worker ready to process requests!")
    
    await asyncio.gather(
        handle_ingest(redis_conn, app.state.db_pool),
        handle_query(redis_conn, app.state.db_pool)
    )

# Main function for standalone execution
async def main():
    """For running the worker standalone"""
    from fastapi import FastAPI
    
    class AppState:
        def __init__(self):
            self.db_pool = None
    
    app = AppState()
    app.db_pool = await get_db_pool()
    await create_documents_table(app.db_pool)
    
    logger.info("Starting Redis worker...")
    await start_redis_worker(app)

if __name__ == "__main__":
    asyncio.run(main())