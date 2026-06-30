# RepoMind AI 🧠💻

RepoMind AI is a production-quality AI-powered codebase assistant. By entering any public GitHub repository URL, the application will shallow-clone the repository, filter out unnecessary assets, chunk and embed the codebase, generate structural summaries, draft a professional `README.md`, and support interactive natural language Q&A about the codebase using Retrieval-Augmented Generation (RAG) citing specific files.

---

## Key Features

- **GitHub Repository Cloning & Filtering**: Validates URLs, shallow-clones (`depth=1`), and parses code while ignoring binaries, media, configuration files over 500KB, `node_modules`, `.git`, etc.
- **Dual Vector Database Configuration**: Indexes code chunks using **ChromaDB**. In environments where ChromaDB C++ bindings cannot compile (such as some Windows setups without Build Tools), the system **automatically falls back** to a custom, lightweight NumPy-based JSON vector database.
- **Dual LLM Provider Support**: Connects to the **Gemini API** (using `gemini-1.5-flash` for high-speed analysis and large contexts) or falls back to **OpenAI API** (`gpt-4o-mini`).
- **Interactive Code Explorer**: Collapsible file tree that dynamically fetches and displays file contents side-by-side with line numbers.
- **README.md Pre-generator**: Automatically generates a complete, professional markdown README based on the code analysis, allowing users to copy it to their clipboard or download it.
- **ChatGPT-Style QA Chat**: Retrieve semantic contexts, ask architectural or code-level questions, and view cited file tags.
- **Dark Mode Glassmorphic UI**: High-fidelity theme designed with Tailwind CSS, HSL-tailored dark color scheme, and smooth micro-animations.

---

## Tech Stack

- **Frontend**: React (18+), Vite, Tailwind CSS, Lucide Icons.
- **Backend**: FastAPI, Python (3.11+), Uvicorn.
- **AI/RAG**: LangChain, LangChain Community, LangChain Google GenAI / OpenAI.
- **Database**: ChromaDB (Primary) / NumPy & JSON File Store (Fallback).
- **Git Processing**: GitPython.
- **Deployment**: Docker, Docker Compose, Nginx.

---

## Directory Structure

```
RepoMind Ai/
├── backend/
│   ├── api/             # FastAPI routes
│   ├── models/          # Request/Response schemas
│   ├── repository/      # Git cloning and scanning services
│   ├── services/        # Orchestrates cloning -> embedding -> summary
│   ├── rag/             # LLM chain and embedding logic
│   ├── utils/           # Chunking and stack detection helpers
│   ├── vectorstore/     # ChromaDB wrapper & NumPy JSON fallback database
│   ├── main.py          # FastAPI server entry point
│   ├── requirements.txt # Python dependency file
│   └── .env             # Active environment file (git-ignored)
├── frontend/
│   ├── src/
│   │   ├── components/  # React modular views (Sidebar, FileTree, Chat, etc.)
│   │   ├── App.jsx      # View coordinator and fetch routines
│   │   ├── index.css    # Tailwind entrypoint + glassmorphic utility rules
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js   # Vite settings with backend dev server proxy
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
├── nginx.conf           # Production Nginx reverse-proxy configuration
└── README.md            # You are here!
```

---

## Prerequisites

Before starting, ensure you have:
- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js v18+](https://nodejs.org/)
- [Git](https://git-scm.com/) installed and added to your system path.
- An API Key from **Google AI Studio** (Gemini API) *or* **OpenAI** (OpenAI API).

---

## Installation & Running Locally

### 1. Configure Backend Environment

Navigate into the `backend/` folder and set up environment variables:

```bash
cd backend
copy .env.example .env
```

Open the newly created `.env` file and insert your API Key(s):

```env
# Populate at least one:
GEMINI_API_KEY=AIzaSy...
# Or:
OPENAI_API_KEY=sk-...
```

### 2. Set Up & Run Backend

Create a Python virtual environment, activate it, and install dependencies:

```bash
# From workspace root:
python -m venv .venv

# Activate on Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Activate on Linux/macOS:
source .venv/bin/activate

# Install packages
pip install -r backend/requirements.txt

# Start local server
python backend/main.py
```

The FastAPI server will start on `http://localhost:8000`.

### 3. Set Up & Run Frontend

In a separate terminal, navigate to the `frontend/` directory, install packages, and start the Vite dev server:

```bash
cd frontend
npm install
npm run dev
```

The React application will launch on `http://localhost:3000`. It contains proxy rules that automatically route `/api/*` calls to your FastAPI backend.

---

## Docker Deployment (Docker Compose)

Running via Docker spins up both backend and frontend automatically inside a virtualized bridge network.

1. Ensure you have populated `backend/.env` with your API keys.
2. From the project root directory, run:

```bash
docker-compose up --build
```

This commands builds:
- **`backend` service**: Runs on port `8000` (FastAPI).
- **`frontend` service**: Built and served via **Nginx** on port `3000`.

Open your browser and navigate to `http://localhost:3000` to access the application.

---

## API Documentation

FastAPI automatically generates interactive documentation. Once the backend is running, go to:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Primary Endpoints:

- `POST /analyze-repository`: Trigger cloning and code chunk embedding.
  ```json
  { "repo_url": "https://github.com/user/project" }
  ```
- `POST /chat`: Run RAG-augmented QA chat against the indexed repository.
  ```json
  { "repository_id": "md5_hash", "question": "Explain authentication handler code" }
  ```
- `GET /readme/{repository_id}`: Fetch the raw pre-generated markdown README.
- `GET /repository/{repository_id}`: Fetch repository metadata (file tree, summary details, tech stack distribution).
- `GET /file/{repository_id}?path=relative_path`: Fetch raw text content of a specific code file in the repository.
