from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import PlainTextResponse
from backend.models.schemas import AnalyzeRequest, AnalyzeResponse, ChatRequest, ChatResponse, RepositoryDetailsResponse, ExplainRequest, ExplainResponse
from backend.services.analyzer import RepositoryAnalyzer
from backend.rag.engine import RAGEngine
from backend.vectorstore import get_vector_store
import os

router = APIRouter()

# Share single analyzer instance
analyzer = RepositoryAnalyzer()
rag_engine = RAGEngine()

@router.post("/analyze-repository", response_model=AnalyzeResponse)
async def analyze_repository(request: AnalyzeRequest):
    try:
        result = analyzer.analyze(request.repo_url)
        return AnalyzeResponse(
            repository_id=result["repository_id"],
            summary=result["summary"]
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"Error in analyze_repository: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze repository: {str(e)}")

@router.post("/chat", response_model=ChatResponse)
async def chat_with_repo(request: ChatRequest):
    repo_id = request.repository_id
    metadata = analyzer.get_metadata(repo_id)
    
    if not metadata:
        raise HTTPException(
            status_code=404, 
            detail="Repository analysis not found. Please analyze the repository first."
        )
        
    try:
        db_path = os.path.join(analyzer.db_base_dir, repo_id)
        vector_store = get_vector_store(db_path)
        
        answer, sources = rag_engine.answer_question(
            question=request.question,
            repo_name=metadata["repo_name"],
            tech_stack=metadata["tech_stack"],
            summary_data=metadata["summary"],
            vector_store=vector_store
        )
        
        return ChatResponse(
            answer=answer,
            sources=sources
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"Error in chat_with_repo: {e}")
        raise HTTPException(status_code=500, detail=f"RAG query failed: {str(e)}")

@router.get("/readme/{repository_id}")
async def get_readme(repository_id: str):
    metadata = analyzer.get_metadata(repository_id)
    if not metadata:
        raise HTTPException(status_code=404, detail="Repository not found")
        
    # Return raw markdown text directly
    return PlainTextResponse(metadata["readme_content"])

@router.get("/repository/{repository_id}", response_model=RepositoryDetailsResponse)
async def get_repository_details(repository_id: str):
    metadata = analyzer.get_metadata(repository_id)
    if not metadata:
        raise HTTPException(status_code=404, detail="Repository not found")
        
    return RepositoryDetailsResponse(
        repository_id=metadata["repository_id"],
        repo_url=metadata["repo_url"],
        repo_name=metadata["repo_name"],
        summary=metadata["summary"],
        tech_stack=metadata["tech_stack"],
        file_tree=metadata["file_tree"]
    )

@router.get("/file/{repository_id}")
async def get_file_content(repository_id: str, path: str):
    # Verify file is within temp/repo_id to prevent directory traversal
    temp_dir = os.path.abspath(analyzer.temp_base_dir)
    repo_dir = os.path.abspath(os.path.join(temp_dir, repository_id))
    
    # Fallback to suffix folders if the primary directory does not exist or only contains .git (empty code)
    if not os.path.exists(repo_dir) or len(os.listdir(repo_dir)) <= 1:
        matching_dirs = []
        if os.path.exists(temp_dir):
            for name in os.listdir(temp_dir):
                if name.startswith(repository_id) and os.path.isdir(os.path.join(temp_dir, name)):
                    matching_dirs.append(name)
        if matching_dirs:
            # Sort alphabetically (e.g., _1, _2) to select the latest/highest suffix directory
            matching_dirs.sort()
            repo_dir = os.path.abspath(os.path.join(temp_dir, matching_dirs[-1]))
            
    file_path = os.path.abspath(os.path.join(repo_dir, path))
    
    if not file_path.startswith(repo_dir):
        raise HTTPException(status_code=403, detail="Access denied")
        
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

        
    try:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        return PlainTextResponse(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")

@router.post("/explain", response_model=ExplainResponse)
async def explain_code(request: ExplainRequest):
    try:
        explanation = rag_engine.explain_code(
            code=request.code,
            filename=request.filename
        )
        return ExplainResponse(explanation=explanation)
    except Exception as e:
        print(f"Error in explain_code: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to explain code: {str(e)}")


