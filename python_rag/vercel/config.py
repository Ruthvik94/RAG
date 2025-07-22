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