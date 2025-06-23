# RAG Document Platform – Python FastAPI & NestJS

This repository contains a full-stack Retrieval-Augmented Generation (RAG) backend system, including:
- **Python FastAPI service** for document ingestion, semantic search, and embedding storage (with PostgreSQL + pgvector).
- **NestJS Document CRUD API** for file upload, management, and integration with the Python backend via Redis.
- **Docker Compose** setup for easy local or production deployment.

---

## Features

- Upload and ingest `.txt`, `.pdf`, or `.docx` files
- Store document content and embeddings in PostgreSQL using the `vector` type
- Query for relevant documents using semantic similarity
- Redis pub/sub worker for async ingestion and querying
- Full CRUD API for documents (NestJS)
- Swagger/OpenAPI docs for the CRUD API
- Pytest-based test suite for Python backend

---

## Requirements

- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- (Optional for development) Python 3.8+ and Node.js 18+ if running services outside Docker

---

## Running with Docker

1. **Clone the repository**

   ```sh
   git clone <this-repo-url>
   cd rag