import os

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_ollama import ChatOllama

load_dotenv()


class LLMConfig:
    PRIMARY_MODEL = "gemini-3.5-flash"
    PLANNER_MODEL = "gemini-3.5-flash"
    EMBEDDING_MODEL = "models/text-embedding-004"

    @classmethod
    def get_embeddings(cls):
        from langchain_google_genai import GoogleGenerativeAIEmbeddings

        return GoogleGenerativeAIEmbeddings(model=cls.EMBEDDING_MODEL)

    @classmethod
    def get_primary_llm(cls):
        provider = os.getenv("LLM_PROVIDER", "gemini").lower()
        if provider == "ollama":
            model = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")
            base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
            return ChatOllama(
                model=model, base_url=base_url, temperature=0.2, timeout=25
            )
        return ChatGoogleGenerativeAI(
            model=cls.PRIMARY_MODEL, temperature=0.2, timeout=25, max_retries=0
        )

    @classmethod
    def get_planner_llm(cls):
        provider = os.getenv("LLM_PROVIDER", "gemini").lower()
        if provider == "ollama":
            model = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")
            base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
            return ChatOllama(
                model=model, base_url=base_url, temperature=0.0, timeout=10
            )
        return ChatGoogleGenerativeAI(
            model=cls.PLANNER_MODEL, temperature=0.0, timeout=10, max_retries=0
        )
