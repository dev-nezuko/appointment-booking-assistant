"""
A deterministic chat model that runs with no API key.

The service could not start without OPENAI_API_KEY: LLMProvider raised in its
constructor, and the constructor runs at import. That put the parts of this
system that are actually interesting — the slot-filling conversation, the
availability check, the double-booking guard, the backend hand-off — behind a
billing relationship, and made the test suite unrunnable for anyone cloning it.

This is a real LangChain chat model, not a stub returning a fixed string. It
implements the two things `appointment_flow` asks of a model:

1. `invoke`/`ainvoke` for conversational replies, and
2. `with_structured_output(AppointmentExtraction)` for pulling a date, a time
   and a service type out of what the user typed.

It does the second with explicit patterns rather than inference. Where a model
would guess, this abstains and leaves the field empty, which makes the flow ask
for it — the correct behaviour for a booking assistant that must not invent an
appointment time.

What this proves: the conversation state machine, slot filling, availability,
persistence and the backend call all work end to end. What it does not prove:
how the system handles phrasing nobody anticipated. That is what the real model
is for, and it is why this sits behind the same interface rather than replacing
anything.
"""

from __future__ import annotations

import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Type

from langchain_core.callbacks import CallbackManagerForLLMRun
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from langchain_core.runnables import Runnable, RunnableLambda

# ---------------------------------------------------------------- extraction

WEEKDAYS = {
    "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
    "friday": 4, "saturday": 5, "sunday": 6,
}

MONTHS = {
    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
    "july": 7, "august": 8, "september": 9, "october": 10, "november": 11,
    "december": 12,
}

SERVICE_WORDS = {
    "consultation": "Consultation",
    "consult": "Consultation",
    "follow-up": "Follow-up",
    "follow up": "Follow-up",
    "followup": "Follow-up",
    "check-up": "Check-up",
    "check up": "Check-up",
    "checkup": "Check-up",
    "cleaning": "Cleaning",
    "whitening": "Whitening",
}

INTENT_WORDS = [
    ("cancel", "cancel"),
    ("reschedule", "reschedule"),
    ("move my", "reschedule"),
    ("confirm", "confirm"),
    ("yes", "confirm"),
    ("book", "book_appointment"),
    ("schedule", "book_appointment"),
    ("appointment", "book_appointment"),
]


def extract_date(text: str, today: Optional[datetime] = None) -> Optional[str]:
    """Find a date. Returns YYYY-MM-DD, or None when nothing is stated."""
    today = (today or datetime.now()).date()
    lowered = text.lower()

    iso = re.search(r"\b(\d{4})-(\d{2})-(\d{2})\b", text)
    if iso:
        return iso.group(0)

    if re.search(r"\btoday\b", lowered):
        return today.strftime("%Y-%m-%d")
    if re.search(r"\btomorrow\b", lowered):
        return (today + timedelta(days=1)).strftime("%Y-%m-%d")

    # "next friday" / "on friday"
    for name, index in WEEKDAYS.items():
        if re.search(rf"\b{name}\b", lowered):
            ahead = (index - today.weekday()) % 7
            if "next" in lowered:
                # "next Friday" is the Friday of the following week. Said on a
                # Friday it means seven days out, not fourteen.
                ahead = ahead + 7 if ahead else 7
            elif ahead == 0:
                # "Friday" said on a Friday means the next one, not today.
                ahead = 7
            return (today + timedelta(days=ahead)).strftime("%Y-%m-%d")

    # "March 14" / "14 March"
    for name, number in MONTHS.items():
        pattern = rf"\b{name}\s+(\d{{1,2}})\b|\b(\d{{1,2}})\s+{name}\b"
        match = re.search(pattern, lowered)
        if match:
            day = int(match.group(1) or match.group(2))
            year = today.year
            candidate = datetime(year, number, day).date()
            if candidate < today:  # a month already past means next year
                candidate = datetime(year + 1, number, day).date()
            return candidate.strftime("%Y-%m-%d")

    return None


def extract_time(text: str) -> Optional[str]:
    """Find a time. Returns HH:MM in 24-hour form, or None."""
    lowered = text.lower()

    # 2pm, 2 pm, 2:30pm
    match = re.search(r"\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b", lowered)
    if match:
        hour = int(match.group(1))
        minute = int(match.group(2) or 0)
        meridiem = match.group(3)
        if meridiem == "pm" and hour != 12:
            hour += 12
        if meridiem == "am" and hour == 12:
            hour = 0
        if 0 <= hour <= 23 and 0 <= minute <= 59:
            return f"{hour:02d}:{minute:02d}"

    # 14:30 — but not a date fragment like 2025-03-14
    match = re.search(r"(?<!\d)(\d{1,2}):(\d{2})(?!\d)", text)
    if match:
        hour, minute = int(match.group(1)), int(match.group(2))
        if 0 <= hour <= 23 and 0 <= minute <= 59:
            return f"{hour:02d}:{minute:02d}"

    # "at 3" / "at 11 o'clock" — assume business hours
    match = re.search(r"\bat\s+(\d{1,2})\b(?!\s*(?:am|pm|:))", lowered)
    if match:
        hour = int(match.group(1))
        if 1 <= hour <= 7:  # 1–7 means afternoon in a booking context
            hour += 12
        if 8 <= hour <= 19:
            return f"{hour:02d}:00"

    return None


def extract_service(text: str) -> Optional[str]:
    lowered = text.lower()
    for word, canonical in SERVICE_WORDS.items():
        if word in lowered:
            return canonical
    return None


def extract_intent(text: str) -> Optional[str]:
    lowered = text.lower()
    for word, intent in INTENT_WORDS:
        if re.search(rf"\b{re.escape(word)}\b", lowered):
            return intent
    return "general"


# ----------------------------------------------------------------- responses


def _last_human(messages: List[BaseMessage]) -> str:
    for message in reversed(messages):
        if isinstance(message, HumanMessage):
            return str(message.content)
    return str(messages[-1].content) if messages else ""


def compose_reply(text: str, today: Optional[datetime] = None) -> str:
    """
    A booking reply built from what the message actually contains.

    The point is that it asks for exactly the fields that are missing. A canned
    response would not exercise the slot-filling logic this system is built
    around, so it would demonstrate nothing.
    """
    date = extract_date(text, today)
    time = extract_time(text)
    service = extract_service(text)
    intent = extract_intent(text)
    lowered = text.lower()

    if re.search(r"\b(hi|hello|hey|good (morning|afternoon|evening))\b", lowered):
        return (
            "Hello. I can help you book an appointment. "
            "What service do you need, and when would suit you?"
        )

    if intent == "cancel":
        return (
            "I can cancel that for you. Which appointment do you mean — "
            "what date and time was it booked for?"
        )

    if intent == "reschedule":
        return "Happy to move it. What new date and time would you like?"

    known = []
    if service:
        known.append(f"a {service}")
    if date:
        known.append(f"on {date}")
    if time:
        known.append(f"at {time}")

    missing = []
    if not service:
        missing.append("the service you need")
    if not date:
        missing.append("a date")
    if not time:
        missing.append("a time")

    if not missing:
        return (
            f"That works — {' '.join(known)}. "
            "Shall I confirm this appointment?"
        )

    prefix = f"I have {' '.join(known)}. " if known else ""
    if len(missing) == 1:
        return f"{prefix}Could you tell me {missing[0]}?"
    joined = ", ".join(missing[:-1]) + f" and {missing[-1]}"
    return f"{prefix}Could you tell me {joined}?"


# -------------------------------------------------------------- the model


class LocalChatModel(BaseChatModel):
    """A LangChain chat model backed by rules instead of a network call."""

    model_name: str = "local-rules-v1"

    @property
    def _llm_type(self) -> str:
        return "local-rules"

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> ChatResult:
        reply = compose_reply(_last_human(messages))
        return ChatResult(
            generations=[ChatGeneration(message=AIMessage(content=reply))]
        )

    def with_structured_output(
        self, schema: Type[Any], **kwargs: Any
    ) -> Runnable:
        """
        Return a runnable that fills `schema` from the message text.

        `appointment_flow` relies on this to pull the appointment fields out of
        a turn. Supporting it here is what lets the flow run unmodified against
        either backend.
        """

        def _extract(model_input: Any) -> Any:
            text = _as_text(model_input)
            return schema(
                date=extract_date(text),
                time=extract_time(text),
                service_type=extract_service(text),
                intent=extract_intent(text),
            )

        return RunnableLambda(_extract)


def _as_text(model_input: Any) -> str:
    """Flatten whatever LangChain hands a model into plain text."""
    if isinstance(model_input, str):
        return model_input
    if isinstance(model_input, BaseMessage):
        return str(model_input.content)
    if isinstance(model_input, list):
        humans = [m for m in model_input if isinstance(m, HumanMessage)]
        chosen = humans[-1] if humans else (model_input[-1] if model_input else None)
        return str(chosen.content) if chosen is not None else ""
    # ChatPromptValue and friends
    for attr in ("to_messages", "to_string"):
        if hasattr(model_input, attr):
            value = getattr(model_input, attr)()
            return _as_text(value) if isinstance(value, list) else str(value)
    if isinstance(model_input, dict):
        for key in ("input", "text", "question"):
            if key in model_input:
                return str(model_input[key])
    return str(model_input)
