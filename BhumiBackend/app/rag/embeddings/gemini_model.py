import os
from typing import List

from app.rag.interfaces.embedding_model import EmbeddingModel
from app.rag.utils.logger import get_rag_logger

logger = get_rag_logger("GeminiEmbeddings")


class GeminiModel(EmbeddingModel):
    def __init__(self):
        try:
            from google import genai

            api_key = os.getenv("GOOGLE_API_KEY")
            if not api_key:
                raise ValueError("GOOGLE_API_KEY is missing from environment.")
            self.client = genai.Client(api_key=api_key)
            self.model_name = "text-embedding-004"
            logger.info("Loaded Gemini embedding model (text-embedding-004)")
        except ImportError:
            logger.error(
                "google-genai is not installed. Run `pip install google-genai`."
            )
            raise

    def embed_text(self, text: str) -> List[float]:
        response = self.client.models.embed_content(
            model=self.model_name, contents=text
        )
        return response.embeddings[0].values

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        response = self.client.models.embed_content(
            model=self.model_name, contents=texts
        )
        return [emb.values for emb in response.embeddings]
