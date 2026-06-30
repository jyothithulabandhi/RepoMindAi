import os
import json
import hashlib
from typing import Dict, Any, List
from backend.repository.git_service import GitService
from backend.utils.helpers import detect_tech_stack, generate_file_tree, chunk_document
from backend.vectorstore import get_vector_store
from backend.rag.engine import RAGEngine

class RepositoryAnalyzer:
    def __init__(self, temp_base_dir: str = "backend/temp", db_base_dir: str = "backend/db"):
        # Make paths absolute or relative to workspace
        self.temp_base_dir = os.path.abspath(temp_base_dir)
        self.db_base_dir = os.path.abspath(db_base_dir)
        self.rag_engine = RAGEngine()

    def get_repo_id(self, url: str) -> str:
        """Generates a stable, unique md5 hash based on repo URL."""
        # Standardize URL slightly
        clean_url = url.strip().rstrip('/')
        return hashlib.md5(clean_url.encode('utf-8')).hexdigest()

    def get_metadata(self, repo_id: str) -> Dict[str, Any]:
        """Retrieves cached metadata if it exists."""
        meta_path = os.path.join(self.db_base_dir, repo_id, "metadata.json")
        if os.path.exists(meta_path):
            try:
                with open(meta_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading cached metadata for {repo_id}: {e}")
        return {}

    def analyze(self, repo_url: str) -> Dict[str, Any]:
        """
        Runs the complete analysis workflow: clones, scans, chunks, indexes,
        summarizes and saves metadata.
        """
        # 1. Validate
        if not GitService.validate_url(repo_url):
            raise ValueError(f"Invalid repository URL format: {repo_url}")
            
        repo_id = self.get_repo_id(repo_url)
        cached_meta = self.get_metadata(repo_id)
        
        # Return cache if available to avoid API and compute costs
        if cached_meta:
            print(f"Returning cached analysis for repository ID: {repo_id}")
            return {
                "repository_id": repo_id,
                "summary": cached_meta["summary"],
                "tech_stack": cached_meta["tech_stack"],
                "file_tree": cached_meta["file_tree"]
            }

        # 2. Clone
        clone_path = os.path.join(self.temp_base_dir, repo_id)
        owner, name = GitService.get_repo_identifiers(repo_url)
        repo_name = f"{owner}/{name}"
        
        print(f"Cloning {repo_url} to {clone_path}...")
        clone_path = GitService.clone_repository(repo_url, clone_path)

        try:
            # 3. Scan files
            print("Scanning repository files...")
            files_data = GitService.scan_repository(clone_path)
            if not files_data:
                raise ValueError("The repository does not contain any readable text files or is empty.")
                
            # 4. Tech stack & file tree
            print("Extracting repository metadata...")
            tech_stack = detect_tech_stack(clone_path, files_data)
            file_tree = generate_file_tree(files_data)
            
            # Form file tree string representation for LLM prompt context
            # Select max 50 files to list in prompt to avoid token bloat
            file_tree_str = "\n".join([f["path"] for f in files_data[:60]])
            if len(files_data) > 60:
                file_tree_str += f"\n... and {len(files_data) - 60} more files."

            # 5. Select key config files to provide context for summary
            print("Selecting key files for analysis...")
            key_files = {}
            # Prioritize files like package.json, requirements.txt, Cargo.toml, go.mod, readme, main entry points
            priority_names = {
                "package.json", "requirements.txt", "cargo.toml", "go.mod", 
                "readme.md", "main.py", "index.js", "app.js", "docker-compose.yml"
            }
            
            for f in files_data:
                if f["name"].lower() in priority_names:
                    key_files[f["path"]] = f["content"]
                    if len(key_files) >= 5: # limit to 5 configuration files
                        break
                        
            # If no priority files, just take first 2 source files
            if not key_files:
                for f in files_data[:2]:
                    key_files[f["path"]] = f["content"]

            # 6. Generate Summary using LLM
            print("Generating project summary with AI...")
            summary = self.rag_engine.generate_summary(repo_name, tech_stack, file_tree_str, key_files)
            
            # 7. Generate README using LLM
            print("Generating README.md...")
            readme_content = self.rag_engine.generate_readme(repo_name, summary, tech_stack)

            # 8. Chunk documents for embedding
            print("Splitting files into chunks...")
            all_chunks = []
            for f in files_data:
                chunks = chunk_document(f["content"], f["path"], f["language"])
                all_chunks.extend(chunks)

            # 9. Embed and Index in Vector Store
            db_path = os.path.join(self.db_base_dir, repo_id)
            print(f"Initializing vector store at {db_path}...")
            vector_store = get_vector_store(db_path)
            
            print(f"Generating embeddings for {len(all_chunks)} chunks...")
            
            # Batch embedding generation to prevent API limits or large payload errors
            batch_size = 50
            embeddings = []
            
            for i in range(0, len(all_chunks), batch_size):
                batch_chunks = all_chunks[i:i+batch_size]
                batch_texts = [chunk["page_content"] for chunk in batch_chunks]
                print(f"Embedding batch {i//batch_size + 1}/{(len(all_chunks)-1)//batch_size + 1}...")
                batch_embs = self.rag_engine.embed_documents(batch_texts)
                embeddings.extend(batch_embs)
                
            print("Storing embeddings in database...")
            vector_store.add_documents(all_chunks, embeddings)

            # 10. Cache Metadata
            metadata = {
                "repository_id": repo_id,
                "repo_url": repo_url,
                "repo_name": repo_name,
                "summary": summary,
                "tech_stack": tech_stack,
                "file_tree": file_tree,
                "readme_content": readme_content
            }
            
            os.makedirs(os.path.dirname(os.path.join(db_path, "metadata.json")), exist_ok=True)
            with open(os.path.join(db_path, "metadata.json"), "w", encoding="utf-8") as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)
                
            print(f"Analysis completed successfully for {repo_name}.")
            return {
                "repository_id": repo_id,
                "summary": summary,
                "tech_stack": tech_stack,
                "file_tree": file_tree
            }
            
        except Exception as e:
            # If cloning succeeded but processing failed, keep temp clone or clean it?
            # It's safer to keep for debugging, but raise exception
            raise e
