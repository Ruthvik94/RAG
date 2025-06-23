import pytest
from fastapi import UploadFile
from services.file_utils import extract_text_from_file

class DummyUploadFile:
    def __init__(self, filename, content):
        self.filename = filename
        self.content = content
    async def read(self):
        return self.content

@pytest.mark.asyncio
async def test_extract_text_from_txt():
    file = DummyUploadFile("test.txt", b"hello world")
    text = await extract_text_from_file(file, file.content)
    assert text == "hello world"