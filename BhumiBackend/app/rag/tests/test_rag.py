import unittest
from unittest.mock import MagicMock

from app.rag.config import RAGConfig
from app.rag.interfaces.embedding_model import EmbeddingModel
from app.rag.retriever import RAGRetriever


class DummyEmbeddingModel(EmbeddingModel):
    def embed_text(self, text: str) -> list:
        return [0.1, 0.2, 0.3]

    def embed_batch(self, texts: list) -> list:
        return [[0.1, 0.2, 0.3] for _ in texts]


class TestRAGRetriever(unittest.TestCase):
    def setUp(self):
        self.mock_vector_store = MagicMock()
        self.mock_vector_store.search.return_value = [
            {
                "id": "1",
                "text": "Crop tip 1",
                "score": 0.8,
                "metadata": {"source": "test.txt"},
            },
            {
                "id": "2",
                "text": "Crop tip 2",
                "score": 0.2,
                "metadata": {"source": "test.txt"},
            },
        ]
        self.embedding_model = DummyEmbeddingModel()

        # Override config for testing
        self.original_threshold = RAGConfig.SIMILARITY_THRESHOLD
        RAGConfig.SIMILARITY_THRESHOLD = 0.5

        self.retriever = RAGRetriever(
            vector_store=self.mock_vector_store, embedding_model=self.embedding_model
        )

    def tearDown(self):
        RAGConfig.SIMILARITY_THRESHOLD = self.original_threshold

    def test_retrieve_filters_by_threshold(self):
        results = self.retriever.retrieve(query="How to grow wheat?")

        # Should only return the one with score >= 0.5
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], "1")
        self.mock_vector_store.search.assert_called_once()


if __name__ == "__main__":
    unittest.main()
