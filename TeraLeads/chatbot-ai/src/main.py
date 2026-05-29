"""
FastAPI entry point for the booking assistant.

One turn in, one reply out: POST /chat runs the message through the
appointment flow and returns the reply plus the booking state in `metadata`.
Request bodies are validated by Pydantic, and logs record sizes and ids rather
than message text.
"""

import json
import os
from typing import Any, Dict

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

from conversation.memory import ConversationMemory
from conversation.state_manager import ConversationStateManager
from flows.appointment_flow import AppointmentFlow
from llm.provider import LLMProvider
from storage.appointment_store import AppointmentStore
from storage.log_store import LogStore
from utils.logger import setup_logger

load_dotenv()

app = FastAPI(
    title="AI Chatbot Microservice",
    description="AI-powered chatbot for appointment scheduling using LangChain",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Only the backend calls this service, so in Compose this is the frontend
# origin at most; "*" is the local-development default.
cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in cors_origins else cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

logger = setup_logger()
llm_provider = LLMProvider()
state_manager = ConversationStateManager(conversation_memory=ConversationMemory())
appointment_flow = AppointmentFlow(
    llm_provider=llm_provider,
    state_manager=state_manager,
    appointment_store=AppointmentStore(),
    log_store=LogStore(),
)
logger.info(json.dumps({"action": "startup", "llm_provider": llm_provider.provider}))


class ChatRequest(BaseModel):
    session_id: str = Field(..., description="Unique session identifier", min_length=1)
    message: str = Field(..., description="User's message", min_length=1, max_length=1000)
    user_id: int = Field(..., description="User ID", gt=0)

    @field_validator("message", "session_id")
    @classmethod
    def strip_and_require(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be blank")
        return value.strip()


class ChatResponse(BaseModel):
    response: str = Field(..., description="AI assistant's response")
    session_id: str = Field(..., description="Session identifier")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Booking state: status, missing_fields, appointment_data, alternatives",
    )


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "ai-chatbot-microservice",
        "version": "1.0.0",
        "llm_provider": llm_provider.provider,
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    logger.info(json.dumps({
        "action": "chat_request",
        "session_id": request.session_id,
        "user_id": request.user_id,
        "message_length": len(request.message),
    }))

    state = state_manager.get_state(request.session_id)
    response, metadata = await appointment_flow.process_message(
        request.session_id,
        request.message,
        state,
        user_id=request.user_id,
    )
    state_manager.update_state(request.session_id, state)

    logger.info(json.dumps({
        "action": "chat_response",
        "session_id": request.session_id,
        "user_id": request.user_id,
        "response_length": len(response),
        "metadata_status": metadata.get("status"),
    }))
    return ChatResponse(response=response, session_id=request.session_id, metadata=metadata)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Log the failure and answer with a generic 500 so internals never leak."""
    logger.error(json.dumps({
        "action": "unhandled_exception",
        "path": request.url.path,
        "error": str(exc),
        "error_type": type(exc).__name__,
    }))
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "message": "An unexpected error occurred"},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
    )
