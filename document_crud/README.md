# Document CRUD API (NestJS)

A NestJS application for managing documents (`.txt`, `.pdf`, `.docx`) with PostgreSQL, file upload, and integration with a Python RAG backend via Redis.

---

## Features

- **CRUD for Documents**: Upload, list, update, and delete documents.
- **File Upload**: Supports `.txt`, `.pdf`, `.docx` files up to 5MB.
- **PostgreSQL Storage**: Uses TypeORM for database operations.
- **Python Integration**: Communicates with a Python backend using Redis pub/sub.
- **Swagger API Docs**: Available at `/api`.

---

## Project Structure

```
document_crud/
├── jest.config.js
├── package.json
├── tsconfig.json
├── scripts/
│   └── create-db.js
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── ormconfig.ts
│   ├── documents/
│   │   ├── documents.controller.ts
│   │   ├── documents.service.ts
│   │   ├── documents.module.ts
│   │   ├── documents.entity.ts
│   │   ├── dto/
│   │   │   ├── create-document.dto.ts
│   │   │   ├── update-document.dto.ts
│   │   │   └── test/
│   │   │       ├── create-document.dto.spec.ts
│   │   │       └── update-document.dto.spec.ts
│   │   └── test/
│   │       ├── documents.controller.spec.ts
│   │       └── documents.service.spec.ts
│   ├── python-redis/
│   │   ├── python-redis.controller.ts
│   │   ├── python-redis.service.ts
│   │   ├── python-redis.module.ts
│   │   └── test/
│   │       ├── python-redis.controller.spec.ts
│   │       └── python-redis.service.spec.ts
│   └── types/
│       └── index.ts
├── uploads/
│   └── (uploaded files)
└── README.md
```

---

## Setup Instructions

### 1. Clone the repository

```sh
git clone <repository-url>
cd document_crud
```

### 2. Install dependencies

```sh
npm install
```

### 3. Configure the database

- Make sure PostgreSQL is running.
- Edit [`src/ormconfig.ts`](src/ormconfig.ts) if you need to change DB credentials.
- Create the database (default: `documents_db`). You can use the script:

```sh
node scripts/create-db.js
```

### 4. Run the application

```sh
npm run start
```

- The API will be available at `http://localhost:3000`.
- Swagger docs: `http://localhost:3000/api`

### 5. Run tests

```sh
npm test
```

---

## API Endpoints

### Documents

- `GET /documents` — List all documents
- `GET /documents/:id` — Download a document by ID
- `POST /documents` — Upload a new document (multipart/form-data, field: `file`)
- `PUT /documents/:id` — Update a document file (multipart/form-data, field: `file`)
- `DELETE /documents/:id` — Delete a document

### Python Integration

- `POST /python/ingest` — Ingest a file to Python backend (multipart/form-data, field: `file`)
- `POST /python/query` — Query the Python backend (`{ question: string }`)

---

## Notes

- Only `.txt`, `.pdf`, `.docx` files up to 5MB are accepted for upload.
- Uploaded files are stored in the `uploads/` directory.
- The Python backend must be running and connected to the same Redis instance for `/python` endpoints to work.

---

## License

MIT