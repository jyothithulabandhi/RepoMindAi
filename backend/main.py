import os
import sys

# Ensure the parent directory is in sys.path so 'backend' can be imported correctly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from backend.api.routes import router as api_router

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

app = FastAPI(
    title="RepoMind AI API",
    description="Backend API for RepoMind AI - Codebase analysis and RAG QA",
    version="1.0.0"
)

# CORS setup for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, lock this down to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure temp and db folders exist
os.makedirs(os.path.abspath("backend/temp"), exist_ok=True)
os.makedirs(os.path.abspath("backend/db"), exist_ok=True)

# Include router at root and with /api prefix for compatibility
app.include_router(api_router)
app.include_router(api_router, prefix="/api")

# Serve frontend build static files if present (for single-container production deployment)
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))
if os.path.exists(frontend_dist):
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    @app.get("/")
    async def root():
        return {
            "status": "online",
            "message": "Welcome to RepoMind AI API. Use /analyze-repository to begin."
        }

if __name__ == "__main__":
    import uvicorn
    # Use port 8000 by default
    port = int(os.getenv("PORT", "8000"))
    
    # Configure reload directories to exclude 'temp' and 'db' to prevent file locks on Windows
    script_dir = os.path.dirname(os.path.abspath(__file__))
    reload_dirs = [
        os.path.join(script_dir, "api"),
        os.path.join(script_dir, "services"),
        os.path.join(script_dir, "rag"),
        os.path.join(script_dir, "vectorstore"),
        os.path.join(script_dir, "repository"),
        os.path.join(script_dir, "models"),
        os.path.join(script_dir, "utils"),
    ]
    # Filter to only existing directories
    existing_reload_dirs = [d for d in reload_dirs if os.path.isdir(d)]
    
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=port, 
        reload=True, 
        reload_dirs=existing_reload_dirs
    )
