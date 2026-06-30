from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class AnalyzeRequest(BaseModel):
    repo_url: str

class AnalyzeResponse(BaseModel):
    repository_id: str
    summary: Dict[str, Any]

class ChatRequest(BaseModel):
    repository_id: str
    question: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]
    
class RepositoryDetailsResponse(BaseModel):
    repository_id: str
    repo_url: str
    repo_name: str
    summary: Dict[str, Any]
    tech_stack: Dict[str, Any]
    file_tree: List[Dict[str, Any]]

class ExplainRequest(BaseModel):
    code: str
    filename: str

class ExplainResponse(BaseModel):
    explanation: str

