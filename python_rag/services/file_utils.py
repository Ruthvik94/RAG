from fastapi import UploadFile, HTTPException

import nltk
nltk.download('punkt_tab')
from nltk.tokenize import sent_tokenize

async def extract_text_from_file(file: UploadFile, content: bytes) -> str:
    filename = file.filename.lower()
    print("DEBUG: filename =", filename)
    print("DEBUG: content =", content)
    try:
        if filename.endswith('.txt'):
            print("DEBUG: decoding with utf-8")
            return content.decode('utf-8')
        elif filename.endswith('.pdf'):
            import io
            from PyPDF2 import PdfReader
            reader = PdfReader(io.BytesIO(content))
            return " ".join(page.extract_text() or "" for page in reader.pages)
        elif filename.endswith('.docx'):
            import io
            import docx
            doc = docx.Document(io.BytesIO(content))
            return "\n".join([para.text for para in doc.paragraphs])
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type.")
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to extract text from file.")
    
def chunk_text(text, max_chunk_size=500) -> list[str]:
    sentences = sent_tokenize(text)
    chunks = []
    current_chunk = ""
    for sentence in sentences:
        if len(current_chunk) + len(sentence) <= max_chunk_size:
            current_chunk += " " + sentence
        else:
            if current_chunk.strip():
                chunks.append(current_chunk.strip())
            current_chunk = sentence
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    return chunks