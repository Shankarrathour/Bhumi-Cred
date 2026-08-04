from typing import List

from app.rag.config import RAGConfig
from app.rag.interfaces.embedding_model import EmbeddingModel
from app.rag.utils.logger import get_rag_logger

logger = get_rag_logger("SentenceTransformers")


class SentenceTransformersModel(EmbeddingModel):
    def __init__(self):
        try:
            from sentence_transformers import SentenceTransformer

            self.model = SentenceTransformer(RAGConfig.ST_MODEL_NAME)
            logger.info(f"Loaded SentenceTransformers model: {RAGConfig.ST_MODEL_NAME}")
        except ImportError:
            logger.error(
                "sentence-transformers is not installed. Run `pip install sentence-transformers`."
            )
            raise

    def embed_text(self, text: str) -> List[float]:
        return self.model.encode(text).tolist()

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        embeddings = self.model.encode(texts)
        return embeddings.tolist()
