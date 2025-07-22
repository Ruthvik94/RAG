import asyncpg
import asyncio
import contextlib
from config import DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT

async def get_db_pool():
    """Always create a new pool for serverless safety"""
    return await asyncpg.create_pool(
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        host=DB_HOST,
        port=DB_PORT,
        min_size=1,
        max_size=10,
        statement_cache_size=0,
        command_timeout=60
    )

@contextlib.asynccontextmanager
async def get_db_conn_with_retry(pool_factory, retries=3, delay=1):
    last_exc = None
    for attempt in range(retries):
        try:
            pool = await pool_factory()
            async with pool.acquire() as conn:
                yield conn
                return
        except (asyncpg.exceptions.ConnectionDoesNotExistError, asyncpg.exceptions.InterfaceError) as e:
            last_exc = e
            print(f"⚠️ DB connection failed (attempt {attempt+1}/{retries}): {e}")
            await asyncio.sleep(delay)
    raise last_exc