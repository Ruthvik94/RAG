# Retrieval-Augmented Generation (RAG) FastAPI Service

This project is a Retrieval-Augmented Generation (RAG) backend built with FastAPI, PostgreSQL (with [pgvector](https://github.com/pgvector/pgvector)), and [sentence-transformers](https://www.sbert.net/). It supports document ingestion, semantic search, and Redis-based async processing.

## Features

- Upload and ingest `.txt`, `.pdf`, or `.docx` files
- Store document content and embeddings in PostgreSQL using the `vector` type
- Query for relevant documents using semantic similarity
- Redis pub/sub worker for async ingestion and querying
- Pytest-based test suite

## Requirements

- Python 3.8+
- PostgreSQL 13+ with [pgvector extension](https://github.com/pgvector/pgvector)
- Redis server (for async ingestion/query)
- Superuser access to create the `vector` extension (one-time setup)

## Setup

1. **Clone the repository**

    ```sh
    git clone <your-repo-url>
    cd python_rag
    ```

2. **Create and activate a virtual environment**

    ```sh
    python3 -m venv venv
    source venv/bin/activate
    ```

3. **Install dependencies**

    ```sh
    pip install -r requirements.txt
    ```

4. **Install and configure PostgreSQL**

    - Make sure PostgreSQL is running.
    - Create a database and user:
      ```sql
      CREATE DATABASE rag_db;
      CREATE USER rag_user WITH PASSWORD '12345';
      GRANT ALL PRIVILEGES ON DATABASE rag_db TO rag_user;
      ```
    - **As a superuser, enable the pgvector extension:**
      ```sql
      \c rag_db
      CREATE EXTENSION IF NOT EXISTS vector;
      ```

5. **Start Redis**

    ```sh
    redis-server
    ```

6. **Run the FastAPI app**

    ```sh
    uvicorn main:app --reload
    ```

## Redis Worker

The app includes a background Redis worker (see [`api/redis_worker.py`](api/redis_worker.py)) that listens for document ingestion and query requests via Redis pub/sub channels (`ingest_requests`, `query_requests`). It processes requests and publishes responses to `ingest_responses` and `query_responses`.

## Running Test Cases

This project uses [pytest](https://docs.pytest.org/) for testing, including async and Redis worker tests.

1. **Install test dependencies**

    ```sh
    pip install pytest pytest-asyncio httpx
    ```

2. **Run all tests**

    ```sh
    pytest
    ```

    This will automatically discover and run all tests in the `tests/` directory.

3. **Run a specific test file**

    ```sh
    pytest tests/test_redis_worker.py
    ```

4. **Additional tips**

    - Make sure your virtual environment is activated before running tests.
    - You can see more verbose output with:

      ```sh
      pytest -v
      ```

    - To stop after the first failure:

      ```sh
      pytest --maxfail=1
      ```

## API Endpoints

### `POST /ingest/`

Upload a document for ingestion.

**Request:**  
- `file`: UploadFile (`.txt`, `.pdf`, `.docx`)

**Response:**  
```json
{"status": "success"}
```

### `POST /query/`

Query for relevant content.

**Request:**  
- `question`: string

**Response:**  
```json
{"answer": "Generated answer based on <retrieved context>"}
```

## Notes

- The Redis worker enables async ingestion and querying from external services (see [`api/redis_worker.py`](api/redis_worker.py)).
- The current implementation retrieves and concatenates relevant documents. For a full RAG pipeline, integrate an LLM to generate answers from the retrieved context.
- Only users with superuser privileges can create the `vector` extension. This must be done once per database.

## License

MIT

## Acknowledgements

- [FastAPI](https://fastapi.tiangolo.com/)
-