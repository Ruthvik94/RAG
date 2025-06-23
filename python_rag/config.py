import os
from dotenv import load_dotenv
load_dotenv()

DB_NAME = os.getenv("DB_NAME", "rag_db")
DB_USER = os.getenv("DB_USER", "rag_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "12345")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")