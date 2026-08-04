import logging
import sys


def get_rag_logger(name: str) -> logging.Logger:
    """
    Returns a configured logger for the RAG module.
    """
    logger = logging.getLogger(f"RAG.{name}")

    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)

        # Structured logging format
        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger
