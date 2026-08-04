import os

from dotenv import load_dotenv

load_dotenv()


class RAGConfig:
    # Chunking
    CHUNK_SIZE = int(os.getenv("RAG_CHUNK_SIZE", "1000"))
    CHUNK_OVERLAP = int(os.getenv("RAG_CHUNK_OVERLAP", "200"))

    # Embeddings
    # Valid options: "gemini", "sentence_transformers"
    EMBEDDING_PROVIDER = os.getenv(
        "RAG_EMBEDDING_PROVIDER", "sentence_transformers"
    ).lower()

    # Sentence Transformers config
    ST_MODEL_NAME = os.getenv("RAG_ST_MODEL_NAME", "BAAI/bge-m3")

    # Storage
    VECTOR_DB_PATH = os.getenv(
        "RAG_VECTOR_DB_PATH", os.path.join(os.getcwd(), "data", "vector_db")
    )
    COLLECTION_NAME = os.getenv("RAG_COLLECTION_NAME", "bhumi_knowledge_v2")

    # Knowledge source
    KNOWLEDGE_DIR = os.getenv(
        "RAG_KNOWLEDGE_DIR", os.path.join(os.getcwd(), "knowledge")
    )

    # Retrieval
    DEFAULT_TOP_K = int(os.getenv("RAG_DEFAULT_TOP_K", "5"))
    SIMILARITY_THRESHOLD = float(os.getenv("RAG_SIMILARITY_THRESHOLD", "0.3"))
