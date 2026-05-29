"""
Whole conversations against the keyless local model.

These run the real flow, the real extraction rules and a real JSON store in a
temporary directory, so they pin what a user actually sees turn by turn.
"""
from datetime import datetime, timedelta
from unittest.mock import AsyncMock

import pytest

from conversation.memory import ConversationMemory
from conversation.state_manager import ConversationStateManager
from flows.appointment_flow import AppointmentFlow
from llm.provider import LLMProvider
from storage.appointment_store import AppointmentStore
from storage.log_store import LogStore

TOMORROW = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")


@pytest.fixture
def flow(tmp_path, monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "local")
    states = ConversationStateManager(conversation_memory=ConversationMemory())
    backend = AsyncMock()
    backend.sync_appointment.return_value = False
    return AppointmentFlow(
        llm_provider=LLMProvider(),
        state_manager=states,
        appointment_store=AppointmentStore(data_dir=str(tmp_path)),
        log_store=LogStore(data_dir=str(tmp_path)),
        backend_client=backend,
    )


async def say(flow, session, text):
    state = flow.state_manager.get_state(session)
    return await flow.process_message(session, text, state, user_id=7)


async def test_slots_are_collected_across_turns_then_booked(flow):
    _, meta = await say(flow, "s1", "I'd like a consultation")
    assert meta["status"] == "collecting_info"
    assert meta["missing_fields"] == ["date", "time"]

    _, meta = await say(flow, "s1", "tomorrow")
    assert meta["missing_fields"] == ["time"]

    reply, meta = await say(flow, "s1", "at 11am")
    assert meta["status"] == "ready_to_book"
    assert "Is this correct?" in reply

    reply, meta = await say(flow, "s1", "yes")
    assert meta["status"] == "booked"
    assert meta["appointment_data"]["date"] == TOMORROW
    assert meta["appointment_data"]["time"] == "11:00:00"
    assert len(flow.appointment_store.get_all()) == 1


async def test_a_yes_before_the_summary_does_not_book(flow):
    _, meta = await say(flow, "s1", "yes, a consultation tomorrow at 10am")
    assert meta["status"] == "ready_to_book"
    assert flow.appointment_store.get_all() == []


async def test_a_second_yes_does_not_book_twice(flow):
    await say(flow, "s1", "consultation tomorrow at 10am")
    _, first = await say(flow, "s1", "yes")
    _, second = await say(flow, "s1", "yes")
    assert first["status"] == "booked"
    assert second["status"] == "collecting_info"
    assert len(flow.appointment_store.get_all()) == 1


async def test_changing_the_time_while_confirming_reads_back_a_new_summary(flow):
    await say(flow, "s1", "consultation tomorrow at 10am")
    reply, meta = await say(flow, "s1", "yes but at 2pm")
    assert meta["status"] == "ready_to_book"
    assert "14:00:00" in reply
    assert flow.appointment_store.get_all() == []


async def test_a_taken_slot_is_refused_and_real_alternatives_offered(flow):
    flow.appointment_store.save(
        {"date": TOMORROW, "time": "10:00:00", "service_type": "Check-up", "status": "scheduled"}
    )
    reply, meta = await say(flow, "s1", "consultation tomorrow at 10am")
    assert meta["status"] == "unavailable"
    assert "10:00:00" not in meta["alternatives"]
    assert meta["alternatives"][0] == "09:00:00"
    assert "09:00" in reply

    # Saying yes to a refused slot must not book it.
    _, meta = await say(flow, "s1", "yes")
    assert meta["status"] == "collecting_info"
    assert len(flow.appointment_store.get_all()) == 1


async def test_a_slot_taken_while_the_user_was_deciding_is_not_double_booked(flow):
    await say(flow, "s1", "consultation tomorrow at 10am")
    # Another session books the same slot first.
    await say(flow, "s2", "check-up tomorrow at 10am")
    _, meta = await say(flow, "s2", "yes")
    assert meta["status"] == "booked"

    _, meta = await say(flow, "s1", "yes")
    assert meta["status"] == "unavailable"
    assert len(flow.appointment_store.get_all()) == 1


async def test_bad_structured_output_is_treated_as_an_empty_turn(flow):
    flow._extract_with_llm = AsyncMock(side_effect=ValueError("not JSON"))
    _, meta = await say(flow, "s1", "something odd")
    assert meta["status"] == "collecting_info"
    assert meta["missing_fields"] == ["date", "time", "service_type"]


@pytest.mark.parametrize("raw", ["next-ish week", "soon", ""])
def test_an_unreadable_date_counts_as_missing(flow, raw):
    assert flow._normalize_date(raw) is None


@pytest.mark.parametrize(
    "raw,expected",
    [("10:30", "10:30:00"), ("2:00 pm", "14:00:00"), ("14:30:00", "14:30:00"),
     ("12am", "00:00:00"), ("noonish", None), ("25:00", None)],
)
def test_time_normalisation(flow, raw, expected):
    assert flow._normalize_time(raw) == expected
