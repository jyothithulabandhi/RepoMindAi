import os
import re
import shutil
import tempfile
from typing import List, Dict, Any, Tuple
import git

class GitService:
    @staticmethod
    def validate_url(url: str) -> bool:
        """
        Validates whether a URL is a valid Git/GitHub repository.
        Supports standard HTTP(S) URLs.
        """
        # Regex to validate HTTP(S) or SSH git repository URLs
        pattern = r'^(https://|http://|git@)(github\.com|gitlab\.com|bitbucket\.org|[\w\.-]+)/([\w\.-]+)/([\w\.-]+?)(?:\.git|/)?$'
        return bool(re.match(pattern, url))

    @staticmethod
    def get_repo_identifiers(url: str) -> Tuple[str, str]:
        """
        Extracts owner and repo name from URL.
        """
        # Clean URL
        clean_url = url.strip().rstrip('/')
        if clean_url.endswith('.git'):
            clean_url = clean_url[:-4]
            
        parts = clean_url.split('/')
        if len(parts) >= 2:
            return parts[-2], parts[-1]
        return "unknown", "repo"

    @staticmethod
    def clone_repository(url: str, target_dir: str) -> str:
        """
        Clones a git repository into target_dir.
        If target_dir already exists, it attempts to remove it first.
        If the directory is still not empty (e.g. locked files), it finds a unique fallback path.
        """
        path = target_dir
        
        # Helper to force-delete directories with read-only files on Windows (.git folder)
        import stat
        def remove_readonly(func, p, exc_info):
            try:
                os.chmod(p, stat.S_IWRITE)
                func(p)
            except Exception:
                pass
                
        if os.path.exists(path):
            shutil.rmtree(path, onerror=remove_readonly)
            
        # Fallback loop: if folder still exists and contains files (locked), append a suffix
        counter = 1
        original_path = path
        while os.path.exists(path) and os.path.isdir(path) and os.listdir(path):
            path = f"{original_path}_{counter}"
            if os.path.exists(path):
                shutil.rmtree(path, onerror=remove_readonly)
            counter += 1
            
        os.makedirs(path, exist_ok=True)
        
        try:
            # Clone with depth=1 (shallow clone) to be faster and save disk space/bandwidth
            git.Repo.clone_from(url, path, depth=1)
            return path
        except Exception as e:
            if os.path.exists(path):
                shutil.rmtree(path, onerror=remove_readonly)
            raise ValueError(f"Failed to clone repository: {str(e)}")


    @staticmethod
    def scan_repository(repo_path: str) -> List[Dict[str, Any]]:
        """
        Scans repo_path recursively, filtering out binaries, ignored dirs,
        and returns list of text file contents with metadata.
        """
        ignored_dirs = {
            '.git', 'node_modules', 'build', 'dist', 'out', 'bin', 'obj',
            '__pycache__', '.venv', 'venv', 'env', '.idea', '.vscode',
            'target', 'deps', '.expo', '.next', '.nuxt', 'tmp', 'temp'
        }
        
        ignored_extensions = {
            # Images
            '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.tiff', '.bmp',
            # Binaries/Executables
            '.exe', '.dll', '.so', '.dylib', '.bin', '.out', '.app',
            # Archives
            '.zip', '.tar', '.gz', '.rar', '.7z', '.bz2', '.xz',
            # Audio/Video
            '.mp3', '.mp4', '.wav', '.avi', '.mov', '.mkv', '.webm',
            # Fonts
            '.woff', '.woff2', '.ttf', '.eot', '.otf',
            # Database
            '.db', '.sqlite', '.sqlite3', '.pdb',
            # Compiled Python/Java
            '.pyc', '.pyo', '.class', '.jar',
            # Other large assets
            '.pdf', '.docx', '.xlsx', '.pptx'
        }

        # List of extension mappings to programming language names
        ext_to_lang = {
            '.py': 'python',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.json': 'json',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.toml': 'toml',
            '.xml': 'xml',
            '.md': 'markdown',
            '.sh': 'shell',
            '.bat': 'powershell',
            '.ps1': 'powershell',
            '.go': 'go',
            '.rs': 'rust',
            '.java': 'java',
            '.kt': 'kotlin',
            '.c': 'c',
            '.cpp': 'cpp',
            '.h': 'cpp',
            '.hpp': 'cpp',
            '.cs': 'csharp',
            '.rb': 'ruby',
            '.php': 'php',
            '.swift': 'swift',
            '.dart': 'dart',
            '.sql': 'sql',
            '.dockerfile': 'dockerfile',
            'dockerfile': 'dockerfile'
        }

        files_data = []

        for root, dirs, files in os.walk(repo_path):
            # Prune ignored directories in-place
            dirs[:] = [d for d in dirs if d not in ignored_dirs and not d.startswith('.')]
            
            for file in files:
                if file.startswith('.'):
                    continue
                    
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, repo_path).replace('\\', '/')
                
                # Check extension
                ext = os.path.splitext(file.lower())[1]
                
                # Treat filenames like Dockerfile without ext specially
                lang = ext_to_lang.get(ext)
                if file.lower() == 'dockerfile':
                    lang = 'dockerfile'
                
                # Skip based on extension
                if ext in ignored_extensions:
                    continue
                
                # Skip files that don't have a mapped language and are likely binary
                # Or check if size is too large
                try:
                    file_size = os.path.getsize(file_path)
                    if file_size > 500 * 1024: # 500 KB limit
                        continue
                        
                    # Attempt to read file as text to verify it's not binary
                    with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                        content = f.read()
                        
                    # Final check: check if it looks binary (has null bytes)
                    if '\x00' in content:
                        continue
                        
                    files_data.append({
                        "name": file,
                        "path": rel_path,
                        "content": content,
                        "size": file_size,
                        "language": lang or "text"
                    })
                except Exception:
                    # Skip files we can't read
                    continue

        return files_data
