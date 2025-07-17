from fastapi import UploadFile, HTTPException
import re

def clean_text_for_db(text: str) -> str:
    """Optimized text cleaning for PostgreSQL UTF-8"""
    if not text:
        return ""
    
    # Use translate for faster character removal (much faster than multiple replace calls)
    # Create translation table to remove problematic characters
    chars_to_remove = '\x00\x08\x0b\x0c\x0e\x0f'
    translation_table = str.maketrans('', '', chars_to_remove)
    text = text.translate(translation_table)
    
    # Remove control characters in one pass (faster than char-by-char)
    text = ''.join(char for char in text if ord(char) >= 32 or char in '\t\n\r')
    
    # Normalize whitespace once
    text = re.sub(r'\s+', ' ', text)
    
    return text.strip()

async def extract_text_from_file(file: UploadFile, content: bytes) -> str:
    filename = file.filename.lower()
    print(f"DEBUG: Processing {filename}, size: {len(content)} bytes")
    
    try:
        if filename.endswith('.txt'):
            text = content.decode('utf-8', errors='ignore')
            return clean_text_for_db(text)
        elif filename.endswith('.pdf'):
            import io
            from PyPDF2 import PdfReader
            reader = PdfReader(io.BytesIO(content))
            # Use list comprehension for faster text extraction
            pages_text = [page.extract_text() or "" for page in reader.pages]
            text = " ".join(pages_text)
            return clean_text_for_db(text)
        elif filename.endswith('.docx'):
            import io
            from docx import Document
            doc = Document(io.BytesIO(content))
            # Use list comprehension for faster paragraph extraction
            paragraphs_text = [para.text for para in doc.paragraphs if para.text.strip()]
            text = "\n".join(paragraphs_text)
            return clean_text_for_db(text)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type.")
    except Exception as e:
        print(f"Error extracting text: {e}")
        raise HTTPException(status_code=400, detail="Failed to extract text from file.")

def fast_sentence_split(text: str) -> list[str]:
    """Ultra-fast sentence splitting using simple regex"""
    if not text:
        return []
    
    # Single regex split - much faster than multiple operations
    sentences = re.split(r'[.!?]+\s+', text)
    # Filter empty sentences in one pass
    return [s.strip() for s in sentences if len(s.strip()) > 10]  # Min length filter

def chunk_text(text: str, max_chunk_size: int = 500) -> list[str]:
    """Optimized chunking - prioritizes speed over perfect sentence boundaries"""
    if not text:
        return []
    
    # Clean text once
    text = clean_text_for_db(text)
    
    # For short texts, return as single chunk
    if len(text) <= max_chunk_size:
        return [text] if text.strip() else []
    
    chunks = []
    
    # Simple word-based chunking (fastest approach)
    words = text.split()
    current_chunk = []
    current_length = 0
    
    for word in words:
        word_length = len(word) + 1  # +1 for space
        
        if current_length + word_length > max_chunk_size and current_chunk:
            # Save current chunk
            chunks.append(' '.join(current_chunk))
            current_chunk = [word]
            current_length = len(word)
        else:
            current_chunk.append(word)
            current_length += word_length
    
    # Add final chunk
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    
    return chunks

def chunk_text_sliding_window(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Alternative: Sliding window chunking for better context preservation"""
    if not text:
        return []
    
    text = clean_text_for_db(text)
    
    if len(text) <= chunk_size:
        return [text] if text.strip() else []
    
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        
        # Try to end at word boundary
        if end < len(text):
            # Find last space within chunk
            last_space = text.rfind(' ', start, end)
            if last_space > start:
                end = last_space
        
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        
        # Move start position with overlap
        start = end - overlap if end < len(text) else len(text)
    
    return chunks

# Fast utility function for very large texts
def quick_chunk_by_lines(text: str, max_lines: int = 10) -> list[str]:
    """Emergency fast chunking for very large documents"""
    if not text:
        return []
    
    lines = text.split('\n')
    chunks = []
    
    for i in range(0, len(lines), max_lines):
        chunk_lines = lines[i:i + max_lines]
        chunk = '\n'.join(line.strip() for line in chunk_lines if line.strip())
        if chunk:
            chunks.append(clean_text_for_db(chunk))
    
    return chunks