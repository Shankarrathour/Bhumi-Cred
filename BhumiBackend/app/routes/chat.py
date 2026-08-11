from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import uuid
from langchain_core.messages import HumanMessage
from app.graph.graph import app as graph_app

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    thread_id: Optional[str] = None

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    thread_id = request.thread_id or str(uuid.uuid4())
    
    config = {"configurable": {"thread_id": thread_id}}
    
    state = {
        "messages": [HumanMessage(content=request.message)],
        "profile": {} # We can mock a guest profile for now, or fetch from auth context
    }
    
    try:
        res = graph_app.invoke(state, config=config)
        messages = res.get("messages", [])
        
        if len(messages) > 0:
            reply_text = messages[-1].content
        else:
            reply_text = "Sorry, I received an empty response."
            
    except Exception as e:
        reply_text = f"Error processing your request: {str(e)}"

    return {
        "response": reply_text,
        "thread_id": thread_id
    }
