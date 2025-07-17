import asyncio
import google.generativeai as genai
import json
import tempfile
import os
import time
from typing import List, Tuple
from .embedding_gemini import _generate_embedding_api_call

batch_processing_limit_fallback = 20

async def process_embeddings_batch(chunks: List[str], batch_size: int = 50, use_gemini_batch: bool = False) -> List[Tuple[str, List[float]]]:
    """
    Process chunks in batches with concurrent embedding generation
    
    Args:
        chunks: List of text chunks to process
        batch_size: Number of chunks to process concurrently
        use_gemini_batch: Whether to use Gemini's batch API for large sets
    
    Returns:
        List of (chunk, embedding) pairs
    """
    if len(chunks) > 100 and use_gemini_batch:
        return await _process_gemini_batch_mode(chunks)
    else:
        return await _process_concurrent_batches(chunks, batch_size)

async def _process_concurrent_batches(chunks: List[str], batch_size: int) -> List[Tuple[str, List[float]]]:
    """Process chunks using concurrent individual API calls"""
    print(f"🚀 Processing {len(chunks)} chunks in batches of {batch_size}")
    
    all_results = []
    
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        print(f"📦 Processing batch {i//batch_size + 1}/{(len(chunks) + batch_size - 1)//batch_size} ({len(batch)} chunks)")
        
        # Process batch concurrently
        batch_tasks = []
        for chunk in batch:
            if chunk.strip():
                task = _generate_embedding_api_call(chunk, "retrieval_document")
                batch_tasks.append((chunk, task))
        
        # Wait for all embeddings in this batch
        batch_results = []
        if batch_tasks:
            try:
                embeddings = await asyncio.wait_for(
                    asyncio.gather(*[task for _, task in batch_tasks], return_exceptions=True),
                    timeout=120.0  # 2 minute timeout per batch
                )
                
                for (chunk, _), embedding in zip(batch_tasks, embeddings):
                    if isinstance(embedding, Exception):
                        print(f"❌ Error processing chunk: {embedding}")
                        continue
                    batch_results.append((chunk, embedding))
                    
            except asyncio.TimeoutError:
                print(f"❌ Batch {i//batch_size + 1} timed out")
                continue
        
        all_results.extend(batch_results)
        print(f"✅ Batch completed: {len(batch_results)}/{len(batch)} successful")
    
    return all_results

async def _process_gemini_batch_mode(chunks: List[str]) -> List[Tuple[str, List[float]]]:
    """Process chunks using Gemini's batch API (for large datasets)"""
    try:
        print(f"🚀 Using Gemini Batch Mode for {len(chunks)} chunks")
        
        # Prepare batch requests
        batch_requests = []
        for i, chunk in enumerate(chunks):
            if chunk.strip():
                batch_requests.append({
                    "custom_id": f"chunk_{i}",
                    "method": "POST", 
                    "url": "/v1beta/models/text-embedding-004:embedContent",
                    "body": {
                        "model": "models/text-embedding-004",
                        "content": {"parts": [{"text": chunk}]},
                        "task_type": "retrieval_document"
                    }
                })
        
        # Create temporary batch file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.jsonl', delete=False) as f:
            for request in batch_requests:
                f.write(json.dumps(request) + '\n')
            batch_file_path = f.name
        
        try:
            # Upload batch file
            print(f"📤 Uploading batch file with {len(batch_requests)} requests...")
            batch_file = genai.upload_file(batch_file_path)
            
            # Submit batch job
            print("🔄 Submitting batch job...")
            batch_job = genai.create_batch(
                input_file=batch_file.name,
                completion_window="24h"
            )
            
            # Wait for completion
            print(f"⏳ Waiting for batch job {batch_job.name} to complete...")
            timeout = 600  # 10 minutes timeout
            start_time = time.time()
            
            while batch_job.state in ['VALIDATING', 'IN_PROGRESS'] and (time.time() - start_time) < timeout:
                await asyncio.sleep(10)
                batch_job = genai.get_batch(batch_job.name)
                print(f"📊 Batch status: {batch_job.state}")
            
            if batch_job.state == 'COMPLETED':
                # Download and parse results
                result_file = genai.get_file(batch_job.output_file)
                
                embeddings_map = {}
                with open(result_file.name, 'r') as f:
                    for line in f:
                        result = json.loads(line)
                        custom_id = result['custom_id']
                        chunk_index = int(custom_id.split('_')[1])
                        
                        if 'response' in result and 'body' in result['response']:
                            embedding = result['response']['body']['embedding']['values']
                            embeddings_map[chunk_index] = embedding
                
                # Return embeddings in original order
                results = []
                for i, chunk in enumerate(chunks):
                    if i in embeddings_map and chunk.strip():
                        results.append((chunk, embeddings_map[i]))
                
                print(f"🎉 Batch processing completed: {len(results)} embeddings generated")
                return results
            else:
                print(f"❌ Batch job failed or timed out. Status: {batch_job.state}")
                return await _process_concurrent_batches(chunks, batch_processing_limit_fallback)
                
        finally:
            if os.path.exists(batch_file_path):
                os.unlink(batch_file_path)
        
    except Exception as e:
        print(f"❌ Batch processing error: {e}")
        print("🔄 Falling back to concurrent processing...")
        return await _process_concurrent_batches(chunks, batch_processing_limit_fallback)