import asyncio
import google.generativeai as genai
from async_lru import alru_cache
from config import GEMINI_API_KEY
from dotenv import load_dotenv
import time

load_dotenv()

# Configure Gemini once
genai.configure(api_key=GEMINI_API_KEY)

# Global variable to track activity
_last_activity = time.time()

async def update_activity():
    """Update last activity timestamp"""
    global _last_activity
    _last_activity = time.time()

async def heartbeat_task():
    """Keep the worker alive with periodic heartbeat"""
    while True:
        try:
            await update_activity()
            print(f"💓 Worker alive - {time.strftime('%H:%M:%S')}")
            await asyncio.sleep(300)  # 5 minutes
        except Exception as e:
            print(f"❌ Heartbeat error: {e}")
            await asyncio.sleep(60)

async def start_heartbeat():
    """Start heartbeat task"""
    asyncio.create_task(heartbeat_task())
    print("💓 Heartbeat started")

# Core embedding functions
@alru_cache(maxsize=1024)
async def _generate_embedding_api_call(text: str, task_type: str):
    """Internal cached API call function"""
    try:
        await update_activity()
        print(f"🔥 API call for {task_type} embedding ({len(text)} chars)")
        
        result = await asyncio.to_thread(
            genai.embed_content,
            model="models/text-embedding-004",
            content=text,
            task_type=task_type
        )
        
        return result['embedding']
    except Exception as e:
        print(f"❌ Embedding API error: {e}")
        raise

# Public functions - always execute, but use cached API calls
async def generate_document_embedding_gemini(text: str):
    """Generate document embedding - always executes for message flow"""
    await update_activity()
    # This will use cache if available, but function always executes
    return await _generate_embedding_api_call(text, "retrieval_document")

async def generate_query_embedding_gemini(text: str):
    """Generate query embedding - always executes for message flow"""
    await update_activity()
    print(f"🔍 Processing query embedding")
    return await _generate_embedding_api_call(text, "retrieval_query")

@alru_cache(maxsize=128)
async def get_answer_gemini(question: str, context: str):
    """Generate answer with caching"""
    try:
        await update_activity()
        print(f"💬 Generating answer")
        
        genai_model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""Context: {context}

Question: {question}

Based only on the provided context, answer the question. If the answer cannot be found in the context, say "No answer found in the provided context."

Answer:"""
        
        result = await genai_model.generate_content_async(prompt)
        return result.text
    except Exception as e:
        print(f"❌ Answer generation error: {e}")
        return "Error generating answer."

# Cache management
def clear_all_caches():
    """Clear all caches"""
    _generate_embedding_api_call.cache_clear()
    get_answer_gemini.cache_clear()
    print("🗑️ Caches cleared")

def get_cache_stats():
    """Get cache statistics"""
    api_info = _generate_embedding_api_call.cache_info()
    answer_info = get_answer_gemini.cache_info()
    
    print(f"📊 Cache stats - API: {api_info.hits}/{api_info.hits + api_info.misses}, Answer: {answer_info.hits}/{answer_info.hits + answer_info.misses}")
    
    return {
        "api_calls": api_info,
        "answer": answer_info,
    }

# Legacy compatibility
async def load_model():
    return None

async def generate_embedding(text: str, model=None):
    return await generate_document_embedding_gemini(text)