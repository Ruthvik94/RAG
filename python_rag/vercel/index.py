# from api.redis_worker_upstash import start_redis_worker
# from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from api.endpoints_gemini import router as gemini_router
from starlette.middleware.base import BaseHTTPMiddleware
from dotenv import load_dotenv
from config import ENABLE_RAW_BODY_LOGGER, NODE_SERVICE_URL

load_dotenv()

# Remove lifespan - not compatible with Vercel serverless
app = FastAPI(
    title="Python RAG API",
    description="Document ingestion and query API",
    version="1.0.0"
)

# Configure CORS for direct API communication
allowed_origins = [
    "http://localhost:3000",  # Node.js service (local)
]

# Add Node.js service production URL if configured
allowed_origins.append(NODE_SERVICE_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

print(f"🌐 CORS configured for origins: {allowed_origins}")

class RawBodyLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if request.url.path.startswith("/rag/ingest"):
            print("==== Incoming Request Headers ====")
            for k, v in request.headers.items():
                print(f"{k}: {v}")
            body = await request.body()
            print(f"==== Raw Body (first 512 bytes, hex) ====")
            print(body[:512].hex())
            print(f"==== Raw Body Length: {len(body)} bytes ====")
        response = await call_next(request)
        return response


if ENABLE_RAW_BODY_LOGGER:
    app.add_middleware(RawBodyLoggerMiddleware)
    print("🪵 RawBodyLoggerMiddleware ENABLED")
else:
    print("🪵 RawBodyLoggerMiddleware DISABLED")

# Include RAG endpoints with /rag prefix
app.include_router(gemini_router, prefix="/rag", tags=["gemini"])

# Health check endpoint
@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/")
async def root():
    return {"message": "Hello from Python RAG API, index.py"}