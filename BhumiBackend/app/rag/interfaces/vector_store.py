from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class VectorStore(ABC):
    """
    Abstract Base Class for Vector Stores.
    Ensures that any vector database (e.g., ChromaDB, Pinecone, FAISS)
    can be swapped without affecting the rest of the RAG system.
    """

    @abstractmethod
    def add_documents(
        self,
        ids: List[str],
        texts: List[str],
        embeddings: List[List[float]],
        metadatas: List[Dict[str, Any]],
    ) -> None:
        """
        Add documents and their embeddings to the vector store.
        """
        pass

    @abstractmethod
    def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Perform a similarity search using the query embedding.

        Args:
            query_embedding: The vector embedding of the query.
            top_k: Number of results to return.
            filters: Optional metadata filters.

        Returns:
            List of dictionaries containing 'id', 'text', 'metadata', 'score'.
        """
        pass

    @abstractmethod
    def get_existing_ids(self) -> set:
        """
        Retrieve a set of existing document IDs (or chunk hashes) to support incremental ingestion.
        """
        pass
