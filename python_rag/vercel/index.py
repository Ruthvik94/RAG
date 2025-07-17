# import sys
# import os

# # Add the current directory to Python path for imports
# current_dir = os.path.dirname(os.path.abspath(__file__))
# if current_dir not in sys.path:
#     sys.path.insert(0, current_dir)

from fastapi import FastAPI
from contextlib import asynccontextmanager
import asyncio
from db.database import get_db_pool, create_documents_table
from api.endpoints_gemini import router
from api.redis_worker_upstash import start_redis_worker
from dotenv import load_dotenv

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan handler"""
    # Startup: initialize DB pool
    app.state.db_pool = await get_db_pool()
    await create_documents_table(app.state.db_pool)
    
    # Start Redis worker as a background task
    asyncio.create_task(start_redis_worker(app))
    
    yield
    
    # Shutdown: close DB pool with timeout
    try:
        await asyncio.wait_for(app.state.db_pool.close(), timeout=10.0)
        print("Database pool closed successfully")
    except asyncio.TimeoutError:
        print("Warning: Database pool close timed out after 10 seconds")
    except Exception as e:
        print(f"Error closing database pool: {e}")

app = FastAPI(lifespan=lifespan)
# Include API routes
app.include_router(router)

# Health check endpoint
@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/")
async def root():
    return {"message": "Hello from Python RAG API"}