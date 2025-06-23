from fastapi.testclient import TestClient
from main import app
import numpy as np

client = TestClient(app)

class DummyModel:
    def encode(self, text):
        return np.array([0.1] * 384)

class DummyConn:
    async def __aenter__(self): return self
    async def __aexit__(self, exc_type, exc, tb): pass
    async def execute(self, *a, **k): pass
    async def fetch(self, *a, **k): return [{"content": "doc"}]

class DummyPool:
    def acquire(self):
        return DummyConn()

def test_ingest_txt():
    app.state.db_pool = DummyPool()
    app.state.model = DummyModel()

    response = client.post("/ingest/", files={"file": ("test.txt", b"hello world", "text/plain")})
    assert response.status_code == 200
    assert response.json() == {"status": "success"}

def test_query():
    app.state.db_pool = DummyPool()
    app.state.model = DummyModel()

    response = client.post("/query/", json={"question": "test?"})
    assert response.status_code == 200
    assert "answer" in response.json()