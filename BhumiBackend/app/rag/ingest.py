import hashlib
import os
from datetime import datetime
from typing import Any, Dict

from app.rag.store.chromadb_store import ChromaDBStore

from app.rag.config import RAGConfig
from app.rag.embeddings import get_embedding_model
from app.rag.loaders.document_loader import DocumentLoader
from app.rag.loaders.splitter import TextSplitter
from app.rag.utils.logger import get_rag_logger

logger = get_rag_logger("IngestPipeline")


def generate_chunk_id(text: str, metadata: Dict[str, Any]) -> str:
    """
    Generates a SHA-256 hash for a specific chunk based on its content and source file.
    This guarantees we can track uniqueness for true incremental ingestion.
    """
    content = f"{metadata.get('source', '')}_{metadata.get('chunk', 0)}_{text}"
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def ingest_documents():
    """
    Scans the knowledge directory, loads documents, splits them,
    generates embeddings, and stores them in ChromaDB.
    Supports incremental ingestion by skipping already processed chunks.
    """
    logger.info(
        f"Starting ingestion pipeline. Knowledge directory: {RAGConfig.KNOWLEDGE_DIR}"
    )

    if not os.path.exists(RAGConfig.KNOWLEDGE_DIR):
        logger.error(f"Knowledge directory does not exist: {RAGConfig.KNOWLEDGE_DIR}")
        return

    # Initialize components
    try:
        embedding_model = get_embedding_model()
        vector_store = ChromaDBStore()
        splitter = TextSplitter()
    except Exception as e:
        logger.error(f"Failed to initialize components: {e}")
        return

    existing_ids = vector_store.get_existing_ids()
    logger.info(f"Found {len(existing_ids)} existing chunks in the vector store.")

    files_to_process = []
    for root, _, files in os.walk(RAGConfig.KNOWLEDGE_DIR):
        for file in files:
            files_to_process.append(os.path.join(root, file))

    if not files_to_process:
        logger.info("No files found to process.")
        return

    all_ids = []
    all_texts = []
    all_embeddings = []
    all_metadatas = []

    for file_path in files_to_process:
        try:
            # 1. Load document
            pages_data = DocumentLoader.load_document(file_path)
            if not pages_data:
                continue

            filename = os.path.basename(file_path)
            file_type = os.path.splitext(filename)[1].lower().replace(".", "")

            # Combine all text for global metadata detection
            full_text = "\n".join([p["text"] for p in pages_data])

            # Use helpers for automatic detection
            from app.rag.utils.metadata_helpers import (
                detect_category,
                detect_language,
                extract_title,
            )

            detected_language = detect_language(full_text)
            detected_category = detect_category(filename, full_text)
            detected_title = extract_title(filename, full_text)

            file_chunk_count = 0

            # Process each page
            for page_dict in pages_data:
                page_text = page_dict["text"]
                page_num = page_dict["page"]

                # 2. Split page into chunks
                chunks = splitter.split_text(page_text)

                # 3. Process each chunk
                for chunk in chunks:
                    # Extract basic rich metadata
                    metadata = {
                        "document_id": hashlib.md5(file_path.encode()).hexdigest(),
                        "filename": filename,
                        "file_type": file_type,
                        "source": file_path,
                        "page": page_num,
                        "chunk": file_chunk_count,
                        "language": detected_language,
                        "category": detected_category,
                        "title": detected_title,
                        "date_ingested": datetime.now().isoformat(),
                    }

                    chunk_id = generate_chunk_id(chunk, metadata)
                    file_chunk_count += 1

                    # Incremental logic
                    if chunk_id in existing_ids:
                        continue

                    all_ids.append(chunk_id)
                    all_texts.append(chunk)
                    all_metadatas.append(metadata)

            # Structured Logging per file
            logger.info(f"\n--- Processed {filename} ---")
            logger.info(f"Language: {detected_language}")
            logger.info(f"Category: {detected_category}")
            logger.info(f"Pages: {len(pages_data)}")
            logger.info(f"Chunks: {file_chunk_count}")

        except Exception as e:
            logger.error(f"Error processing file {file_path}: {e}")

    # 4. Batch Embed and Store
    if all_texts:
        logger.info(f"Generating embeddings for {len(all_texts)} new chunks...")
        try:
            # Note: For massive datasets, you might want to batch this further
            # to avoid memory issues (e.g., in groups of 100).
            # For Phase 2 MVP, we'll embed them together.
            all_embeddings = embedding_model.embed_batch(all_texts)

            logger.info("Storing into ChromaDB...")
            vector_store.add_documents(
                ids=all_ids,
                texts=all_texts,
                embeddings=all_embeddings,
                metadatas=all_metadatas,
            )
            logger.info("Ingestion complete!")
        except Exception as e:
            logger.error(f"Failed during embedding or storage: {e}")
    else:
        logger.info("No new chunks to ingest. Database is up to date.")


if __name__ == "__main__":
    ingest_documents()
