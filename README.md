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
   ```

2. **Create environment variable files**

   ```sh
   cp .env.example .env
   cp python_rag/.env.example python_rag/.env
   cp document_crud/src/.env.example document_crud/src/.env
   ```
   - Edit the `.env` files as needed.
   - For passwords, you can use a value like `12345` or set your own secure password.

3. **Build and start all services**

   ```sh
   docker-compose up --build
   ```

   This will start:
   - PostgreSQL (with pgvector extension)
   - Redis
   - Python FastAPI backend (on [http://localhost:8000](http://localhost:8000))
   - NestJS CRUD API (on [http://localhost:3000](http://localhost:3000))

4. **Stopping and resetting**

   - To stop all services:
     ```sh
     docker-compose down
     ```
   - To remove all data (reset database/volumes):
     ```sh
     docker-compose down