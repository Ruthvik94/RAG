import os
from dotenv import load_dotenv
load_dotenv()

DB_NAME = os.getenv("DB_NAME", "documents_db")
DB_USER = os.getenv("DB_USER", "rag_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "12345")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", 'sentence-transformers/all-MiniLM-L6-v2')
QA_MODEL = os.getenv("QA_MODEL", 'distilbert-base-cased-distilled-squad')