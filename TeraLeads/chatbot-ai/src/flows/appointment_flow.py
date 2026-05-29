"""
Appointment scheduling flow using LangChain with LLM-powered extraction
"""
import logging
import re
from datetime import datetime, timedelta
from typing import Dict, Any, List, Tuple, Optional
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate

from llm.provider import LLMProvider
from llm.chain import ConversationChainWrapper
from conversation.memory import ConversationMemory
from utils.availability import check_availability, get_available_slots
from storage.appointment_store import AppointmentStore
from storage.log_store import LogStore
from services.backend_client import BackendClient

logger = logging.getLogger("chatbot_ai")


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

    def _normalize_date(self, date_str: str) -> Optional[str]:
        """Normalize a date to YYYY-MM-DD, or None when it cannot be read."""
        if not date_str:
            return None
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
        # An unreadable date ("next-ish week") is treated as missing so the
        # assistant asks again, rather than failing the availability check and
        # telling the user the slot is taken.
        return None

    def _normalize_time(self, time_str: str) -> Optional[str]:
        """Normalize a time to HH:MM:SS, or None when it cannot be read."""
        if not time_str:
            return None
        time_str = time_str.strip()
        match = re.search(r"(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(am|pm)?", time_str, re.I)
        if not match:
            return None
        hour = int(match.group(1))
        minute = int(match.group(2) or 0)
        period = (match.group(3) or "").lower()
        if period == "pm" and hour != 12:
            hour += 12
        elif period == "am" and hour == 12:
            hour = 0
        if hour > 23 or minute > 59:
            return None
        return f"{hour:02d}:{minute:02d}:00"

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
        """Run one user turn through slot filling, availability and booking."""
        self._remember(session_id, state, "user", message)

        extraction = await self._safe_extract(message, state, session_id)
        updates = self._fields_from(extraction)
        details = state["appointment_data"]
        changed = any(details.get(key) != value for key, value in updates.items())
        details.update(updates)

        confirming = extraction.intent == "confirm" or _is_affirmative(message)
        missing_fields = [f for f in self.required_fields if not details.get(f)]

        # Only book when the user is agreeing to the exact summary we read back
        # to them. "Yes, but make it 3pm" changes the details, so it gets a new
        # summary instead of a booking for a time nobody confirmed.
        agreed = confirming and state.get("awaiting_confirmation") and not changed
        if agreed and not missing_fields:
            response, metadata = await self._book(session_id, state, user_id)
        elif missing_fields:
            state["awaiting_confirmation"] = False
            response = await self._generate_response_with_llm(message, state, session_id)
            metadata = {"status": "collecting_info", "missing_fields": missing_fields}
        elif await check_availability(details["date"], details["time"], self.appointment_store):
            state["awaiting_confirmation"] = True
            response = self._generate_confirmation_message(state)
            metadata = {"status": "ready_to_book", "appointment_data": dict(details)}
        else:
            response, metadata = self._slot_unavailable(state)

        self._remember(session_id, state, "assistant", response)
        if user_id:
            self.log_store.log_conversation(session_id, user_id, message, response, metadata)
        return response, metadata

    async def _safe_extract(
        self, message: str, state: Dict[str, Any], session_id: str
    ) -> AppointmentExtraction:
        """
        Structured extraction, degrading to "nothing understood" on bad output.

        A hosted model occasionally returns output that does not fit the schema
        (LangChain raises OutputParserException, a ValueError). Treating that as
        an empty turn makes the assistant ask again instead of failing the chat.
        """
        try:
            return await self._extract_with_llm(message, state, session_id)
        except ValueError as exc:
            logger.warning("extraction failed for session %s: %s", session_id, exc)
            return AppointmentExtraction()

    def _fields_from(self, extraction: AppointmentExtraction) -> Dict[str, str]:
        fields: Dict[str, str] = {}
        date = self._normalize_date(extraction.date or "")
        time = self._normalize_time(extraction.time or "")
        if date:
            fields["date"] = date
        if time:
            fields["time"] = time
        if extraction.service_type and extraction.service_type.strip():
            fields["service_type"] = extraction.service_type.strip()
        return fields

    def _remember(self, session_id: str, state: Dict[str, Any], role: str, content: str) -> None:
        state["messages"].append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
        })
        memory = self.state_manager.conversation_memory
        if memory:
            if role == "user":
                memory.add_user_message(session_id, content)
            else:
                memory.add_ai_message(session_id, content)

    async def _book(
        self,
        session_id: str,
        state: Dict[str, Any],
        user_id: Optional[int],
    ) -> Tuple[str, Dict[str, Any]]:
        """Book the confirmed slot, re-checking it first."""
        details = state["appointment_data"]
        # The slot was free when we read the summary back, but another session
        # may have taken it while the user was deciding.
        if not await check_availability(details["date"], details["time"], self.appointment_store):
            return self._slot_unavailable(state)

        appointment = dict(details)
        if user_id:
            appointment["user_id"] = user_id
        appointment["session_id"] = session_id
        appointment_id = self.appointment_store.save(appointment)
        await self.backend_client.sync_appointment(appointment)

        # Start the next request from a clean slate, so a second "yes" cannot
        # book the same slot again.
        state["appointment_data"] = {}
        state["awaiting_confirmation"] = False

        response = (
            "Your appointment has been confirmed! "
            f"Date: {appointment['date']}, Time: {appointment['time']}, "
            f"Service: {appointment['service_type']}. "
            f"Confirmation ID: {appointment_id}."
        )
        metadata = {
            "status": "booked",
            "appointment_id": appointment_id,
            "appointment_data": appointment,
        }
        return response, metadata

    def _slot_unavailable(self, state: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
        """Drop the rejected time and offer real open slots on the same day."""
        details = state["appointment_data"]
        date = details.get("date")
        details.pop("time", None)
        state["awaiting_confirmation"] = False

        alternatives = self._open_slots(date) if date else []
        if alternatives:
            listed = ", ".join(slot[:5] for slot in alternatives)
            response = (
                f"I'm sorry, that time is not available. On {date} I can offer {listed}. "
                "Which would you like, or would you prefer another day?"
            )
        else:
            response = (
                "I'm sorry, that time is not available, and I have nothing open that day. "
                "Could you suggest another date? Appointments run from 09:00 to 17:00."
            )
        metadata = {
            "status": "unavailable",
            "missing_fields": ["time"],
            "alternatives": alternatives,
        }
        return response, metadata

    def _open_slots(self, date: str, limit: int = 4) -> List[str]:
        try:
            if datetime.strptime(date, "%Y-%m-%d").date() < datetime.now().date():
                return []
        except ValueError:
            return []
        free = [
            slot for slot in get_available_slots()
            if self.appointment_store.is_slot_available(date, slot)
        ]
        return free[:limit]

    def _generate_confirmation_message(self, state: Dict[str, Any]) -> str:
        apt = state["appointment_data"]
        return (
            f"Great! I have you scheduled for {apt.get('date')} "
            f"at {apt.get('time')} for a {apt.get('service_type', 'appointment')}. "
            "Is this correct?"
        )


_AFFIRMATIVE = {
    "yes", "yeah", "yep", "correct", "sounds good", "that's right",
    "confirm", "book it", "please", "yes please", "ok", "okay",
}


def _is_affirmative(message: str) -> bool:
    return message.lower().strip().rstrip(".!") in _AFFIRMATIVE
