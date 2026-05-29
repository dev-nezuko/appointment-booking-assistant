"""
JSON-based conversation log storage for analytics and debugging
"""
import os
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

from storage.json_file import JsonFile


class LogStore:
    """
    JSON-based storage for conversation logs.
    Supports querying by session_id, date range, user_id.
    """

    def __init__(self, data_dir: Optional[str] = None, filename: str = "conversations.json"):
        # An explicit directory wins over DATA_DIR, so tests and tools can point
        # a store somewhere without touching the environment.
        self.data_dir = Path(data_dir or os.getenv("DATA_DIR", "data"))
        self.filepath = self.data_dir / filename
        self._file = JsonFile(
            self.filepath, {"conversations": [], "metadata": {"last_updated": None}}
        )

    def log_conversation(
        self,
        session_id: str,
        user_id: int,
        user_message: str,
        bot_response: str,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        """
        Log a conversation turn.
        """
        data = self._file.read()
        entry = {
            "session_id": session_id,
            "user_id": user_id,
            "user_message": user_message,
            "bot_response": bot_response,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {},
        }
        data["conversations"].append(entry)
        data["metadata"]["last_updated"] = datetime.now().isoformat()
        self._file.write(data)

    def get_by_session(self, session_id: str) -> List[Dict[str, Any]]:
        """Get all log entries for a session."""
        data = self._file.read()
        return [entry for entry in data["conversations"] if entry.get("session_id") == session_id]

    def get_by_user(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all log entries for a user."""
        data = self._file.read()
        return [entry for entry in data["conversations"] if entry.get("user_id") == user_id]

    def get_by_date_range(
        self, start_date: str, end_date: str
    ) -> List[Dict[str, Any]]:
        """
        Get log entries within a date range.
        Date format: YYYY-MM-DD
        """
        data = self._file.read()
        result = []
        for entry in data["conversations"]:
            stamp = entry.get("timestamp", "")
            if stamp and start_date <= stamp[:10] <= end_date:
                result.append(entry)
        return result

    def get_all(self) -> List[Dict[str, Any]]:
        """Get all conversation logs."""
        data = self._file.read()
        return data.get("conversations", [])
