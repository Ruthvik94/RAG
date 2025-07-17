from typing import List, Tuple
from .file_utils_light import extract_text_from_file, chunk_text

class TextProcessor:
    """Handle text extraction and chunking operations"""
    
    def __init__(self, max_chunk_size: int = 500, overlap: int = 50):
        self.max_chunk_size = max_chunk_size
        self.overlap = overlap
    
    async def process_file_content(self, filename: str, file_content: bytes) -> Tuple[str, List[str]]:
        """
        Extract text from file content and chunk it
        
        Args:
            filename: Name of the file
            file_content: Raw file content as bytes
            
        Returns:
            Tuple of (extracted_text, chunks)
        """
        # Create dummy file object for extraction
        class DummyUploadFile:
            def __init__(self, filename):
                self.filename = filename
        
        dummy_file = DummyUploadFile(filename)
        
        # Extract text
        text = await extract_text_from_file(dummy_file, file_content)
        if not text or not text.strip():
            raise ValueError("No text extracted from file")
        
        # Chunk text
        chunks = chunk_text(text, max_chunk_size=self.max_chunk_size)
        
        return text, chunks
    
    def validate_file_size(self, file_content: bytes, max_size_mb: int = 5) -> None:
        """Validate file size is within limits"""
        max_size_bytes = max_size_mb * 1024 * 1024
        if len(file_content) > max_size_bytes:
            raise ValueError(f"File too large (max {max_size_mb}MB)")
    
    def get_processing_stats(self, text: str, chunks: List[str]) -> dict:
        """Get statistics about the processed text"""
        return {
            "text_length": len(text),
            "chunk_count": len(chunks),
            "avg_chunk_size": sum(len(chunk) for chunk in chunks) // len(chunks) if chunks else 0,
            "max_chunk_size": max(len(chunk) for chunk in chunks) if chunks else 0,
            "min_chunk_size": min(len(chunk) for chunk in chunks) if chunks else 0
        }