import os
from typing import Any, Dict, List

from app.rag.utils.logger import get_rag_logger

logger = get_rag_logger("DocumentLoader")


class DocumentLoader:
    """
    Factory for loading documents of various formats (PDF, DOCX, TXT, MD).
    """

    @staticmethod
    def load_document(file_path: str) -> List[Dict[str, Any]]:
        """
        Reads the content of a file based on its extension.

        Args:
            file_path (str): The absolute or relative path to the file.

        Returns:
            List[Dict[str, Any]]: Extract content blocks, typically one per page.
                                  Format: [{"text": "...", "page": 1}]
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        ext = os.path.splitext(file_path)[1].lower()

        try:
            if ext == ".pdf":
                return DocumentLoader._load_pdf(file_path)
            elif ext == ".docx":
                return DocumentLoader._load_docx(file_path)
            elif ext in [".txt", ".md"]:
                return DocumentLoader._load_text(file_path)
            else:
                logger.warning(
                    f"Unsupported file format '{ext}' for file {file_path}. Returning empty list."
                )
                return []
        except Exception as e:
            logger.error(f"Error loading {file_path}: {e}")
            raise

    @staticmethod
    def _load_pdf(file_path: str) -> List[Dict[str, Any]]:
        import fitz  # PyMuPDF

        pages = []
        with fitz.open(file_path) as doc:
            for i, page in enumerate(doc):
                pages.append({"text": page.get_text(), "page": i + 1})
        return pages

    @staticmethod
    def _load_docx(file_path: str) -> List[Dict[str, Any]]:
        import docx

        doc = docx.Document(file_path)
        text = "\n".join([para.text for para in doc.paragraphs])
        return [{"text": text, "page": 1}]

    @staticmethod
    def _load_text(file_path: str) -> List[Dict[str, Any]]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
        return [{"text": text, "page": 1}]
