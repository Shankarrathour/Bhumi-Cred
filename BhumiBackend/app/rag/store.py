import logging
import os

from langchain_core.documents import Document
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

from ..config.llm import LLMConfig

logger = logging.getLogger(__name__)

# Persist in backend/database/qdrant_db
DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "database", "qdrant_db"
)
COLLECTION_NAME = "agricultural_knowledge"


def get_qdrant_store():
    """Initializes and returns the Qdrant vector store with persistent storage."""
    # Ensure database dir exists
    os.makedirs(DB_PATH, exist_ok=True)

    client = QdrantClient(path=DB_PATH)

    # Ensure collection exists
    try:
        client.get_collection(COLLECTION_NAME)
    except Exception:
        # Create collection if it doesn't exist (using size 768 which is typical for embedding-001)
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=768, distance=Distance.COSINE),
        )

    embeddings = LLMConfig.get_embeddings()
    return QdrantVectorStore(
        client=client,
        collection_name=COLLECTION_NAME,
        embedding=embeddings,
    )


def ingest_mock_dataset():
    """Reusable function to ingest the basic agricultural dataset."""
    logger.info("Starting ingestion of mock agricultural dataset...")
    store = get_qdrant_store()

    # Check if data already exists to avoid duplicate insertion
    client = QdrantClient(path=DB_PATH)
    try:
        count = client.count(collection_name=COLLECTION_NAME).count
        if count > 0:
            logger.info(f"Dataset already exists ({count} items). Skipping ingestion.")
            return
    except Exception as e:
        logger.warning(f"Could not check collection count: {e}")

    documents = [
        Document(
            page_content="Wheat requires 4 to 6 irrigations during its lifecycle. The critical stages are Crown Root Initiation (CRI), tillering, jointing, flowering, and dough stage.",
            metadata={"crop": "Wheat", "topic": "Irrigation"},
        ),
        Document(
            page_content="Common diseases in Wheat include Yellow Rust. Symptoms include yellow stripes on leaves. Fungicides like Propiconazole can be used.",
            metadata={"crop": "Wheat", "topic": "Diseases"},
        ),
        Document(
            page_content="Rice cultivation requires flooded conditions. Apply Urea as a top dressing in 2-3 splits. Basal application of NPK is crucial.",
            metadata={"crop": "Rice", "topic": "Fertilizers"},
        ),
        Document(
            page_content="For Soybean, maintain a plant population of 4 lakh plants per hectare. Weed control in the first 45 days is critical.",
            metadata={"crop": "Soybean", "topic": "Best Practices"},
        ),
        Document(
            page_content="Cotton is highly susceptible to Pink Bollworm. Pheromone traps and Neem seed kernel extract (NSKE) 5% are effective organic pest management techniques.",
            metadata={"crop": "Cotton", "topic": "Pest Management"},
        ),
        Document(
            page_content="Maize is a heavy feeder. Nitrogen deficiency shows as yellowing of older leaves in a V-shape. Apply nitrogen in three splits.",
            metadata={"crop": "Maize", "topic": "Soil and Fertilizers"},
        ),
        Document(
            page_content="Sugarcane requires deep ploughing. Red Rot is a devastating disease; use healthy setts and treat them with Carbendazim before planting.",
            metadata={"crop": "Sugarcane", "topic": "Diseases"},
        ),
        Document(
            page_content="Tomato early blight causes dark, concentric rings on lower leaves. Spray Mancozeb 75 WP to manage the disease.",
            metadata={"crop": "Tomato", "topic": "Diseases"},
        ),
        Document(
            page_content="Onion purple blotch can be managed by spraying Difenoconazole or Mancozeb. Avoid water stagnation.",
            metadata={"crop": "Onion", "topic": "Diseases"},
        ),
        Document(
            page_content="Potato late blight is favored by high humidity. Use resistant varieties and preventive fungicide sprays like Metalaxyl.",
            metadata={"crop": "Potato", "topic": "Diseases"},
        ),
        Document(
            page_content="PM-Kisan Scheme (Pradhan Mantri Kisan Samman Nidhi) provides Rs. 6000 per year to eligible farmers in three equal installments.",
            metadata={"topic": "Government Schemes"},
        ),
        Document(
            page_content="Soil Health Card scheme helps farmers understand the nutrient status of their soil and provides fertilizer recommendations.",
            metadata={"topic": "Government Schemes"},
        ),
    ]

    store.add_documents(documents)
    logger.info("Ingestion complete.")


if __name__ == "__main__":
    try:
        ingest_mock_dataset()
    except Exception as e:
        logger.error(f"Failed to ingest mock dataset: {e}")
