import time
import os
from typing import Dict, Any

class RAGLogger:
    """Configurable logger for RAG system"""
    
    def __init__(self):
        # Set log level from environment variable
        self.log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
        self.levels = {
            'DEBUG': 0,
            'INFO': 1, 
            'WARN': 2,
            'ERROR': 3
        }
    
    def _should_log(self, level: str) -> bool:
        return self.levels.get(level, 1) >= self.levels.get(self.log_level, 1)
    
    def debug(self, message: str):
        if self._should_log('DEBUG'):
            print(f"🐛 {message}")
    
    def info(self, message: str):
        if self._should_log('INFO'):
            print(f"ℹ️  {message}")
    
    def warn(self, message: str):
        if self._should_log('WARN'):
            print(f"⚠️  {message}")
    
    def error(self, message: str):
        if self._should_log('ERROR'):
            print(f"❌ {message}")
    
    def timing(self, message: str, duration: float):
        """Log timing information"""
        if self._should_log('DEBUG'):
            print(f"⏱️  {message}: {duration:.3f}s")
    
    def performance(self, stats: Dict[str, Any]):
        """Log performance summary (always shown)"""
        print(f"📊 {stats}")

# Global logger instance
logger = RAGLogger()