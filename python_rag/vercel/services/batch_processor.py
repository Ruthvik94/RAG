import asyncio
import time
from typing import List, Tuple
from .embedding_gemini import _generate_embedding_api_call

# Optimized for demo: sub-60s processing
MAX_CONCURRENT_REQUESTS = 25  # Maximum concurrency for demo
REQUEST_TIMEOUT = 20  # Faster fail-fast for demo
BATCH_TIMEOUT = 240   # Timeout for larger batches  
DELAY_BETWEEN_BATCHES = 0.001  # Minimal delay for demo speed

async def process_embeddings_batch(
    chunks: List[str], 
    batch_size: int = 50,  # Increased default from 8
    progress_callback = None  # Optional callback for progress updates
) -> List[Tuple[str, List[float]]]:
    """
    Serverless-optimized concurrent processing with batching and timeouts
    """
    if not chunks:
        return []
    
    print(f"🚀 SERVERLESS CONCURRENT MODE: Processing {len(chunks)} chunks with batch_size={batch_size}")
    return await _process_serverless_concurrent_mode(chunks, batch_size, progress_callback)

async def _process_serverless_concurrent_mode(chunks: List[str], batch_size: int = 50, progress_callback = None) -> List[Tuple[str, List[float]]]:
    """
    Serverless-optimized processing with larger batches and higher concurrency
    """
    print(f"⚡ Serverless processing: {len(chunks)} chunks in batches of {batch_size}")
    start_time = time.time()
    
    all_results = []
    total_batches = (len(chunks) + batch_size - 1) // batch_size
    
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        batch_num = i // batch_size + 1
        
        # Calculate progress percentage
        progress_pct = int((batch_num - 1) / total_batches * 100)
        if progress_callback:
            progress_callback({
                'progress': 50 + int(progress_pct * 0.3),  # 50-80% range for embeddings
                'message': f'Processing embeddings batch {batch_num}/{total_batches}',
                'batch': batch_num,
                'total_batches': total_batches
            })
        
        print(f"📦 Processing batch {batch_num}/{total_batches} ({len(batch)} chunks)")
        
        try:
            batch_results = await _process_single_batch(batch, batch_num)
            all_results.extend(batch_results)
            
            # Rate limiting between batches (except last batch)
            if batch_num < total_batches:
                await asyncio.sleep(DELAY_BETWEEN_BATCHES)
                
        except Exception as e:
            print(f"❌ Batch {batch_num} failed: {e}")
            continue
    
    total_time = time.time() - start_time
    success_rate = len(all_results) / len(chunks) * 100 if chunks else 0
    
    print(f"🎯 SERVERLESS SUCCESS: {len(all_results)}/{len(chunks)} chunks ({success_rate:.1f}%) in {total_time:.2f}s")
    
    return all_results

async def _process_single_batch(batch: List[str], batch_num: int) -> List[Tuple[str, List[float]]]:
    """
    Process a single batch with timeout and error handling
    """
    batch_start = time.time()
    
    # Filter valid chunks and create tasks
    valid_chunks = [chunk for chunk in batch if chunk.strip()]
    if not valid_chunks:
        return []
    
    # Limit concurrent requests within batch
    semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
    
    async def process_with_semaphore(chunk: str) -> Tuple[str, List[float], bool]:
        """Process single chunk with semaphore and timeout"""
        async with semaphore:
            try:
                embedding = await asyncio.wait_for(
                    _generate_embedding_api_call(chunk, "retrieval_document"),
                    timeout=REQUEST_TIMEOUT
                )
                return chunk, embedding, True
            except asyncio.TimeoutError:
                print(f"⏰ Timeout for chunk in batch {batch_num}")
                return chunk, [], False
            except Exception as e:
                print(f"❌ Error for chunk in batch {batch_num}: {e}")
                return chunk, [], False
    
    # Create tasks for all chunks in batch
    tasks = [process_with_semaphore(chunk) for chunk in valid_chunks]
    
    try:
        # Execute batch with overall timeout
        results = await asyncio.wait_for(
            asyncio.gather(*tasks, return_exceptions=False),
            timeout=BATCH_TIMEOUT
        )
        
        # Process results
        batch_results = []
        success_count = 0
        
        for chunk, embedding, success in results:
            if success and embedding and len(embedding) > 0:
                batch_results.append((chunk, embedding))
                success_count += 1
        
        batch_time = time.time() - batch_start
        print(f"✅ Batch {batch_num}: {success_count}/{len(valid_chunks)} successful in {batch_time:.2f}s")
        
        return batch_results
        
    except asyncio.TimeoutError:
        print(f"❌ Batch {batch_num} timed out after {BATCH_TIMEOUT}s")
        return []
    except Exception as e:
        print(f"❌ Batch {batch_num} failed: {e}")
        return []