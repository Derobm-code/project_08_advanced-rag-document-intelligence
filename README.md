# Advanced RAG Document Intelligence

An end-to-end **Retrieval-Augmented Generation (RAG)** application that allows users to upload PDF documents, perform semantic searches, and ask natural-language questions with AI-generated answers supported by document citations.

Built using **FastAPI, React, TypeScript, Qdrant, SentenceTransformers, and Groq**.

## Overview

Advanced RAG Document Intelligence combines semantic vector search with large language model reasoning to help users explore and understand PDF documents.

Instead of relying solely on an LLM's general knowledge, the application retrieves relevant passages from the uploaded document and uses them as context for generating grounded answers.

Users can inspect the supporting sources and navigate directly to the corresponding pages in the integrated PDF viewer.

## Key Features

### PDF Document Upload and Processing
- Upload PDF documents through a web interface.
- Extract text using PyMuPDF.
- Split extracted text into manageable chunks.
- Generate embeddings using SentenceTransformers.
- Store document embeddings and metadata in Qdrant.

### Semantic Document Search
- Search PDF contents using natural-language queries.
- Retrieve the most semantically relevant passages.
- Display source filenames, page numbers, and similarity scores.
- Search by meaning rather than exact keyword matches.

### AI-Powered Question Answering
- Ask questions about the uploaded PDF.
- Retrieve relevant document passages using vector similarity.
- Generate answers using Groq's `openai/gpt-oss-20b` model.
- Ground generated answers in retrieved document content.
- Return supporting citations for verification.

### Source Citations and PDF Viewer
- Display source passages alongside AI-generated answers.
- Identify the PDF page associated with each citation.
- Click a citation to navigate to the referenced page.
- Browse PDF pages using Previous and Next controls.

### Single-Document Indexing
- Maintain one active indexed document at a time.
- Automatically replace previously indexed document chunks when a new PDF is uploaded.
- Prevent search results from mixing content from older documents.

### Backend API
- REST API built with FastAPI.
- Dedicated endpoints for uploading, searching, and asking questions.
- Health-check and document-information endpoints.
- Interactive API documentation through Swagger UI.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Backend | Python, FastAPI |
| PDF Processing | PyMuPDF |
| Embedding Model | SentenceTransformers (`all-MiniLM-L6-v2`) |
| Vector Database | Qdrant |
| Language Model | Groq (`openai/gpt-oss-20b`) |
| HTTP Client | Axios |
| PDF Viewer | React-PDF |

## System Architecture

```text
                  USER
                   |
                   v
             React Frontend
                   |
                   v
              FastAPI API
                   |
          +--------+--------+
          |                 |
          v                 v
     PDF Upload        User Question
          |                 |
          v                 v
   Text Extraction     Query Embedding
          |                 |
          v                 |
     Text Chunking          |

          |                 |
          v                 |
  Document Embeddings       |
          |                 |
          v                 v
       Qdrant Vector Database
                   |
                   v
          Relevant Passages
                   |
          +--------+--------+
          |                 |
          v                 v
    Semantic Search     Groq LLM
       Results              |
                            v
                    Grounded Answer
                      + Citations
                            |
                            v
                    React PDF Viewer
```

## How It Works

### 1. Document Ingestion

When a user uploads a PDF:

1. FastAPI receives the uploaded file.
2. PyMuPDF extracts text from the document.
3. The extracted text is divided into chunks.
4. SentenceTransformers generates embeddings for each chunk.
5. Qdrant stores the embeddings with document metadata, including page numbers.
6. Previously indexed document chunks are removed, leaving the newly uploaded document as the active document.

### 2. Semantic Search

When a user enters a search query:

1. The query is converted into a vector embedding.
2. Qdrant compares the query embedding with stored document embeddings.
3. The most relevant passages are retrieved.
4. The frontend displays the matching passages, page numbers, and similarity scores.

Semantic Search returns relevant source text without generating an AI-written answer.

### 3. Retrieval-Augmented Question Answering

When a user asks a question:

1. The question is converted into an embedding.
2. Qdrant retrieves relevant document passages.
3. Retrieved passages are assembled into context for the language model.
4. Groq generates an answer based on the provided context.
5. The API returns the answer and supporting citations.
6. Users can inspect the cited passages and open their corresponding PDF pages.

## Project Structure

```text
project_08_advanced_rag/
|
|-- backend/
|   |-- app/
|   |   |-- main.py
|   |   |-- services/
|   |   |   |-- rag_service.py
|   |   |   |-- vector_store.py
|   |   |   `-- ...
|   |   `-- ...
|   |-- qdrant_storage/          # Generated locally
|   |-- .env                     # Local secrets; not committed
|   |-- .env.example
|   `-- requirements.txt
|
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |   |-- DocumentUpload.tsx
|   |   |   |-- SemanticSearch.tsx
|   |   |   |-- AskAI.tsx
|   |   |   `-- PDFViewer.tsx
|   |   |-- App.tsx
|   |   `-- index.css
|   |-- package.json
|   `-- ...
|
|-- .gitignore
`-- README.md
```

*This is a simplified directory overview; additional application files and configuration may be present.*

## Getting Started

### Prerequisites

Make sure you have installed:

- Python 3.10 or newer
- Node.js and npm
- Git
- A Groq API key

### 1. Clone the Repository

```bash
git clone https://github.com/Derobm-code/project_08_advanced-rag-document-intelligence.git
cd advanced-rag-document-intelligence
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Set Up the Backend

Open a terminal in the backend directory:

```powershell
cd backend
```

Create a virtual environment:

```powershell
python -m venv .venv
```

Activate it in Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the required dependencies:

```powershell
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` directory:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Replace the placeholder with your actual Groq API key.

Start the FastAPI server:

```powershell
uvicorn app.main:app --reload --port 8000
```

The backend runs at:

`http://localhost:8000`

Interactive API documentation:

`http://localhost:8000/docs`

### 3. Set Up the Frontend

Open a second terminal:

```powershell
cd frontend
```

Install dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

Open the application at:

`http://localhost:5173`

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check backend availability |
| POST | `/api/upload` | Upload and index a PDF |
| POST | `/api/search` | Retrieve semantically relevant passages |
| POST | `/api/ask` | Generate a document-grounded AI answer |
| GET | `/api/documents` | List indexed documents |
| GET | `/api/documents/count` | Return the indexed document count |

### Example: Semantic Search

**Request**

```http
POST /api/search
Content-Type: application/json
```

```json
{
  "query": "What are the main findings?",
  "limit": 5
}
```

The API returns relevant document passages with their page numbers and similarity scores.

### Example: Ask AI

**Request**

```http
POST /api/ask
Content-Type: application/json
```

```json
{
  "question": "Summarize the key conclusions of this document.",
  "limit": 5
}
```

The API returns an AI-generated answer and supporting citations from the indexed PDF.

## Application Workflow

1. **Upload a PDF:** Select a PDF document and wait for processing to complete.
2. **Semantic Search:** Enter a natural-language query to find relevant passages.
3. **Ask AI:** Ask a question to generate a document-grounded answer.
4. **Review Citations:** Examine the passages supporting the answer.
5. **Navigate the PDF:** Click a cited page to view it in the PDF viewer.
6. **Upload Another PDF:** Replace the active document and repeat the process.

## Design Decisions

**Local vector storage:** Qdrant runs in embedded local mode, avoiding the need for a separate vector database server during development.

**Single active document:** Replacing previously indexed document content prevents irrelevant retrieval from older uploads.

**Separate Search and Ask AI workflows:** Semantic Search provides direct access to retrieved passages, while Ask AI generates answers using those passages as context.

**Verifiable answers:** Page-level citations allow users to inspect the underlying evidence instead of relying solely on generated text.

## Current Limitations

- Only one PDF document is actively indexed at a time.
- The PDF viewer uses the uploaded browser file, so its preview is not preserved after a full page refresh.
- The application is configured for local development.
- The quality of generated answers depends on the extracted PDF text, retrieval relevance, and language model output.
- Scanned or image-only PDFs may require OCR before their contents can be searched.

## Future Improvements

- Persistent PDF storage
- Multi-document collections and document filtering
- OCR support for scanned documents
- Hybrid keyword and semantic retrieval
- RAG evaluation and retrieval-quality metrics
- Streaming AI responses
- User authentication
- Cloud deployment

## Skills Demonstrated

- Retrieval-Augmented Generation (RAG)
- Semantic search and vector embeddings
- Vector database integration
- LLM API integration
- PDF parsing and document chunking
- REST API development with FastAPI
- React and TypeScript frontend development
- Source citation and document navigation
- Full-stack AI application architecture

## Security Notes

- Store API keys in environment variables.
- Never commit `.env` files or credentials to GitHub.
- Exclude local vector database storage and virtual environments from version control.
- Validate uploaded files before processing.

## Project Status

**Core implementation completed — local development project.**

The application supports PDF ingestion, semantic search, grounded AI question answering, source citations, and PDF page navigation.
