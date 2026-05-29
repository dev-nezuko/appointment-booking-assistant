"""
JSON-based appointment storage for MVP
"""
import json
import os
import sys
import uuid
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

# fcntl is Unix-only; use no-op on Windows
if sys.platform != "win32":
    import fcntl
else:
    fcntl = None  # type: ignore


class AppointmentStore:
    """
    JSON-based storage for appointments.
    Uses atomic writes to prevent corruption.
    """

    def __init__(self, data_dir: str = "data", filename: str = "appointments.json"):
        self.data_dir = Path(os.getenv("DATA_DIR", data_dir))
        self.filepath = self.data_dir / filename
        self._ensure_data_dir()
        self._lock_timeout = 5.0

    def _ensure_data_dir(self):
        """Create data directory and initialize file if needed."""
        self.data_dir.mkdir(parents=True, exist_ok=True)
        if not self.filepath.exists():
            self._write_json({"appointments": [], "metadata": {"last_updated": None}})

    def _read_json(self) -> Dict[str, Any]:
        """Read JSON file with file locking (Unix only)."""
        try:
            if not self.filepath.exists():
                return {"appointments": [], "metadata": {"last_updated": None}}
            with open(self.filepath, "r", encoding="utf-8") as f:
                if fcntl:
                    fcntl.flock(f.fileno(), fcntl.LOCK_SH)
                try:
                    return json.load(f)
                finally:
                    if fcntl:
                        fcntl.flock(f.fileno(), fcntl.LOCK_UN)
        except (json.JSONDecodeError, FileNotFoundError, OSError):
            return {"appointments": [], "metadata": {"last_updated": None}}

    def _write_json(self, data: Dict[str, Any]):
        """Write JSON file atomically with file locking (Unix only)."""
        temp_path = self.filepath.with_suffix(".tmp")
        with open(temp_path, "w", encoding="utf-8") as f:
            if fcntl:
                fcntl.flock(f.fileno(), fcntl.LOCK_EX)
            try:
                json.dump(data, f, indent=2, default=str)
            finally:
                if fcntl:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)
        try:
            temp_path.replace(self.filepath)
        except OSError:
            self.filepath.write_text(json.dumps(data, indent=2, default=str))

    def save(self, appointment: Dict[str, Any]) -> str:
        """
        Save an appointment and return its ID.
        """
        data = self._read_json()
        appointment_id = str(uuid.uuid4())
        appointment["id"] = appointment_id
        appointment["created_at"] = datetime.now().isoformat()
        appointment["status"] = appointment.get("status", "scheduled")
        data["appointments"].append(appointment)
        data["metadata"]["last_updated"] = datetime.now().isoformat()
        self._write_json(data)
        return appointment_id

    def get_by_id(self, appointment_id: str) -> Optional[Dict[str, Any]]:
        """Get appointment by ID."""
        data = self._read_json()
        for apt in data["appointments"]:
            if apt.get("id") == appointment_id:
                return apt
        return None

    def get_by_date(self, date_str: str) -> List[Dict[str, Any]]:
        """Get all appointments for a date."""
        data = self._read_json()
        return [a for a in data["appointments"] if a.get("date") == date_str]

    def get_by_user(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all appointments for a user."""
        data = self._read_json()
        return [a for a in data["appointments"] if a.get("user_id") == user_id]

    def get_all(self) -> List[Dict[str, Any]]:
        """Get all appointments."""
        data = self._read_json()
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
        data = self._read_json()
        for apt in data["appointments"]:
            if apt.get("id") == appointment_id:
                apt["status"] = status
                apt["updated_at"] = datetime.now().isoformat()
                data["metadata"]["last_updated"] = datetime.now().isoformat()
                self._write_json(data)
                return True
        return False
