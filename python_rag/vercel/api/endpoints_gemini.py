from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from .models.schemas import QueryRequest, QueryResponse
from services.embedding_gemini import (
    generate_query_embedding_gemini,
    get_answer_gemini,
    get_cache_stats
)
from services.batch_processor import process_embeddings_batch
from services.text_processor import TextProcessor
from db.database import get_db_pool, get_db_conn_with_retry
import asyncio
import time
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
text_processor = TextProcessor()

async def get_database():
    return await get_db_pool()

@router.post("/ingest/", response_class=JSONResponse)
async def ingest(file: UploadFile = File(...)):
    """
    FAST ingestion - no table creation overhead
    """
    print(f"🚀 Starting FAST ingestion for file: {file.filename}")
    print(f"📄 Content type: {file.content_type}")
    print(f"📏 File headers: {dict(file.headers) if hasattr(file, 'headers') else 'No headers'}")
    
    start_time = time.time()
    
    # File size check - OPTIMIZED for demo
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB (restored for demo purposes)
    
    try:
        content = await file.read()
    except Exception as e:
        print(f"❌ Error reading file: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
    
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 5MB).")
    
    print(f"📁 File size: {len(content)} bytes")
    
    try:
        # Extract text and chunk with dynamic parameters
        text, chunks = await text_processor.process_file_content(file.filename, content)
        
        print(f"📝 Extracted text length: {len(text)} characters")

        # Get the dynamic parameters used for logging
        chunk_size, overlap = text_processor.get_dynamic_chunk_params(len(content))
        content_size_kb = len(content) / 1024
        print(f"📏 File size: {content_size_kb:.1f}KB - using chunk size: {chunk_size} chars, overlap: {overlap}")
        print(f"🧩 Created {len(chunks)} chunks")
        
        # FAST: Serverless-optimized concurrent embedding generation
        embedding_start = time.time()
        
        # Use larger batch size for better performance
        optimal_batch_size = min(100, max(20, len(chunks) // 10))
        print(f"🔄 Using batch size: {optimal_batch_size} for {len(chunks)} chunks")
        
        chunk_embedding_pairs = await process_embeddings_batch(
            chunks, 
            batch_size=optimal_batch_size
        )
        embedding_time = time.time() - embedding_start
        print(f"✅ Generated {len(chunk_embedding_pairs)} embeddings in {embedding_time:.2f}s")
        
        # OPTIMIZED: Batch database insert (much faster)
        db_start = time.time()
        
        if chunk_embedding_pairs:
            # Get a fresh DB connection with retry logic
            async with get_db_conn_with_retry(get_db_pool) as conn:
                try:
                    batch_data = [
                        (chunk, "[" + ",".join(str(x) for x in embedding) + "]")
                        for chunk, embedding in chunk_embedding_pairs
                    ]
                    await conn.executemany(
                        "INSERT INTO documents (content, embedding) VALUES ($1, $2)",
                        batch_data
                    )
                    print(f"🚀 FAST batch inserted {len(batch_data)} documents")
                except Exception as e:
                    print(f"❌ Error during batch insert: {str(e)}")
                    raise HTTPException(status_code=500, detail=f"Batch insert failed: {str(e)}")
        
        processed_count = len(chunk_embedding_pairs)
        db_time = time.time() - db_start
        total_time = time.time() - start_time
        
        print(f"🎉 FAST ingestion completed in {total_time:.2f}s!")
        print(f"   📊 Embedding: {embedding_time:.2f}s, DB: {db_time:.2f}s")
        
        return {
            "status": "success",
            "message": f"Successfully processed {processed_count} chunks in {total_time:.2f}s",
            "file_name": file.filename,
            "chunks_processed": processed_count,
            "text_length": len(text),
            "embedding_time": f"{embedding_time:.2f}s",
            "db_time": f"{db_time:.2f}s",
            "total_time": f"{total_time:.2f}s"
        }
        
    except Exception as e:
        print(f"❌ Error during ingestion: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@router.post("/query/", response_model=QueryResponse)
async def query(query_request: QueryRequest):
    """
    Serverless-optimized query with timeout handling
    """
    start_time = time.time()
    question = query_request.question
    
    if not question or not question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    
    try:
        # Generate query embedding with timeout
        print(f"🔍 Generating embedding for query: {question[:50]}...")
        embedding_start = time.time()
        
        query_embedding = await asyncio.wait_for(
            generate_query_embedding_gemini(question),
            timeout=60.0  # 60 second timeout for embedding generation
        )
        embedding_time = time.time() - embedding_start
        print(f"✅ Query embedding generated in {embedding_time:.2f}s")
        
        # Search database with timeout
        search_start = time.time()
        embedding_str = "[" + ",".join([str(x) for x in query_embedding]) + "]"
        
        print(f"🔍 Searching database for similar documents...")
        try:
            print(f"🔌 Acquiring database connection...")
            
            # Add timeout for the entire database operation including connection acquisition
            async def database_search():
                async with get_db_conn_with_retry(get_db_pool) as conn:
                    print(f"✅ Database connection acquired, executing query...")
                    return await conn.fetch("""
                        SELECT content FROM documents
                        ORDER BY embedding <-> $1::vector
                        LIMIT 5
                    """, embedding_str)
            
            rows = await asyncio.wait_for(
                database_search(),
                timeout=45.0  # 45 second timeout for entire database operation
            )
            print(f"✅ Query executed successfully")
        except asyncio.TimeoutError:
            print(f"❌ Database operation timed out after 45 seconds")
            raise HTTPException(status_code=504, detail="Database operation timed out")
        except Exception as db_error:
            print(f"❌ Database error: {str(db_error)}")
            raise HTTPException(status_code=500, detail=f"Database operation failed: {str(db_error)}")
        
        search_time = time.time() - search_start
        print(f"📊 Database search completed in {search_time:.2f}s, found {len(rows)} results")
        
        # Generate answer with timeout
        context = " ".join([r["content"] for r in rows]) if rows else ""
        
        if context:
            answer_start = time.time()
            answer = await asyncio.wait_for(
                get_answer_gemini(question, context),
                timeout=120.0  # 120 second timeout for answer generation
            )
            answer_time = time.time() - answer_start
            print(f"🤖 Answer generated in {answer_time:.2f}s")
        else:
            answer = "No relevant documents found."
            print("❌ No documents found for query")
        
        total_time = time.time() - start_time
        print(f"🎯 Query completed in {total_time:.2f}s")
        
        return QueryResponse(answer=answer)
        
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Query processing timed out - please try a simpler question")
    except Exception as e:
        print(f"❌ Query error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Query processing failed: {str(e)}")

@router.delete("/clear-documents/", response_class=JSONResponse)
async def clear_all_documents(request: Request):
    """
    Clear all documents from the database.
    """
    try:
        async with get_db_conn_with_retry(get_db_pool) as conn:
            # Get count before deletion
            count_row = await conn.fetchrow("SELECT COUNT(*) as count FROM documents")
            count_before = count_row["count"] if count_row else 0

            # Return 204 if no documents to delete
            if count_before == 0 or count_before is None:
                return JSONResponse(
                    status_code=204,
                    content={
                        "status": "success",
                        "message": "No documents found to delete.",
                        "deleted_count": 0
                    }
                )

            # Delete all documents
            await conn.execute("DELETE FROM documents")

            return {
                "status": "success",
                "message": f"Successfully cleared {count_before} documents from the database.",
                "deleted_count": count_before
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear documents: {str(e)}")

@router.get("/cache-info/")
async def cache_info():
    """Get cache statistics for monitoring"""
    return get_cache_stats()