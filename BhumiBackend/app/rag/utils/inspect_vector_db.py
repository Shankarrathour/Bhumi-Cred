from collections import Counter

from app.rag.store.chromadb_store import ChromaDBStore


def inspect_db():
    print("=" * 40)
    print("Vector Database Inspection")
    print("=" * 40)

    try:
        store = ChromaDBStore()
    except Exception as e:
        print(f"Failed to connect to ChromaDB: {e}")
        return

    count = store.collection.count()
    print(f"Total Chunks: {count}")

    if count == 0:
        print("Database is empty.")
        return

    # Fetch all metadata (this is only for debugging utility)
    data = store.collection.get(include=["metadatas", "documents"])

    metadatas = data["metadatas"]
    documents = data["documents"]

    # Calculate statistics
    doc_ids = set()
    languages = Counter()
    categories = Counter()

    for meta in metadatas:
        if not meta:
            continue
        doc_ids.add(meta.get("document_id", "unknown"))
        languages[meta.get("language", "unknown")] += 1
        categories[meta.get("category", "unknown")] += 1

    print(f"Total Unique Documents: {len(doc_ids)}")

    print("\n--- Language Distribution ---")
    for lang, cnt in languages.items():
        print(f"  {lang}: {cnt} chunks")

    print("\n--- Category Distribution ---")
    for cat, cnt in categories.items():
        print(f"  {cat}: {cnt} chunks")

    print("\n--- Sample Chunk ---")
    sample_meta = metadatas[0] if metadatas else {}
    sample_doc = documents[0] if documents else ""
    print("Metadata:", sample_meta)
    print("Text snippet:", sample_doc[:200].replace("\n", " ") + "...")
    print("=" * 40)


if __name__ == "__main__":
    inspect_db()
