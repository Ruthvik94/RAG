# Clean, focused imports for TextProcessor
from typing import List, Tuple
from .file_utils_light import extract_text_from_file, chunk_text_sliding_window

class TextProcessor:
    """Handle text extraction and chunking operations"""
    
    def get_dynamic_chunk_params(self, content_size_bytes: int) -> Tuple[int, int]:
        """
        Determine optimal chunk size and overlap based on file size
        Optimized for demo: sub-60s processing with rate limit compliance
        
        Args:
            content_size_bytes: Size of the file content in bytes
            
        Returns:
            Tuple of (chunk_size, overlap)
        """
        content_size_kb = content_size_bytes / 1024  # Convert bytes to KB
        
        if content_size_kb < 5:  # Very small files (< 5KB)
            return 4000, 400  # Large chunks for minimal API calls
        elif content_size_kb < 10:  # Small files (5-10KB)
            return 4500, 450
        elif content_size_kb < 25:  # Medium files (10-25KB)
            return 5000, 500
        elif content_size_kb < 50:  # Medium-large files (25-50KB)
            return 6000, 600
        elif content_size_kb < 500:  # Large files (50-500KB)
            return 8000, 800  # Very large chunks
        elif content_size_kb < 1500:  # Very large files (500KB-1.5MB)
            return 10000, 1000  # Ultra-large chunks for demo
        elif content_size_kb < 3000:  # Huge files (1.5-3MB)
            return 12000, 1200  # Maximum chunk size for rate limits
        else:  # Very huge files (>3MB)
            return 16000, 1600  # Extreme chunking for sub-60s demo
    
    async def process_file_content(self, filename: str, file_content: bytes) -> Tuple[str, List[str]]:
        """
        Extract text from file content and chunk it with dynamic parameters
        
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
        
        # Get dynamic chunk parameters based on file size
        chunk_size, overlap = self.get_dynamic_chunk_params(len(file_content))
        
        # Chunk text with dynamic parameters
        chunks = chunk_text_sliding_window(text, chunk_size=chunk_size, overlap=overlap)
        
        return text, chunks