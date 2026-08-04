from abc import ABC, abstractmethod
from typing import List


class EmbeddingModel(ABC):
    """
    Abstract Base Class for Embedding Models.
    Ensures that any embedding provider (e.g., Gemini, Sentence Transformers)
    can be swapped without affecting the rest of the RAG system.
    """

    @abstractmethod
    def embed_text(self, text: str) -> List[float]:
        """
        Embed a single piece of text.

        Args:
            text (str): The text to embed.

        Returns:
            List[float]: The resulting embedding vector.
        """
        pass

    @abstractmethod
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Embed a batch of texts.

        Args:
            texts (List[str]): The texts to embed.

        Returns:
            List[List[float]]: A list of embedding vectors.
        """
        pass
