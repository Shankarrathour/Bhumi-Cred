import chromadb
from app.rag.config import RAGConfig

class ChromaDBStore:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=RAGConfig.VECTOR_DB_PATH)
        self.collection = self.client.get_or_create_collection(name=RAGConfig.COLLECTION_NAME)

    def search(self, query_embedding, top_k, filters=None):
        kwargs = {
            "query_embeddings": [query_embedding],
            "n_results": top_k,
            "include": ["metadatas", "documents", "distances"]
        }
        if filters:
            kwargs["where"] = filters

        results = self.collection.query(**kwargs)
        
        raw_results = []
        if results and results.get("ids") and len(results["ids"]) > 0:
            for i in range(len(results["ids"][0])):
                distance = results["distances"][0][i]
                # Convert distance to a similarity score (assuming cosine or L2, just invert it safely)
                # ChromaDB L2 distance: smaller is better. Similarity = 1 / (1 + distance)
                score = 1.0 / (1.0 + distance)
                raw_results.append({
                    "score": score,
                    "text": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i]
                })
        return raw_results

    def get_existing_ids(self):
        result = self.collection.get(include=[])
        return result.get("ids", [])

    def add_documents(self, ids, texts, embeddings, metadatas):
        self.collection.add(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas
        )
