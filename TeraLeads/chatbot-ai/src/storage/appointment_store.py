"""
JSON-based appointment storage for MVP
"""
import os
import uuid
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

from storage.json_file import JsonFile


class AppointmentStore:
    """
    JSON-based storage for appointments.
    Uses atomic writes to prevent corruption.
    """

    def __init__(self, data_dir: Optional[str] = None, filename: str = "appointments.json"):
        # An explicit directory wins over DATA_DIR, so tests and tools can point
        # a store somewhere without touching the environment.
        self.data_dir = Path(data_dir or os.getenv("DATA_DIR", "data"))
        self.filepath = self.data_dir / filename
        self._file = JsonFile(
            self.filepath, {"appointments": [], "metadata": {"last_updated": None}}
        )

    def save(self, appointment: Dict[str, Any]) -> str:
        """
        Save an appointment and return its ID.
        """
        data = self._file.read()
        appointment_id = str(uuid.uuid4())
        appointment["id"] = appointment_id
        appointment["created_at"] = datetime.now().isoformat()
        appointment["status"] = appointment.get("status", "scheduled")
        data["appointments"].append(appointment)
        data["metadata"]["last_updated"] = datetime.now().isoformat()
        self._file.write(data)
        return appointment_id

    def get_by_id(self, appointment_id: str) -> Optional[Dict[str, Any]]:
        """Get appointment by ID."""
        data = self._file.read()
        for apt in data["appointments"]:
            if apt.get("id") == appointment_id:
                return apt
        return None

    def get_by_date(self, date_str: str) -> List[Dict[str, Any]]:
        """Get all appointments for a date."""
        data = self._file.read()
        return [a for a in data["appointments"] if a.get("date") == date_str]

    def get_by_user(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all appointments for a user."""
        data = self._file.read()
        return [a for a in data["appointments"] if a.get("user_id") == user_id]

    def get_all(self) -> List[Dict[str, Any]]:
        """Get all appointments."""
        data = self._file.read()
        return data.get("appointments", [])

    def is_slot_available(self, date_str: str, time_str: str) -> bool:
        """
        Check if a time slot is available (not already booked).
        """
        appointments = self.get_by_date(date_str)
        for apt in appointments:
            if apt.get("time") == time_str and apt.get("status") == "scheduled":
                return False
        return True

    def update_status(self, appointment_id: str, status: str) -> bool:
        """Update appointment status."""
        data = self._file.read()
        for apt in data["appointments"]:
            if apt.get("id") == appointment_id:
                apt["status"] = status
                apt["updated_at"] = datetime.now().isoformat()
                data["metadata"]["last_updated"] = datetime.now().isoformat()
                self._file.write(data)
                return True
        return False
