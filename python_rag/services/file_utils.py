from fastapi import UploadFile, HTTPException

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