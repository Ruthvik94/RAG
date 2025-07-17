import asyncio
from fastapi import FastAPI
from contextlib import asynccontextmanager
# from api.endpoints import router
from api.endpoints_gemini import router
from db.database import get_db_pool, create_documents_table
# from services.embedding import load_model

# from api.redis_worker import start_redis_worker
from api.redis_worker_upstash import start_redis_worker

from dotenv import load_dotenv
load_dotenv()

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # Startup: initialize DB pool and model
#     app.state.db_pool = await get_db_pool()
#     app.state.model = await load_model()
#     await create_documents_table(app.state.db_pool)
#     yield
#     # Shutdown: close DB pool
#     await app.state.db_pool.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize DB pool and model
    app.state.db_pool = await get_db_pool()
    # app.state.model = await load_model()
    await create_documents_table(app.state.db_pool)
    # Start Redis worker as a background task
    asyncio.create_task(start_redis_worker(app))
    yield
    # await app.state.db_pool.close()
    # Shutdown: close DB pool with timeout
    try:
        await asyncio.wait_for(app.state.db_pool.close(), timeout=10.0)
        print("Database pool closed successfully")
    except asyncio.TimeoutError:
        print("Warning: Database pool close timed out after 10 seconds")
    except Exception as e:
        print(f"Error closing database pool: {e}")

app = FastAPI(lifespan=lifespan)
app.include_router(router)