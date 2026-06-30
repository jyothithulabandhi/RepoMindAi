import os
import json
from typing import List, Dict, Any, Tuple
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.embeddings import Embeddings
from backend.vectorstore.base import BaseVectorStore

class LocalONNXEmbeddings(Embeddings):
    """Local embedding model using ChromaDB's ONNX miniLM model."""
    def __init__(self):
        from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2
        self.ef = ONNXMiniLM_L6_V2()

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        # The ONNX MiniLM function expects a list of texts and returns a list of embeddings
        return self.ef(texts)

    def embed_query(self, text: str) -> List[float]:
        # Return a single embedding (first item)
        return self.ef([text])[0]

class RAGEngine:
    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.groq_key = os.getenv("GROQ_API_KEY")
        
        # Filter out dummy/placeholder values
        dummy_gemini = "AQ." + "Ab8RN6KoOo3CbB6ztVlYMqk_PtEi_AszfWUzD3ObYW1PUDMcug"
        dummy_openai = "sk-proj-" + "0BRSPztzjQOUZvRCFvjL9yJnLWjfRhZiZosW-hNTD7-49KqJcdIsA2RwfKOykkzR77XZIcmU_FT3BlbkFJSeM3DoTD8o5S9xJt4yGGtHM0ux6i9y_ZOMYfR4eekMkQEDeAfq_vjoY8e9VmSxM5YrNAd-PPkA"
        
        if self.gemini_key == dummy_gemini or (self.gemini_key and self.gemini_key.startswith("your_")):
            self.gemini_key = None
        if self.openai_key == dummy_openai or (self.openai_key and self.openai_key.startswith("your_")):
            self.openai_key = None
        if self.groq_key and (self.groq_key.startswith("your_") or self.groq_key == "gsk_your_key_here"):
            self.groq_key = None
            
        if not self.gemini_key and not self.openai_key and not self.groq_key:
            print("Warning: Neither GEMINI_API_KEY, OPENAI_API_KEY, nor GROQ_API_KEY configured in environment variables.")

    def _get_embeddings_model(self):
        """Initializes the appropriate embedding model based on API keys."""
        if self.openai_key:
            from langchain_openai import OpenAIEmbeddings
            emb_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
            return OpenAIEmbeddings(
                model=emb_model,
                api_key=self.openai_key
            )
        elif self.gemini_key:
            from langchain_google_genai import GoogleGenAIEmbeddings
            emb_model = os.getenv("GEMINI_EMBEDDING_MODEL", "models/text-embedding-004")
            return GoogleGenAIEmbeddings(
                model=emb_model,
                google_api_key=self.gemini_key
            )
        else:
            print("Using local ONNX embeddings (all-MiniLM-L6-v2) for vector store operations.")
            return LocalONNXEmbeddings()

    def _get_llm(self, temperature: float = 0.2):
        """Initializes the appropriate LLM based on API keys."""
        if self.groq_key:
            from langchain_openai import ChatOpenAI
            model_name = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
            return ChatOpenAI(
                openai_api_base="https://api.groq.com/openai/v1",
                openai_api_key=self.groq_key,
                model_name=model_name,
                temperature=temperature
            )
        elif self.gemini_key:
            from langchain_google_genai import ChatGoogleGenerativeAI
            model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
            return ChatGoogleGenerativeAI(
                model=model_name,
                google_api_key=self.gemini_key,
                temperature=temperature
            )
        elif self.openai_key:
            from langchain_openai import ChatOpenAI
            model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
            return ChatOpenAI(
                model=model_name,
                api_key=self.openai_key,
                temperature=temperature
            )
        else:
            raise ValueError("Configuration Error: Either GROQ_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY must be set.")


    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Generates embeddings for a list of text strings."""
        model = self._get_embeddings_model()
        return model.embed_documents(texts)

    def embed_query(self, text: str) -> List[float]:
        """Generates embedding for a single query string."""
        model = self._get_embeddings_model()
        return model.embed_query(text)

    def generate_summary(self, repo_name: str, tech_stack: Dict[str, Any], file_tree_str: str, key_files: Dict[str, str]) -> Dict[str, Any]:
        """
        Generates summary components for the repository:
        - Project Overview & Purpose
        - Folder Structure Explanation
        - Key Modules
        """
        llm = self._get_llm(temperature=0.2)
        
        # Bind JSON mode if supported by the LangChain integration
        if hasattr(llm, "bind"):
            try:
                # ChatOpenAI (used for OpenAI and Groq) supports response_format
                if "ChatOpenAI" in llm.__class__.__name__:
                    llm = llm.bind(response_format={"type": "json_object"})
                # ChatGoogleGenerativeAI supports response_mime_type
                elif "ChatGoogleGenerativeAI" in llm.__class__.__name__:
                    llm = llm.bind(response_mime_type="application/json")
            except Exception as e:
                print(f"Warning: Failed to bind JSON mode on LLM: {e}")
        
        # Prepare context of key files (like package.json, requirements.txt, readme if small, main.py, etc.)
        files_context = ""
        for filepath, content in key_files.items():
            files_context += f"\n--- File: {filepath} ---\n{content[:3000]}\n" # Limit to first 3000 chars per file to avoid bloat
            
        sys_prompt = (
            "You are an expert software architect. Analyze the provided repository information "
            "and generate an exceptionally detailed, clear, and comprehensive project summary.\n\n"
            "Your output must be a valid JSON object containing exactly three keys:\n"
            "1. \"overview\": A comprehensive markdown string explaining what the project does, its core value proposition, the main problems it solves, and the high-level business/technical goals.\n"
            "2. \"folders\": A thorough markdown explanation of the repository's folder structure, the design patterns evident in the directory layout, and why the files are organized this way.\n"
            "3. \"key_modules\": A detailed markdown breakdown of the primary source files and modules, detailing their exact responsibilities, how they interact, and their role in the overall architecture.\n\n"
            "CRITICAL:\n"
            "- Be highly technical, descriptive, and exhaustive. Do not write generic or brief descriptions.\n"
            "- You must respond ONLY with a valid JSON object matching the requested schema. All values must be valid JSON strings enclosed in double quotes. All newlines inside the markdown content must be escaped as \\n, and double quotes escaped as \\\". Do not write raw unescaped newlines or raw unquoted text as values."
        )
        
        user_prompt = f"""
        Repository Name: {repo_name}
        Detected Tech Stack: {json.dumps(tech_stack, indent=2)}
        
        Directory Structure:
        {file_tree_str}
        
        Key Configuration/Source Files:
        {files_context}
        
        Please produce a comprehensive analysis. Provide your response as a valid JSON object matching the requested schema. Do not wrap in markdown code blocks like ```json ... ```, just return the raw JSON object.
        """
        
        messages = [
            SystemMessage(content=sys_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        response = llm.invoke(messages)
        res_text = response.content.strip()
        
        # Clean response if LLM wraps in markdown
        if res_text.startswith("```"):
            lines = res_text.splitlines()
            if lines[0].startswith("```json") or lines[0].startswith("```"):
                res_text = "\n".join(lines[1:-1]).strip()
                
        try:
            return json.loads(res_text)
        except Exception as e:
            print(f"Standard JSON parsing failed: {e}. Trying robust regex-based JSON parser...")
            try:
                import re
                parsed_data = {}
                keys = ["overview", "folders", "key_modules"]
                positions = []
                
                # Use sequential search with boundary checks to find the correct keys
                current_pos = 0
                for k in keys:
                    # Match "key" preceded by start of string, newline, comma, or brace
                    match = re.search(rf'(?:^|[\n,{{])\s*"{k}"\s*:\s*', res_text[current_pos:])
                    if not match:
                        match = re.search(rf"(?:^|[\n,{{])\s*'{k}'\s*:\s*", res_text[current_pos:])
                    
                    if match:
                        actual_start = current_pos + match.start()
                        actual_end = current_pos + match.end()
                        positions.append((k, actual_start, actual_end))
                        current_pos = actual_end
                
                positions.sort(key=lambda x: x[1])
                
                for i, (k, start, end) in enumerate(positions):
                    next_start = len(res_text)
                    if i + 1 < len(positions):
                        next_start = positions[i+1][1]
                    
                    content = res_text[end:next_start].strip()
                    
                    if content.endswith("}"):
                        content = content[:-1].strip()
                    if content.endswith(","):
                        content = content[:-1].strip()
                    if content.endswith("}"):
                        content = content[:-1].strip()
                        
                    if content.startswith('"') and content.endswith('"') and len(content) >= 2:
                        content = content[1:-1]
                    elif content.startswith("'") and content.endswith("'") and len(content) >= 2:
                        content = content[1:-1]
                        
                    content = content.replace('\\"', '"').replace('\\n', '\n')
                    parsed_data[k] = content.strip()
                
                if all(k in parsed_data and parsed_data[k] for k in keys):
                    print("Robust parser successfully extracted all summary fields!")
                    return parsed_data
            except Exception as re_err:
                print(f"Robust regex parsing failed: {re_err}")
                
            print(f"Error parsing summary JSON. Raw response: {res_text}")
            return {
                "overview": f"### Overview\nA software repository named {repo_name} focusing on {', '.join(tech_stack.get('frameworks', []))}.\n\n(Standard parsing failed, showing fallback overview)",
                "folders": f"### Folder Structure\nRefer to the file explorer on the dashboard to view the layout.\n\nDetected framework components: {', '.join(tech_stack.get('frameworks', []))}.",
                "key_modules": "### Key Modules\nRefer to individual source files in the file explorer."
            }

    def generate_readme(self, repo_name: str, summary_data: Dict[str, Any], tech_stack: Dict[str, Any]) -> str:
        """Generates a professional README.md for the repository."""
        llm = self._get_llm(temperature=0.3)
        
        sys_prompt = (
            "You are an expert technical writer. Generate a comprehensive, highly professional, "
            "and beautiful README.md for the project based on the analyzed summary and tech stack.\n\n"
            "Make sure the README looks premium, complete, and contains the following sections:\n"
            "1. Title & Badges: Appropriate modern badges for language, build status, license, and technologies.\n"
            "2. Project Overview: A detailed, clear explanation of the project's purpose and architecture.\n"
            "3. Features: A bulleted list detailing all key features of the application.\n"
            "4. Technologies Used: Detailed listing with descriptions of tools, libraries, and frameworks.\n"
            "5. Folder Structure: A visual directory tree structure with descriptions of what resides in each key path.\n"
            "6. Installation: Comprehensive step-by-step setup instructions tailored to the detected tech stack (e.g. including npm commands for Node projects, pip/virtualenv for Python, etc.).\n"
            "7. Usage: Clear instructions and command snippets for running, testing, or deploying the application.\n"
            "8. Contributing & License: Standard open source templates.\n\n"
            "CRITICAL: Avoid thin descriptions, placeholders, or TODOs. Write complete and fully readable instructions."
        )
        
        user_prompt = f"""
        Project Name: {repo_name}
        
        Project Overview:
        {summary_data.get('overview', '')}
        
        Folder Structure Analysis:
        {summary_data.get('folders', '')}
        
        Key Modules:
        {summary_data.get('key_modules', '')}
        
        Detected Tech Stack:
        {json.dumps(tech_stack, indent=2)}
        
        Please generate the full contents of README.md. Use clean Markdown styling.
        """
        
        messages = [
            SystemMessage(content=sys_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        response = llm.invoke(messages)
        return response.content.strip()

    def answer_question(self, question: str, repo_name: str, tech_stack: Dict[str, Any], summary_data: Dict[str, Any], vector_store: BaseVectorStore) -> Tuple[str, List[str]]:
        """
        Retrieves relevant codebase chunks, runs the RAG chain,
        and returns the answer along with a list of cited file paths.
        """
        # 1. Embed query
        query_emb = self.embed_query(question)
        
        # 2. Retrieve top chunks (retrieve 6 chunks for good context coverage)
        results = vector_store.similarity_search(query_emb, k=6)
        
        # 3. Format context chunks
        context_str = ""
        sources = []
        
        for idx, res in enumerate(results):
            source = res["metadata"].get("source", "unknown")
            if source not in sources:
                sources.append(source)
            context_str += f"\n--- Context Chunk {idx+1} [File: {source}] ---\n{res['page_content']}\n"

        # 4. Construct prompt and run LLM
        llm = self._get_llm(temperature=0.2)
        
        sys_prompt = (
            "You are RepoMind AI, an expert AI assistant that answers questions about a software repository. "
            "Answer the user's question accurately using the provided code context chunks. "
            "Follow these rules:\n"
            "1. Base your answer on the retrieved codebase chunks. "
            "If the answer cannot be determined from the chunks, state that clearly but try to offer general guidance.\n"
            "2. Cite relevant files in your response using markdown links. E.g. [src/main.py] or similar. "
            "Only cite files that are actually present in the context chunks.\n"
            "3. Format code blocks with proper syntax highlighting.\n"
            "4. Keep your answer clear, detailed, and direct. Do not write generic introductory sentences."
        )
        
        user_prompt = f"""
        Repository Name: {repo_name}
        Detected Tech Stack: {', '.join(tech_stack.get('frameworks', []))}
        
        Project Overview:
        {summary_data.get('overview', '')[:1000]}
        
        Retrieved Code Context Chunks:
        {context_str}
        
        Question: {question}
        
        Please provide your answer.
        """
        
        messages = [
            SystemMessage(content=sys_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        response = llm.invoke(messages)
        answer = response.content.strip()
        
        return answer, sources

    def explain_code(self, code: str, filename: str) -> str:
        """Generates a structured explanation for the selected code block."""
        llm = self._get_llm(temperature=0.2)
        
        sys_prompt = (
            "You are RepoMind AI, an expert software architect. Provide a clear, structured explanation "
            "of the selected code block from the file. Your explanation must contain the following sections:\n\n"
            "What it does:\n"
            "(Summarize the high-level purpose of the code)\n\n"
            "Parameters/Inputs:\n"
            "(List and describe any inputs/arguments/parameters, if applicable)\n\n"
            "Returns:\n"
            "(Describe what the code outputs or returns, if applicable)\n\n"
            "Edge cases or potential issues:\n"
            "(Identify bugs, performance bottlenecks, or tricky conditions)\n\n"
            "Be direct, concise, and technical. Avoid generic introduction or conclusion sentences."
        )
        
        user_prompt = f"""
        Filename: {filename}
        
        Code Block:
        ```
        {code}
        ```
        
        Please provide the structured explanation.
        """
        
        messages = [
            SystemMessage(content=sys_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        response = llm.invoke(messages)
        return response.content.strip()

