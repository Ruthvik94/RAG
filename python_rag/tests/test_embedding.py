import pytest
from services.embedding import load_model, generate_embedding

@pytest.mark.asyncio
async def test_generate_embedding():
    model = await load_model()
    emb = await generate_embedding("hello world", model)
    assert isinstance(emb, (list, tuple)) or hasattr(emb, "__len__")