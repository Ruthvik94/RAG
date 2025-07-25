import os
from dotenv import load_dotenv
load_dotenv()

# Database Configuration (Supabase PostgreSQL)
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASS", "")
DB_HOST = os.getenv("DB_HOST", "aws-0-us-east-2.pooler.supabase.com")
DB_PORT = os.getenv("DB_PORT", "6543")

# AI Model Configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
ENABLE_RAW_BODY_LOGGER = os.getenv('ENABLE_RAW_BODY_LOGGER', "false");
NODE_SERVICE_URL = os.getenv('NODE_SERVICE_URL', 'https://rag-document-crud.vercel.app/');