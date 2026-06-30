import os
from typing import List, Dict, Any
import chromadb
from backend.vectorstore.base import BaseVectorStore

class ChromaVectorStore(BaseVectorStore):
    def __init__(self, persist_dir: str):
        self.persist_dir = persist_dir
        # Create Chroma DB persistent client
        self.client = chromadb.PersistentClient(path=persist_dir)
        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name="repo_chunks",
            metadata={"hnsw:space": "cosine"} # Use cosine similarity
        )

    def add_documents(self, documents: List[Dict[str, Any]], embeddings: List[List[float]]) -> None:
        """Adds documents and precomputed embeddings to the Chroma collection."""
        if not documents:
            return
            
        if len(documents) != len(embeddings):
            raise ValueError("Number of documents must match number of embeddings")
            
        ids = []
        doc_texts = []
        metadatas = []
        
        for idx, doc in enumerate(documents):
            # Generate a unique ID based on source path and chunk index
            source = doc["metadata"].get("source", "unknown")
            chunk_idx = doc["metadata"].get("chunk_index", idx)
            # Clean string for ID safety
            safe_source = source.replace("/", "_").replace(".", "_").replace("\\", "_")
            doc_id = f"{safe_source}_chunk_{chunk_idx}"
            
            ids.append(doc_id)
            doc_texts.append(doc["page_content"])
            metadatas.append(doc["metadata"])
            
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=doc_texts,
            metadatas=metadatas
        )

    def similarity_search(self, query_embedding: List[float], k: int = 4) -> List[Dict[str, Any]]:
        """Queries the Chroma collection and returns top k results."""
        if self.collection.count() == 0:
            return []
            
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=k
        )
        
        formatted_results = []
        
        # Chroma results are nested lists
        if results and "documents" in results and results["documents"]:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if "metadatas" in results else [{}] * len(docs)
            distances = results["distances"][0] if "distances" in results else [0.0] * len(docs)
            
            for doc_text, meta, dist in zip(docs, metas, distances):
                # Cosine distance is returned; similarity is 1 - distance
                similarity = 1.0 - float(dist)
                formatted_results.append({
                    "page_content": doc_text,
                    "metadata": meta,
                    "score": similarity
                })
                
        return formatted_results
