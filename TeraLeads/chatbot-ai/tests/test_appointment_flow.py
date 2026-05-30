"""
Tests for Appointment Flow
"""
import os
import tempfile
import pytest
from unittest.mock import MagicMock, AsyncMock, patch


@pytest.fixture(autouse=True)
def set_env():
    """Set test environment."""
    os.environ["OPENAI_API_KEY"] = "test-key"
    os.environ["LLM_PROVIDER"] = "openai"


@pytest.fixture
def mock_llm_provider():
    """Create mock LLM provider."""
    with patch.dict(os.environ, {"OPENAI_API_KEY": "test", "LLM_PROVIDER": "openai"}):
        from llm.provider import LLMProvider
        provider = MagicMock(spec=LLMProvider)
        provider.get_model.return_value = MagicMock()
        return provider


@pytest.fixture
def state_manager():
    """Create state manager without memory."""
    from conversation.state_manager import ConversationStateManager
    return ConversationStateManager(conversation_memory=None)


@pytest.fixture
def temp_storage():
    """Create temp storage."""
    with tempfile.TemporaryDirectory() as tmp:
        from storage.appointment_store import AppointmentStore
        from storage.log_store import LogStore
        apt_store = AppointmentStore(data_dir=tmp)
        log_store = LogStore(data_dir=tmp)
        yield apt_store, log_store


@pytest.fixture
def appointment_flow(mock_llm_provider, state_manager, temp_storage):
    """Create appointment flow with mocks."""
    apt_store, log_store = temp_storage
    from flows.appointment_flow import AppointmentFlow, AppointmentExtraction

    # Mock extraction to return structured data
    mock_extraction = MagicMock(return_value=AppointmentExtraction(
        date="2024-03-15",
        time="10:00:00",
        service_type="Consultation",
        intent="book_appointment",
    ))

    flow = AppointmentFlow(
        llm_provider=mock_llm_provider,
        state_manager=state_manager,
        appointment_store=apt_store,
        log_store=log_store,
    )

    # Patch the extraction chain
    flow._extract_with_llm = AsyncMock(return_value=AppointmentExtraction(
        date="2024-03-15",
        time="10:00:00",
        service_type="Consultation",
        intent="book_appointment",
    ))
    flow._generate_response_with_llm = AsyncMock(return_value="What date would you like?")

    return flow


class TestAppointmentFlow:
    """Tests for AppointmentFlow."""

    def test_normalize_date(self, appointment_flow):
        """Test date normalization."""
        from datetime import datetime
        today_str = datetime.now().strftime("%Y-%m-%d")
        assert appointment_flow._normalize_date("today") == today_str
        assert appointment_flow._normalize_date("2024-03-15") == "2024-03-15"

    def test_normalize_time(self, appointment_flow):
        """Test time normalization."""
        assert appointment_flow._normalize_time("10:30") == "10:30:00"
        assert appointment_flow._normalize_time("2:00 pm") == "14:00:00"

    @pytest.mark.asyncio
    async def test_process_message_collects_data(self, appointment_flow, state_manager):
        """Test that process_message collects appointment data."""
        state = state_manager.get_state("test-session")
        # Set extraction to return all fields
        appointment_flow._extract_with_llm = AsyncMock(return_value=MagicMock(
            date="2024-03-15",
            time="10:00:00",
            service_type="Consultation",
            intent="book_appointment",
        ))
        from flows.appointment_flow import AppointmentExtraction
        appointment_flow._extract_with_llm.return_value = AppointmentExtraction(
            date="2024-03-15",
            time="10:00:00",
            service_type="Consultation",
            intent="book_appointment",
        )

        with patch("flows.appointment_flow.check_availability", AsyncMock(return_value=True)):
            response, metadata = await appointment_flow.process_message(
                "test-session",
                "I want to book for March 15 at 10am for a consultation",
                state,
                user_id=1,
            )
        assert "date" in state["appointment_data"]
        assert "time" in state["appointment_data"]
        assert "service_type" in state["appointment_data"]
        assert metadata.get("status") in ("collecting_info", "ready_to_book", "booked")
