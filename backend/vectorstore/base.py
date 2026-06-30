from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseVectorStore(ABC):
    @abstractmethod
    def add_documents(self, documents: List[Dict[str, Any]], embeddings: List[List[float]]) -> None:
        """
        Embeds and stores the given documents.
        documents is a list of dicts with keys: 'page_content', 'metadata'.
        embeddings is a list of floats (pre-computed embeddings for these documents).
        """
        pass

    @abstractmethod
    def similarity_search(self, query_embedding: List[float], k: int = 4) -> List[Dict[str, Any]]:
        """
        Retrieves the top k most similar documents for the query embedding.
        Returns a list of documents: {'page_content': str, 'metadata': dict, 'score': float}.
        """
        pass
