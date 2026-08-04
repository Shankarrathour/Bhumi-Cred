from typing import List

from app.rag.retriever import RetrievedChunk


def build_rag_context(chunks: List[RetrievedChunk]) -> str:
    """
    Converts retrieved RAG chunks into a clean text context for the LLM.
    Strips out similarity scores so the LLM focuses purely on the content.
    """
    if not chunks:
        return "None"

    context_parts = ["Relevant Agricultural Knowledge\n"]

    for chunk in chunks:
        context_parts.append(
            f"Document:\n{chunk.filename or 'Unknown'}\n\n"
            f"Category:\n{chunk.category or 'Unknown'}\n\n"
        )

        if chunk.page is not None:
            context_parts.append(f"Page:\n{chunk.page}\n\n")

        context_parts.append(
            f"Content:\n{chunk.text}\n"
            "\n------------------------------------------------\n"
        )

    return "\n".join(context_parts)
