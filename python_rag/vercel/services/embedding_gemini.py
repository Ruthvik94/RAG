# Clean imports for embedding operations
import asyncio
import google.generativeai as genai
# from async_lru import alru_cache
from config import GEMINI_API_KEY
from dotenv import load_dotenv
import redis.asyncio as redis
import os
import hashlib
import json

load_dotenv()

# Core embedding functions
# @alru_cache(maxsize=1024)
async def _generate_embedding_api_call(text: str, task_type: str):
    """Generate embedding via Gemini API with caching"""
    try:
        redis_client = redis.from_url(os.getenv("REDIS_URL"))

        # check if question embedding is cached
        key = f"embedding:query:{hashlib.sha256(text.encode()).hexdigest()}"
        cached = await redis_client.get(key)
        if cached:
            print("⚡️ Cache hit, returning query embedding from cache")
            return json.loads(cached)

        genai.configure(api_key=GEMINI_API_KEY)
        result = await genai.embed_content_async(
            model='models/text-embedding-004',
            content=text,
            task_type=task_type
        )
        # Store embedding in cache for future use
        await redis_client.set(key, json.dumps(result['embedding']), ex=86400)  # 1 day expiry
        return result['embedding']
    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "quota" in error_str.lower():
            print("❌ Gemini API quota exceeded.")
            return (
                "Error: Gemini API quota exceeded. "
                "Please try after sometime"
            )
        print(f"❌ Embedding API error: {e}")
        raise

# Public functions
async def generate_document_embedding_gemini(text: str):
    """Generate document embedding"""
    return await _generate_embedding_api_call(text, "retrieval_document")

async def generate_query_embedding_gemini(text: str):
    """Generate query embedding"""
    print(f"🔍 Processing query embedding")
    return await _generate_embedding_api_call(text, "retrieval_query")

# @alru_cache(maxsize=128)
async def get_answer_gemini(question: str, context: str):
    """Generate answer with caching"""
    try:
        redis_client = redis.from_url(os.getenv("REDIS_URL"))
        # Create a cache key using a hash of question and context
        cache_key = f"answer:{hashlib.sha256((question + context).encode()).hexdigest()}"
        cached = await redis_client.get(cache_key)
        if cached:
            print("💡 Cache hit, returning answer from cache")
            return json.loads(cached)

        print(f"💬 Generating answer")
        
        genai.configure(api_key=GEMINI_API_KEY)
        genai_model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""Context: {context}

Question: {question}

Based only on the provided context, answer the question. If the answer cannot be found in the context, say "No answer found in the provided context."

Answer:"""
        
        try:
            result = await asyncio.wait_for(
                genai_model.generate_content_async(prompt),
                timeout=60
            )
            # Cache the answer for future identical queries
            await redis_client.set(cache_key, json.dumps(result.text), ex=7200)  # 1 day expiry
            return result.text
        except Exception as e:
            # Handle quota/rate limit error
            error_str = str(e)
            if "429" in error_str or "quota" in error_str.lower():
                print("❌ Gemini API quota exceeded.")
                return (
                    "Error: Gemini API quota exceeded. "
                    "Please try again after sometime"
                )
    except Exception as e:
        print(f"❌ Answer generation error: {e}")
        return "Error generating answer."

# Cache management
async def get_cache_stats():
    """Get cache statistics from Upstash Redis"""
    redis_client = redis.from_url(os.getenv("REDIS_URL"))
    info = await redis_client.info()
    # stats = {
    #     "keys": info.get("db0", {}).get("keys", 0),
    #     "expires": info.get("db0", {}).get("expires", 0),
    #     "used_memory_human": info.get("used_memory_human", "N/A"),
    #     "total_commands_processed": info.get("total_commands_processed", "N/A"),
    #     "uptime_in_days": info.get("uptime_in_days", "N/A"),
    # }
    return info