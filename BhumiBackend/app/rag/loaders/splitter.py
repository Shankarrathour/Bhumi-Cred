from typing import List

from app.rag.config import RAGConfig
from app.rag.utils.logger import get_rag_logger

logger = get_rag_logger("TextSplitter")


class TextSplitter:
    """
    Handles chunking of large texts into smaller segments for embedding.
    """

    def __init__(self, chunk_size: int = None, chunk_overlap: int = None):
        self.chunk_size = chunk_size or RAGConfig.CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or RAGConfig.CHUNK_OVERLAP

        try:
            from langchain_text_splitters import RecursiveCharacterTextSplitter

            self.splitter = RecursiveCharacterTextSplitter(
                chunk_size=self.chunk_size,
                chunk_overlap=self.chunk_overlap,
                separators=["\n\n", "\n", ".", " ", ""],
            )
            logger.info(
                f"Initialized RecursiveCharacterTextSplitter with size={self.chunk_size}, overlap={self.chunk_overlap}"
            )
        except ImportError:
            logger.error(
                "langchain-text-splitters is not installed. Run `pip install langchain-text-splitters`."
            )
            raise

    def split_text(self, text: str) -> List[str]:
        """
        Splits a single document text into chunks.
        """
        if not text.strip():
            return []
        return self.splitter.split_text(text)
