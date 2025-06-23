import asyncio
from sentence_transformers import SentenceTransformer
from async_lru import alru_cache

model = None

async def load_model():
    global model
    if model is None:
        loop = asyncio.get_event_loop()
        model = await loop.run_in_executor(None, SentenceTransformer, 'all-MiniLM-L6-v2')
    return model

@alru_cache(maxsize=128)
async def generate_embedding(text: str, model):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, model.encode, text)