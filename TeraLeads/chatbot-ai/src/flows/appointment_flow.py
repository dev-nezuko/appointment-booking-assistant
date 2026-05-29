"""
Appointment scheduling flow using LangChain with LLM-powered extraction
"""
import re
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple, Optional
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate

from llm.provider import LLMProvider
from llm.chain import ConversationChainWrapper
from conversation.memory import ConversationMemory
from utils.availability import check_availability
from storage.appointment_store import AppointmentStore
from storage.log_store import LogStore
from services.backend_client import BackendClient


class AppointmentExtraction(BaseModel):
    """Structured output for appointment data extraction."""

    date: Optional[str] = Field(
        default=None,
        description="Appointment date in YYYY-MM-DD format. Use today's date for 'today', tomorrow for 'tomorrow'.",
    )
    time: Optional[str] = Field(
        default=None,
        description="Appointment time in HH:MM or HH:MM:SS format. Use 24-hour format.",
    )
    service_type: Optional[str] = Field(
        default=None,
        description="Type of service: Consultation, Follow-up, Check-up, or other.",
    )
    intent: Optional[str] = Field(
        default=None,
        description="User intent: book_appointment, confirm, cancel, reschedule, or general.",
    )


class AppointmentFlow:
    """
    Handles the appointment scheduling conversation flow.
    Uses LLM for structured data extraction and natural language responses.
    """

    def __init__(
        self,
        llm_provider: LLMProvider,
        state_manager,
        appointment_store: Optional[AppointmentStore] = None,
        log_store: Optional[LogStore] = None,
        backend_client: Optional[BackendClient] = None,
    ):
        self.llm_provider = llm_provider
        self.state_manager = state_manager
        self.appointment_store = appointment_store or AppointmentStore()
        self.log_store = log_store or LogStore()
        self.backend_client = backend_client or BackendClient()
        self.required_fields = ["date", "time", "service_type"]
        self.conversation_memory = ConversationMemory()

    def _get_extraction_model(self):
        """Get LLM with structured output for extraction."""
        return self.llm_provider.get_model().with_structured_output(AppointmentExtraction)

    def _normalize_date(self, date_str: str) -> str:
        """Normalize date string to YYYY-MM-DD."""
        if not date_str:
            return ""
        date_str = date_str.strip()
        # Handle relative dates
        today = datetime.now().date()
        if date_str.lower() in ("today", "tod"):
            return today.strftime("%Y-%m-%d")
        if date_str.lower() in ("tomorrow", "tom"):
            return (today + timedelta(days=1)).strftime("%Y-%m-%d")
        # Parse YYYY-MM-DD
        try:
            parsed = datetime.strptime(date_str, "%Y-%m-%d")
            return parsed.strftime("%Y-%m-%d")
        except ValueError:
            pass
        # Try other formats
        for fmt in ("%m/%d/%Y", "%d/%m/%Y", "%B %d, %Y", "%b %d, %Y"):
            try:
                parsed = datetime.strptime(date_str, fmt)
                return parsed.strftime("%Y-%m-%d")
            except ValueError:
                continue
        return date_str

    def _normalize_time(self, time_str: str) -> str:
        """Normalize time string to HH:MM:SS."""
        if not time_str:
            return ""
        time_str = time_str.strip()
        # Already HH:MM:SS
        if re.match(r"^\d{1,2}:\d{2}:\d{2}$", time_str):
            return time_str
        # HH:MM
        match = re.search(r"(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)?", time_str)
        if match:
            hour = int(match.group(1))
            minute = int(match.group(2) or 0)
            period = (match.group(3) or "").lower()
            if period == "pm" and hour != 12:
                hour += 12
            elif period == "am" and hour == 12:
                hour = 0
            return f"{hour:02d}:{minute:02d}:00"
        return time_str

    async def _extract_with_llm(
        self, message: str, state: Dict[str, Any], session_id: str
    ) -> AppointmentExtraction:
        """Extract appointment data using LLM."""
        extraction_model = self._get_extraction_model()
        context = {
            "appointment_data": state.get("appointment_data", {}),
            "recent_messages": "\n".join(
                [m.get("content", "") for m in state.get("messages", [])[-4:]]
            ),
        }
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You extract appointment booking information from user messages.
            Current appointment data: {appointment_data}
            Recent conversation: {recent_messages}
            Return only the extracted fields. Use null for missing values.
            For dates: use YYYY-MM-DD. For times: use HH:MM or HH:MM:SS format.
            For intent: book_appointment, confirm, cancel, reschedule, or general."""),
            ("human", "{message}"),
        ])
        chain = prompt | extraction_model
        result = await chain.ainvoke({
            "message": message,
            "appointment_data": str(context["appointment_data"]),
            "recent_messages": context["recent_messages"],
        })
        return result if isinstance(result, AppointmentExtraction) else AppointmentExtraction()

    async def _generate_response_with_llm(
        self, message: str, state: Dict[str, Any], session_id: str
    ) -> str:
        """Generate natural language response using LLM with conversation context."""
        memory = self.state_manager.get_memory_for_session(session_id)
        chain = ConversationChainWrapper(
            self.llm_provider.get_model(),
            memory=memory,
        )
        context = state.get("appointment_data", {})
        context_str = "\n".join([f"{k}: {v}" for k, v in context.items()])
        prompt = f"""Context: {context_str or 'None yet'}

User: {message}

Respond in a friendly, professional way. If booking an appointment, ask for any missing info (date, time, type)."""
        return await chain.apredict(prompt)

    async def process_message(
        self,
        session_id: str,
        message: str,
        state: Dict[str, Any],
        user_id: Optional[int] = None,
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Process a user message and return response with metadata.
        """
        # Add user message to state (and sync to memory)
        state["messages"].append({
            "role": "user",
            "content": message,
            "timestamp": datetime.now().isoformat(),
        })
        if self.state_manager.conversation_memory:
            self.state_manager.conversation_memory.add_user_message(session_id, message)

        # Extract appointment information using LLM
        try:
            extraction = await self._extract_with_llm(message, state, session_id)
            appointment_data = {}
            if extraction.date:
                appointment_data["date"] = self._normalize_date(extraction.date)
            if extraction.time:
                appointment_data["time"] = self._normalize_time(extraction.time)
            if extraction.service_type:
                appointment_data["service_type"] = extraction.service_type.strip()

            # Handle confirmation intent (yes, correct, etc.)
            message_lower = message.lower().strip()
            is_affirmative = message_lower in (
                "yes", "yeah", "yep", "correct", "sounds good",
                "that's right", "confirm", "book it", "please"
            )
            existing = state.get("appointment_data", {})
            has_all_data = all(existing.get(f) for f in self.required_fields)
            if (extraction.intent == "confirm" or is_affirmative) and has_all_data:
                return await self._handle_confirmation(
                    session_id, state, user_id
                )
        except (RuntimeError, ValueError, Exception) as e:
            # Log and fall back to empty extraction on LLM/structure errors
            appointment_data = {}

        state["appointment_data"].update(appointment_data)

        # Check if we have all required information
        missing_fields = [
            f for f in self.required_fields
            if not state["appointment_data"].get(f)
        ]

        if missing_fields:
            response = await self._generate_response_with_llm(
                message, state, session_id
            )
            metadata = {"status": "collecting_info", "missing_fields": missing_fields}
        else:
            date = state["appointment_data"]["date"]
            time = state["appointment_data"]["time"]
            is_available = await check_availability(
                date, time, self.appointment_store
            )

            if is_available:
                response = self._generate_confirmation_message(state)
                metadata = {
                    "status": "ready_to_book",
                    "appointment_data": state["appointment_data"],
                }
            else:
                response = await self._generate_alternative_times_message(
                    state, session_id
                )
                metadata = {"status": "unavailable", "suggest_alternatives": True}

        # Add bot response to state
        state["messages"].append({
            "role": "assistant",
            "content": response,
            "timestamp": datetime.now().isoformat(),
        })
        if self.state_manager.conversation_memory:
            self.state_manager.conversation_memory.add_ai_message(
                session_id, response
            )

        # Log to conversation store
        if user_id:
            self.log_store.log_conversation(
                session_id, user_id, message, response, metadata
            )

        return response, metadata

    async def _handle_confirmation(
        self,
        session_id: str,
        state: Dict[str, Any],
        user_id: Optional[int],
    ) -> Tuple[str, Dict[str, Any]]:
        """Handle user confirmation and book appointment."""
        appointment = state["appointment_data"].copy()
        if user_id:
            appointment["user_id"] = user_id
        appointment["session_id"] = session_id

        appointment_id = self.appointment_store.save(appointment)

        # Try to sync to backend
        synced = await self.backend_client.sync_appointment(appointment)
        if not synced:
            # Store locally anyway - backend may sync later
            pass

        response = (
            f"Your appointment has been confirmed! "
            f"Date: {appointment.get('date')}, Time: {appointment.get('time')}, "
            f"Service: {appointment.get('service_type', 'appointment')}. "
            f"Confirmation ID: {appointment_id}. "
        )
        state["messages"].append({
            "role": "assistant",
            "content": response,
            "timestamp": datetime.now().isoformat(),
        })
        if self.state_manager.conversation_memory:
            self.state_manager.conversation_memory.add_ai_message(
                session_id, response
            )

        metadata = {
            "status": "booked",
            "appointment_id": appointment_id,
            "appointment_data": appointment,
        }
        if user_id:
            self.log_store.log_conversation(
                session_id, user_id,
                "confirmed",
                response,
                metadata,
            )
        return response, metadata

    def _generate_confirmation_message(self, state: Dict[str, Any]) -> str:
        """Generate appointment confirmation message."""
        apt = state["appointment_data"]
        return (
            f"Great! I have you scheduled for {apt.get('date')} "
            f"at {apt.get('time')} for a {apt.get('service_type', 'appointment')}. "
            f"Is this correct?"
        )

    async def _generate_alternative_times_message(
        self, state: Dict[str, Any], session_id: str
    ) -> str:
        """Generate message suggesting alternative times."""
        return (
            "I'm sorry, that time slot is not available. "
            "Would you like to try a different date or time? "
            "I can check availability for you."
        )
