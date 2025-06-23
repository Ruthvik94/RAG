import pytest
import asyncio
import base64
import json
from unittest.mock import AsyncMock, MagicMock, patch

from api.redis_worker import handle_ingest, handle_query, MAX_FILE_SIZE

@pytest.mark.asyncio
async def test_handle_ingest_file_too_large():
    file_bytes = b"x" * (MAX_FILE_SIZE + 1)
    file_content = base64.b64encode(file_bytes).decode()
    message = {
        'type': 'message',
        'data': json.dumps({
            "file_content": file_content,
            "filename": "bigfile.txt",
            "request_id": "abc"
        })
    }

    redis_conn = MagicMock()
    pubsub = AsyncMock()
    async def fake_listen():
        yield message
        await asyncio.sleep(0.01)
    pubsub.listen = fake_listen
    redis_conn.pubsub.return_value = pubsub
    redis_conn.publish = AsyncMock()

    db_pool = MagicMock()
    model = MagicMock()

    with patch("api.redis_worker.extract_text_from_file", new=AsyncMock(return_value="dummy text")):
        task = asyncio.create_task(handle_ingest(redis_conn, db_pool, model))
        await asyncio.sleep(0.05)
        task.cancel()
        (channel, payload), _ = redis_conn.publish.await_args
        assert channel == "ingest_responses"
        assert json.loads(payload) == {
            "status": "error",
            "detail": "File too large (max 5MB).",
            "request_id": "abc"
        }

@pytest.mark.asyncio
async def test_handle_ingest_success():
    # Prepare a message with a valid file
    file_bytes = b"hello world"
    file_content = base64.b64encode(file_bytes).decode()
    message = {
        'type': 'message',
        'data': json.dumps({
            "file_content": file_content,
            "filename": "file.txt",
            "request_id": "abc"
        })
    }

    redis_conn = MagicMock()
    pubsub = AsyncMock()
    async def fake_listen():
        yield message
        await asyncio.sleep(0.01)  # Prevents StopAsyncIteration
    pubsub.listen = fake_listen
    redis_conn.pubsub.return_value = pubsub
    redis_conn.publish = AsyncMock()

    # Mock DB pool and connection
    db_conn = AsyncMock()
    db_pool = MagicMock()
    db_pool.acquire.return_value.__aenter__.return_value = db_conn
    model = MagicMock()

    with patch("api.redis_worker.extract_text_from_file", new=AsyncMock(return_value="dummy text")), \
         patch("api.redis_worker.generate_embedding", new=AsyncMock(return_value=[0.1, 0.2, 0.3])):
        task = asyncio.create_task(handle_ingest(redis_conn, db_pool, model))
        await asyncio.sleep(0.05)
        task.cancel()
        redis_conn.publish.assert_awaited_with(
            "ingest_responses",
            '{"status": "success", "request_id": "abc"}'
        )
        db_conn.execute.assert_awaited()

@pytest.mark.asyncio
async def test_handle_query_empty_question():
    message = {
        'type': 'message',
        'data': json.dumps({
            "question": "",
            "request_id": "abc"
        })
    }
    redis_conn = MagicMock()
    pubsub = AsyncMock()
    async def fake_listen():
        yield message
        await asyncio.sleep(0.01)
    pubsub.listen = fake_listen
    redis_conn.pubsub.return_value = pubsub
    redis_conn.publish = AsyncMock()
    db_pool = MagicMock()
    model = MagicMock()
    with patch("api.redis_worker.generate_embedding", new=AsyncMock(return_value=[0.1, 0.2, 0.3])):
        task = asyncio.create_task(handle_query(redis_conn, db_pool, model))
        await asyncio.sleep(0.05)
        task.cancel()
        (channel, payload), _ = redis_conn.publish.await_args
        assert channel == "query_responses"
        assert json.loads(payload) == {
            "status": "error",
            "detail": "Question cannot be empty.",
            "request_id": "abc"
        }