import os
from dotenv import load_dotenv
load_dotenv()

# DB_NAME = os.getenv("DB_NAME", "documents_db")
# DB_USER = os.getenv("DB_USER", "rag_user")
# DB_PASSWORD = os.getenv("DB_PASSWORD", "12345")
# DB_HOST = os.getenv("DB_HOST", "localhost")
# DB_PORT = os.getenv("DB_PORT", "5432")

# REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
# REDIS_PORT = os.getenv("REDIS_PORT", "6379")

# EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", 'sentence-transformers/all-MiniLM-L6-v2')
# QA_MODEL = os.getenv("QA_MODEL", 'distilbert-base-cased-distilled-squad')

# DATASET = os.getenv("DATASET", 'ag_news')

# Supabase PostgreSQL
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASS", "")
DB_HOST = os.getenv("DB_HOST", "aws-0-us-east-2.pooler.supabase.com")
DB_PORT = os.getenv("DB_PORT", "6543")

# Upstash Redis
REDIS_URL = os.getenv('REDIS_URL', "cunning-marlin-19914.upstash.io")
REDIS_HOST = os.getenv("REDIS_HOST", "cunning-marlin-19914.upstash.io")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")
# REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "your-redis-password")

# Models
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", 'sentence-transformers/all-MiniLM-L6-v2')
QA_MODEL = os.getenv("QA_MODEL", 'distilbert-base-cased-distilled-squad')

DATASET = os.getenv("DATASET", 'ag_news')

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '');