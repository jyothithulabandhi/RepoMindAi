import os
import json
from typing import List, Dict, Any
from langchain_text_splitters import RecursiveCharacterTextSplitter

def detect_tech_stack(repo_path: str, files_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Detects technologies, frameworks, and programming languages in the repository.
    """
    # Count extensions for language distribution
    languages = {}
    total_size = 0
    
    for f in files_data:
        lang = f["language"]
        size = f["size"]
        total_size += size
        languages[lang] = languages.get(lang, 0) + size
        
    # Calculate percentage
    lang_distribution = []
    if total_size > 0:
        for lang, size in languages.items():
            pct = round((size / total_size) * 100, 1)
            lang_distribution.append({"language": lang.capitalize(), "percentage": pct, "size": size})
        # Sort by percentage descending
        lang_distribution.sort(key=lambda x: x["percentage"], reverse=True)

    # Detect frameworks / libraries
    frameworks = []
    
    # Check for specific files at the root or within subfolders
    for f in files_data:
        path = f["path"]
        name = f["name"].lower()
        content = f["content"]
        
        # Node projects
        if name == "package.json":
            frameworks.append("Node.js")
            try:
                pkg_data = json.loads(content)
                deps = {**pkg_data.get("dependencies", {}), **pkg_data.get("devDependencies", {})}
                
                if "react" in deps:
                    frameworks.append("React")
                if "vue" in deps:
                    frameworks.append("Vue")
                if "svelte" in deps:
                    frameworks.append("Svelte")
                if "next" in deps:
                    frameworks.append("Next.js")
                if "nuxt" in deps:
                    frameworks.append("Nuxt.js")
                if "express" in deps:
                    frameworks.append("Express.js")
                if "typescript" in deps:
                    frameworks.append("TypeScript")
                if "tailwindcss" in deps:
                    frameworks.append("Tailwind CSS")
                if "vite" in deps:
                    frameworks.append("Vite")
            except Exception:
                pass
                
        # Python projects
        if name == "requirements.txt" or name == "pipfile" or name == "pyproject.toml":
            frameworks.append("Python")
            if "django" in content.lower():
                frameworks.append("Django")
            if "flask" in content.lower():
                frameworks.append("Flask")
            if "fastapi" in content.lower():
                frameworks.append("FastAPI")
            if "streamlit" in content.lower():
                frameworks.append("Streamlit")
            if "pandas" in content.lower():
                frameworks.append("Pandas")
            if "numpy" in content.lower():
                frameworks.append("NumPy")
            if "langchain" in content.lower():
                frameworks.append("LangChain")
                
        # Go projects
        if name == "go.mod":
            frameworks.append("Go")
            if "gin-gonic" in content.lower():
                frameworks.append("Gin")
                
        # Rust projects
        if name == "cargo.toml":
            frameworks.append("Rust")
            if "tokio" in content.lower():
                frameworks.append("Tokio")
                
        # Java/Kotlin build tools
        if name == "pom.xml":
            frameworks.append("Maven")
            if "spring-boot" in content.lower():
                frameworks.append("Spring Boot")
        if "build.gradle" in name:
            frameworks.append("Gradle")
            
        # Docker
        if name == "dockerfile" or name == "docker-compose.yml":
            if "Docker" not in frameworks:
                frameworks.append("Docker")
                
        # Databases / ORMs in content
        if "prisma" in content.lower() and "Prisma" not in frameworks:
            frameworks.append("Prisma")
        if "mongoose" in content.lower() and "Mongoose" not in frameworks:
            frameworks.append("Mongoose")
        if "sqlalchemy" in content.lower() and "SQLAlchemy" not in frameworks:
            frameworks.append("SQLAlchemy")

    # Remove duplicates
    unique_frameworks = []
    for fw in frameworks:
        if fw not in unique_frameworks:
            unique_frameworks.append(fw)

    # General fallback based on language percentage if no frameworks found
    if not unique_frameworks and lang_distribution:
        unique_frameworks.append(lang_distribution[0]["language"])

    return {
        "languages": lang_distribution,
        "frameworks": unique_frameworks,
        "total_files": len(files_data),
        "total_size_bytes": total_size
    }

def generate_file_tree(files_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Constructs a nested tree structure representing the files and folders.
    E.g. [
        { "name": "src", "type": "directory", "children": [ ... ] },
        { "name": "package.json", "type": "file", "path": "package.json", "language": "json" }
    ]
    """
    root = {"children": {}}
    
    for f in files_data:
        path = f["path"]
        parts = path.split("/")
        
        current = root
        for i, part in enumerate(parts):
            if i == len(parts) - 1:
                # File
                current["children"][part] = {
                    "name": part,
                    "type": "file",
                    "path": path,
                    "language": f["language"],
                    "size": f["size"]
                }
            else:
                # Directory
                if part not in current["children"]:
                    current["children"][part] = {
                        "name": part,
                        "type": "directory",
                        "children": {}
                    }
                current = current["children"][part]
                
    # Helper to convert dictionary children to sorted list
    def dict_to_list(node):
        if "children" not in node:
            return node
            
        children_list = []
        for child in node["children"].values():
            children_list.append(dict_to_list(child))
            
        # Sort directories first, then files alphabetically
        children_list.sort(key=lambda x: (0 if x["type"] == "directory" else 1, x["name"].lower()))
        
        node_copy = {k: v for k, v in node.items() if k != "children"}
        node_copy["children"] = children_list
        return node_copy

    result = dict_to_list(root)
    return result.get("children", [])

def chunk_document(content: str, file_path: str, language: str, chunk_size: int = 1500, chunk_overlap: int = 200) -> List[Dict[str, Any]]:
    """
    Splits document content into chunked sections using LangChain's RecursiveCharacterTextSplitter.
    Includes file path metadata in chunks.
    """
    # Map internal language identifier to LangChain splitter languages
    lang_mapping = {
        'python': 'python',
        'javascript': 'js',
        'typescript': 'ts',
        'html': 'html',
        'css': 'cpp', # Closest approximate or default
        'go': 'go',
        'rust': 'rust',
        'java': 'java',
        'kotlin': 'kotlin',
        'cpp': 'cpp',
        'csharp': 'csharp',
        'ruby': 'ruby',
        'php': 'php',
        'swift': 'swift',
        'markdown': 'markdown'
    }
    
    lc_lang = lang_mapping.get(language.lower())
    
    if lc_lang:
        try:
            splitter = RecursiveCharacterTextSplitter.from_language(
                language=lc_lang,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap
            )
        except Exception:
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap
            )
    else:
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
        
    texts = splitter.split_text(content)
    
    chunks = []
    for i, text in enumerate(texts):
        # We append code source header to help LLM locate context better
        header = f"// File: {file_path} (Language: {language})\n" if language != 'markdown' else f"<!-- File: {file_path} -->\n"
        chunks.append({
            "page_content": header + text,
            "metadata": {
                "source": file_path,
                "filename": os.path.basename(file_path),
                "language": language,
                "chunk_index": i
            }
        })
        
    return chunks
