import time
from typing import List, Optional

from app.rag.store.chromadb_store import ChromaDBStore

from app.rag.config import RAGConfig
from app.rag.embeddings import get_embedding_model
from app.rag.retrieval_models import RetrievedChunk
from app.rag.utils.logger import get_rag_logger

logger = get_rag_logger("RetrievalService")


class RetrievalService:
    """
    Core service to handle semantic search.
    Provides a simple and clean interface for the rest of the application.
    """

    def __init__(self):
        try:
            self.vector_store = ChromaDBStore()
            self.embedding_model = get_embedding_model()
        except Exception as e:
            logger.error(f"Failed to initialize RetrievalService: {e}")
            raise

    def retrieve(
        self,
        query: str,
        top_k: Optional[int] = None,
        language: Optional[str] = None,
        category: Optional[str] = None,
        file_type: Optional[str] = None,
    ) -> tuple[List[RetrievedChunk], float]:
        """
        Executes a semantic search and returns clean retrieved chunks.

        Args:
            query (str): The search query.
            top_k (int, optional): The number of chunks to retrieve. Defaults to config.
            language (str, optional): Filter by language code.
            category (str, optional): Filter by category.
            file_type (str, optional): Filter by file extension.

        Returns:
            tuple: (List of RetrievedChunk objects, retrieval_time_ms)
        """
        start_time = time.time()
        top_k = top_k or RAGConfig.DEFAULT_TOP_K

        # Build metadata filters
        filters = {}
        if language:
            filters["language"] = language
        if category:
            filters["category"] = category
        if file_type:
            filters["file_type"] = file_type

        # ChromaDB requires exactly 1 key if dict is passed, or $and operator for multiple
        # To keep it simple, if multiple filters exist, we format for ChromaDB
        chroma_filters = None
        if len(filters) == 1:
            chroma_filters = filters
        elif len(filters) > 1:
            chroma_filters = {"$and": [{k: v} for k, v in filters.items()]}

        logger.info(f"Query: '{query}'")
        logger.info(f"Applied Filters: {filters if filters else 'None'}")

        try:
            # Create Query Embedding
            query_embedding = self.embedding_model.embed_text(query)

            # Search ChromaDB
            raw_results = self.vector_store.search(
                query_embedding=query_embedding, top_k=top_k, filters=chroma_filters
            )

            clean_results = []

            # Filter and map results
            for result in raw_results:
                score = result.get("score", 0.0)

                # Apply Similarity Threshold
                if score < RAGConfig.SIMILARITY_THRESHOLD:
                    continue

                meta = result.get("metadata", {})

                chunk = RetrievedChunk(
                    text=result.get("text", ""),
                    score=score,
                    filename=meta.get("filename"),
                    page=meta.get("page"),
                    category=meta.get("category"),
                    language=meta.get("language"),
                    title=meta.get("title"),
                )
                clean_results.append(chunk)

            # Sort by similarity (descending)
            clean_results.sort(key=lambda x: x.score, reverse=True)

            retrieval_time_ms = (time.time() - start_time) * 1000

            avg_score = (
                sum(c.score for c in clean_results) / len(clean_results)
                if clean_results
                else 0.0
            )

            logger.info(f"Retrieved Chunks: {len(clean_results)}")
            logger.info(f"Average Similarity: {avg_score:.4f}")
            logger.info(f"Retrieval Time: {retrieval_time_ms:.2f} ms")

            return clean_results, retrieval_time_ms

        except Exception as e:
            logger.error(f"Error during retrieval: {e}")
            retrieval_time_ms = (time.time() - start_time) * 1000
            return [], retrieval_time_ms


# Create a singleton instance for easy imports
try:
    retrieval_service = RetrievalService()
except Exception:
    # Allow failing gracefully if DB is not ready during app startup
    retrieval_service = None
