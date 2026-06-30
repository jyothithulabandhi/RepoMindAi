import os
import json
import numpy as np
from typing import List, Dict, Any
from backend.vectorstore.base import BaseVectorStore

class FallbackVectorStore(BaseVectorStore):
    def __init__(self, persist_dir: str):
        self.persist_dir = persist_dir
        self.db_file = os.path.join(persist_dir, "fallback_vectors.json")
        self.documents: List[Dict[str, Any]] = []
        self._load_db()

    def _load_db(self):
        """Loads vectors and metadata from the persisted JSON file."""
        if os.path.exists(self.db_file):
            try:
                with open(self.db_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.documents = data.get("documents", [])
            except Exception as e:
                print(f"Warning: Failed to load fallback database: {e}")
                self.documents = []

    def _save_db(self):
        """Saves documents and embeddings to the JSON file."""
        os.makedirs(self.persist_dir, exist_ok=True)
        try:
            with open(self.db_file, "w", encoding="utf-8") as f:
                json.dump({"documents": self.documents}, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error: Failed to save fallback database: {e}")

    def add_documents(self, documents: List[Dict[str, Any]], embeddings: List[List[float]]) -> None:
        """Stores documents along with their pre-computed embeddings."""
        if len(documents) != len(embeddings):
            raise ValueError("Number of documents must match number of embeddings")

        for doc, emb in zip(documents, embeddings):
            self.documents.append({
                "page_content": doc["page_content"],
                "metadata": doc["metadata"],
                "embedding": emb
            })
            
        self._save_db()

    def similarity_search(self, query_embedding: List[float], k: int = 4) -> List[Dict[str, Any]]:
        """Retrieves top k documents using cosine similarity via NumPy."""
        if not self.documents:
            return []

        # Extract embeddings and documents
        emb_list = [doc["embedding"] for doc in self.documents]
        
        # Convert to numpy arrays
        emb_matrix = np.array(emb_list)
        q_vec = np.array(query_embedding)
        
        # Calculate cosine similarity: A . B / (||A|| * ||B||)
        dot_products = np.dot(emb_matrix, q_vec)
        matrix_norms = np.linalg.norm(emb_matrix, axis=1)
        q_norm = np.linalg.norm(q_vec)
        
        # Guard against zero norm
        matrix_norms[matrix_norms == 0] = 1e-9
        if q_norm == 0:
            q_norm = 1e-9
            
        cosine_similarities = dot_products / (matrix_norms * q_norm)
        
        # Get top k indices
        top_indices = np.argsort(cosine_similarities)[::-1][:k]
        
        results = []
        for idx in top_indices:
            doc = self.documents[idx]
            results.append({
                "page_content": doc["page_content"],
                "metadata": doc["metadata"],
                "score": float(cosine_similarities[idx])
            })
            
        return results
