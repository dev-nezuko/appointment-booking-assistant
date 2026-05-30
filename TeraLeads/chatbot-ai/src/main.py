"""
Main entry point for the AI Chatbot Microservice

This module sets up the FastAPI application with routes for chat interactions
and health checks. It integrates LangChain for conversational AI and manages
appointment scheduling flows.

Security considerations:
- CORS is configured (should be restricted in production)
- Input validation via Pydantic models
- Error handling prevents information leakage
- Logging excludes sensitive user data
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from dotenv import load_dotenv
import os
import json
from typing import Dict, Any

from conversation.state_manager import ConversationStateManager
from conversation.memory import ConversationMemory
from flows.appointment_flow import AppointmentFlow
from llm.provider import LLMProvider
from storage.appointment_store import AppointmentStore
from storage.log_store import LogStore
from services.backend_client import BackendClient
from utils.logger import setup_logger

# Load environment variables
load_dotenv()

# Initialize FastAPI app with metadata
app = FastAPI(
    title="AI Chatbot Microservice",
    description="AI-powered chatbot for appointment scheduling using LangChain",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
# WARNING: In production, replace "*" with specific allowed origins
cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if "*" not in cors_origins else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Initialize components
logger = setup_logger()
try:
    llm_provider = LLMProvider()
    conversation_memory = ConversationMemory()
    state_manager = ConversationStateManager(conversation_memory=conversation_memory)
    appointment_store = AppointmentStore()
    log_store = LogStore()
    backend_client = BackendClient()
    appointment_flow = AppointmentFlow(
        llm_provider=llm_provider,
        state_manager=state_manager,
        appointment_store=appointment_store,
        log_store=log_store,
        backend_client=backend_client,
    )
except Exception as e:
    logger.error("Failed to initialize components: %s", str(e))
    raise


class ChatRequest(BaseModel):
    """Request model for chat messages"""
    
    session_id: str = Field(..., description="Unique session identifier", min_length=1)
    message: str = Field(..., description="User's message", min_length=1, max_length=1000)
    user_id: int = Field(..., description="User ID", gt=0)

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        """Validate and sanitize message input"""
        if not v or not v.strip():
            raise ValueError("Message cannot be empty")
        return v.strip()

    @field_validator("session_id")
    @classmethod
    def validate_session_id(cls, v: str) -> str:
        """Validate session ID format"""
        if not v or not v.strip():
            raise ValueError("Session ID cannot be empty")
        return v.strip()


class ChatResponse(BaseModel):
    """Response model for chat interactions"""
    
    response: str = Field(..., description="AI assistant's response")
    session_id: str = Field(..., description="Session identifier")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata about the conversation state"
    )


@app.get("/health")
async def health_check():
    """
    Health check endpoint
    
    Returns the service health status. Used by monitoring systems
    to verify service availability.
    
    Returns:
        dict: Status object with service information
    """
    return {
        "status": "ok",
        "service": "ai-chatbot-microservice",
        "version": "1.0.0"
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Process chat messages and return AI responses
    
    Handles user messages, maintains conversation state, and processes
    appointment scheduling flows. All interactions are logged for
    analytics and debugging.
    
    Args:
        request: ChatRequest containing session_id, message, and user_id
        
    Returns:
        ChatResponse with AI response, session ID, and metadata
        
    Raises:
        HTTPException: If message processing fails
        
    Example:
        ```python
        request = ChatRequest(
            session_id="session-123",
            message="I need to book an appointment",
            user_id=1
        )
        response = await chat(request)
        ```
    """
    try:
        # Validate inputs (handled by Pydantic)
        logger.info(json.dumps({
            "action": "chat_request",
            "session_id": request.session_id,
            "user_id": request.user_id,
            "message_length": len(request.message),
        }))

        # Get or create conversation state
        state = state_manager.get_state(request.session_id)
        
        # Process message through appointment flow
        response, metadata = await appointment_flow.process_message(
            request.session_id,
            request.message,
            state,
            user_id=request.user_id,
        )
        
        # Update conversation state
        state_manager.update_state(request.session_id, state)
        
        # Log successful interaction (without sensitive data)
        logger.info(json.dumps({
            "action": "chat_response",
            "session_id": request.session_id,
            "user_id": request.user_id,
            "response_length": len(response),
            "metadata_status": metadata.get("status"),
        }))
        
        return ChatResponse(
            response=response,
            session_id=request.session_id,
            metadata=metadata
        )
        
    except ValueError as e:
        # Input validation errors - 400 Bad Request
        # Input validation errors
        logger.warning(json.dumps({
            "action": "chat_validation_error",
            "session_id": request.session_id,
            "error": str(e),
        }))
        raise HTTPException(status_code=400, detail=str(e))
        
    except RuntimeError as e:
        # LLM/service errors
        logger.error(json.dumps({
            "action": "chat_error",
            "session_id": request.session_id,
            "user_id": request.user_id,
            "error": str(e),
            "error_type": "RuntimeError",
        }))
        raise HTTPException(status_code=503, detail=str(e))

    except Exception as e:
        # Unexpected errors
        logger.error(json.dumps({
            "action": "chat_error",
            "session_id": request.session_id,
            "user_id": request.user_id,
            "error": str(e),
            "error_type": type(e).__name__,
        }))
        # Don't expose internal error details in production
        error_message = "An error occurred while processing your message. Please try again."
        if os.getenv("ENVIRONMENT") == "development":
            error_message = str(e)
        raise HTTPException(status_code=500, detail=error_message)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for unhandled errors
    
    Catches all unhandled exceptions and returns a generic error response
    to prevent information leakage.
    """
    logger.error(json.dumps({
        "action": "unhandled_exception",
        "path": request.url.path,
        "error": str(exc),
        "error_type": type(exc).__name__,
    }))
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred"
        }
    )


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))

    uvicorn.run(
        app,
        host=host,
        port=port,
        reload=os.getenv("ENVIRONMENT") == "development",
    )

