# Clean imports for embedding operations
import asyncio
import google.generativeai as genai
# from async_lru import alru_cache
from config import GEMINI_API_KEY
from dotenv import load_dotenv

load_dotenv()

# Core embedding functions
# @alru_cache(maxsize=1024)
async def _generate_embedding_api_call(text: str, task_type: str):
    """Generate embedding via Gemini API with caching"""
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        result = await genai.embed_content_async(
            model='models/text-embedding-004',
            content=text,
            task_type=task_type
        )
        return result['embedding']
    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "quota" in error_str.lower():
            print("❌ Gemini API quota exceeded.")
            return (
                "Error: Gemini API quota exceeded. "
                "Please check your plan and billing details. "
                "See: https://ai.google.dev/gemini-api/docs/rate-limits"
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
            return result.text
        except Exception as e:
            # Handle quota/rate limit error
            error_str = str(e)
            if "429" in error_str or "quota" in error_str.lower():
                print("❌ Gemini API quota exceeded.")
                return (
                    "Error: Gemini API quota exceeded. "
                    "Please check your plan and billing details. "
                    "See: https://ai.google.dev/gemini-api/docs/rate-limits"
                )
    except Exception as e:
        print(f"❌ Answer generation error: {e}")
        return "Error generating answer."

# Cache management
def get_cache_stats():
    """Get cache statistics"""
    api_info = _generate_embedding_api_call.cache_info()
    answer_info = get_answer_gemini.cache_info()
    
    print(f"📊 Cache stats - API: {api_info.hits}/{api_info.hits + api_info.misses}, Answer: {answer_info.hits}/{answer_info.hits + answer_info.misses}")
    
    return {
        "api_calls": api_info,
        "answer": answer_info,
    }