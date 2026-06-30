from backend.vectorstore.base import BaseVectorStore
from backend.vectorstore.fallback_store import FallbackVectorStore

def get_vector_store(persist_dir: str) -> BaseVectorStore:
    """
    Factory function to initialize a vector store.
    Tries to use ChromaVectorStore, but falls back to FallbackVectorStore
    if chromadb is not installed or fails to initialize.
    """
    try:
        from backend.vectorstore.chroma import ChromaVectorStore
        print(f"Attempting to initialize ChromaDB at {persist_dir}...")
        store = ChromaVectorStore(persist_dir)
        print("ChromaDB initialized successfully.")
        return store
    except (ImportError, Exception) as e:
        print(f"Warning: ChromaDB initialization failed/not installed ({e}).")
        print(f"Falling back to FallbackVectorStore (NumPy/JSON) at {persist_dir}...")
        return FallbackVectorStore(persist_dir)
