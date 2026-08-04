from typing import Annotated, Optional, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field


class FarmerProfile(TypedDict, total=False):
    farmer_name: Optional[str]
    village: Optional[str]
    district: Optional[str]
    state: Optional[str]
    farm_size: Optional[str]
    soil_type: Optional[str]
    primary_crops: Optional[list[str]]
    crop_details: Optional[str]
    farming_experience: Optional[str]
    preferred_language: Optional[str]


class PlannerOutput(BaseModel):
    intent: str = Field(description="The detected intent of the user's message (e.g., 'greeting', 'crop_query', 'weather', 'market', 'scheme', 'acknowledgment', 'off_topic', 'unknown').")
    confidence: float = Field(
        description="Confidence score between 0.0 and 1.0 for the detected intent. Below 0.5 means the intent is too ambiguous."
    )
    language: str = Field(
        description="The semantic language of the user's message (e.g., 'English', 'Hindi', 'Marathi', 'Kannada'). Do NOT use ISO codes."
    )
    writing_style: str = Field(
        description="The writing style used: 'Native Script', 'Romanized', or 'Mixed'."
    )
    needs_clarification: bool = Field(
        description="True if the user's intent is ambiguous and needs clarification before answering."
    )
    domain_relevant: bool = Field(
        description="True if the query is related to agriculture, farming, weather, market prices, or government schemes. False for off-topic questions like sports, politics, programming, etc."
    )
    response_style: str = Field(
        description="The required response style: 'simple' for greetings/acknowledgments, 'step_by_step' for detailed farming queries, 'concise' for factual lookups."
    )
    need_rag: bool = Field(
        description="True if the user's query requires agricultural knowledge retrieval, False for casual chat, greetings, weather, or market queries."
    )


class AgentState(TypedDict):
    """
    Full pipeline state — carries data through all LangGraph nodes.
    """

    messages: Annotated[list[BaseMessage], add_messages]
    profile: Optional[FarmerProfile]
    detected_language: str
    plan: Optional[PlannerOutput]
    final_context_string: str
    rag_context: str
