"""
Tests for JSON storage modules
"""
import os
import tempfile
import pytest
from pathlib import Path


@pytest.fixture
def temp_data_dir():
    """Create temporary data directory."""
    with tempfile.TemporaryDirectory() as tmp:
        yield tmp


@pytest.fixture
def appointment_store(temp_data_dir):
    """Create AppointmentStore with temp directory."""
    from storage.appointment_store import AppointmentStore
    os.environ["DATA_DIR"] = temp_data_dir
    return AppointmentStore(data_dir=temp_data_dir)


@pytest.fixture
def log_store(temp_data_dir):
    """Create LogStore with temp directory."""
    from storage.log_store import LogStore
    os.environ["DATA_DIR"] = temp_data_dir
    return LogStore(data_dir=temp_data_dir)


class TestAppointmentStore:
    """Tests for AppointmentStore."""

    def test_save_and_get_by_id(self, appointment_store):
        """Test saving and retrieving appointment."""
        apt = {"date": "2024-03-15", "time": "10:00:00", "service_type": "Consultation"}
        apt_id = appointment_store.save(apt)
        assert apt_id is not None
        retrieved = appointment_store.get_by_id(apt_id)
        assert retrieved is not None
        assert retrieved["date"] == "2024-03-15"
        assert retrieved["id"] == apt_id

    def test_get_by_date(self, appointment_store):
        """Test getting appointments by date."""
        appointment_store.save({"date": "2024-03-15", "time": "10:00:00", "service_type": "C"})
        appointment_store.save({"date": "2024-03-15", "time": "14:00:00", "service_type": "F"})
        apts = appointment_store.get_by_date("2024-03-15")
        assert len(apts) == 2

    def test_is_slot_available(self, appointment_store):
        """Test slot availability check."""
        appointment_store.save({
            "date": "2024-03-15",
            "time": "10:00:00",
            "service_type": "C",
            "status": "scheduled",
        })
        assert not appointment_store.is_slot_available("2024-03-15", "10:00:00")
        assert appointment_store.is_slot_available("2024-03-15", "11:00:00")

    def test_update_status(self, appointment_store):
        """Test updating appointment status."""
        apt_id = appointment_store.save({"date": "2024-03-15", "time": "10:00:00", "service_type": "C"})
        assert appointment_store.update_status(apt_id, "cancelled")
        apt = appointment_store.get_by_id(apt_id)
        assert apt["status"] == "cancelled"


class TestLogStore:
    """Tests for LogStore."""

    def test_log_conversation(self, log_store):
        """Test logging conversation."""
        log_store.log_conversation("sess-1", 1, "Hello", "Hi there!", {"status": "ok"})
        logs = log_store.get_by_session("sess-1")
        assert len(logs) == 1
        assert logs[0]["user_message"] == "Hello"
        assert logs[0]["bot_response"] == "Hi there!"
        assert logs[0]["user_id"] == 1

    def test_get_by_user(self, log_store):
        """Test getting logs by user."""
        log_store.log_conversation("s1", 1, "Hi", "Hello")
        log_store.log_conversation("s2", 1, "Bye", "Goodbye")
        logs = log_store.get_by_user(1)
        assert len(logs) == 2

    def test_get_by_date_range(self, log_store):
        """Test getting logs by date range."""
        log_store.log_conversation("s1", 1, "Hi", "Hello")
        logs = log_store.get_by_date_range("2020-01-01", "2030-12-31")
        assert len(logs) >= 1
