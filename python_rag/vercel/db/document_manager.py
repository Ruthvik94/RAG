# import asyncio
import hashlib
from typing import List, Tuple
# import asyncpg

class DocumentManager:
    """Handle database operations for documents and embeddings"""
    
    def __init__(self, db_pool):
        self.db_pool = db_pool
    
    async def find_existing_chunk_hashes(self, chunk_hashes: List[str]) -> set:
        """Find which chunk hashes already exist (very fast)"""
        if not chunk_hashes:
            return set()
        
        conn = await self.db_pool.acquire()
        try:
            rows = await conn.fetch("""
                SELECT content_hash FROM documents 
                WHERE content_hash = ANY($1::text[])
            """, chunk_hashes)
            
            return {row['content_hash'] for row in rows}
        
        finally:
            await self.db_pool.release(conn)
    
    async def batch_insert_documents_with_hash(self, chunk_embedding_pairs: List[Tuple[str, List[float]]], batch_size: int = 50) -> None:
        """Insert documents with content hash for deduplication"""
        print(f"💾 Inserting {len(chunk_embedding_pairs)} documents in batches of {batch_size}")
        
        conn = await self.db_pool.acquire()
        try:
            for i in range(0, len(chunk_embedding_pairs), batch_size):
                batch = chunk_embedding_pairs[i:i + batch_size]
                
                # Prepare batch insert with hashes
                values = []
                for chunk, embedding in batch:
                    content_hash = hashlib.sha256(chunk.encode()).hexdigest()
                    embedding_str = "[" + ",".join([str(x) for x in embedding]) + "]"
                    values.append((chunk, content_hash, embedding_str))
                
                # Batch insert with ON CONFLICT DO NOTHING for deduplication
                if values:
                    query = """
                        INSERT INTO documents (content, content_hash, embedding) 
                        VALUES """ + ",".join([f"(${i*3+1}, ${i*3+2}, ${i*3+3})" for i in range(len(values))]) + """
                        ON CONFLICT (content_hash) DO NOTHING
                    """
                    flat_values = [item for triple in values for item in triple]
                    await conn.execute(query, *flat_values)
                    
                print(f"💾 Inserted batch {i//batch_size + 1}/{(len(chunk_embedding_pairs) + batch_size - 1)//batch_size}")
        
        finally:
            await self.db_pool.release(conn)
    
    # Keep existing methods...
    async def search_similar_documents(self, query_embedding: List[float], limit: int = 5) -> List[str]:
        """Search for documents similar to the query embedding"""
        embedding_str = "[" + ",".join([str(x) for x in query_embedding]) + "]"
        
        conn = await self.db_pool.acquire()
        try:
            rows = await conn.fetch("""
                SELECT content FROM documents
                ORDER BY embedding <-> $1::vector
                LIMIT $2
            """, embedding_str, limit)
            
            return [row["content"] for row in rows]
        
        finally:
            await self.db_pool.release(conn)
    
    async def get_document_count(self) -> int:
        """Get total number of documents in the database"""
        conn = await self.db_pool.acquire()
        try:
            row = await conn.fetchrow("SELECT COUNT(*) as count FROM documents")
            return row["count"]
        finally:
            await self.db_pool.release(conn)
    
    async def clear_all_documents(self) -> int:
        """Clear all documents from the database. Returns number of deleted documents."""
        conn = await self.db_pool.acquire()
        try:
            row = await conn.fetchrow("DELETE FROM documents RETURNING COUNT(*)")
            return row["count"] if row else 0
        finally:
            await self.db_pool.release(conn)