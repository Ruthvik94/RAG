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
            statement_cache_size=0,
            command_timeout=60
        )
    return db_pool

# Add this function to create the updated table schema

async def create_documents_table_with_hash(db_pool):
    """Create documents table with content hash for fast deduplication"""
    conn = await db_pool.acquire()
    try:
        # First check if table exists with old schema
        table_exists = await conn.fetchrow("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'documents' AND column_name = 'content_hash'
        """)
        
        if not table_exists:
            # Create table if it doesn't exist
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS documents (
                    id SERIAL PRIMARY KEY,
                    content TEXT NOT NULL,
                    content_hash VARCHAR(64) UNIQUE,
                    embedding vector(768) NOT NULL,  -- Adjust dimension based on your embedding model
                    created_at TIMESTAMP DEFAULT NOW()
                );
                
                CREATE INDEX IF NOT EXISTS idx_documents_content_hash ON documents(content_hash);
                CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops);
            """)
            # Add content_hash column if it doesn't exist
            await conn.execute("""
                ALTER TABLE documents 
                ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64) UNIQUE
            """)
            
            # Create index for fast hash lookups
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_documents_content_hash 
                ON documents(content_hash)
            """)
            
            print("✅ Added content_hash column and index to documents table")
        
    finally:
        await db_pool.release(conn)

# Update the existing create_documents_table function
async def create_documents_table(db_pool):
    """Create documents table with hash support"""
    await create_documents_table_with_hash(db_pool)