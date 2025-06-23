import asyncpg
from config import DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT

db_pool = None

async def get_db_pool():
    global db_pool
    if db_pool is None:
        db_pool = await asyncpg.create_pool(
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            host=DB_HOST,
            port=DB_PORT,
            min_size=1,
            max_size=10,
        )
    return db_pool

async def create_documents_table(pool):
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id SERIAL PRIMARY KEY,
                content TEXT NOT NULL,
                embedding vector(384)
            );
        """)