import pytest
import asyncio
from db.database import get_db_pool, create_documents_table

@pytest.mark.asyncio
async def test_get_db_pool(monkeypatch):
    # You can mock asyncpg.create_pool here if needed
    pass

@pytest.mark.asyncio
async def test_create_documents_table(monkeypatch):
    # You can mock the pool and connection here
    pass