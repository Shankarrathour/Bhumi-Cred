from app.rag.config import RAGConfig
from app.rag.interfaces.embedding_model import EmbeddingModel


def get_embedding_model() -> EmbeddingModel:
    """
    Factory function to get the configured embedding model via Dependency Injection.
    """
    if RAGConfig.EMBEDDING_PROVIDER == "gemini":
        from .gemini_model import GeminiModel

        return GeminiModel()
    else:
        from .sentence_transformers_model import SentenceTransformersModel

        return SentenceTransformersModel()
