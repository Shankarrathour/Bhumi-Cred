from typing import Optional

from pydantic import BaseModel


class RetrievedChunk(BaseModel):
    """
    Clean, decoupled object for a retrieved chunk of knowledge.
    """

    text: str
    score: float
    filename: Optional[str] = None
    page: Optional[int] = None
    category: Optional[str] = None
    language: Optional[str] = None
    title: Optional[str] = None
