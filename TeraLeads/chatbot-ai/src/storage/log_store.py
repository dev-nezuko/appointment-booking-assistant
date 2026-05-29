"""
JSON-based conversation log storage for analytics and debugging
"""
import json
import os
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

if sys.platform != "win32":
    import fcntl
else:
    fcntl = None  # type: ignore


class LogStore:
    """
    JSON-based storage for conversation logs.
    Supports querying by session_id, date range, user_id.
    """

    def __init__(self, data_dir: str = "data", filename: str = "conversations.json"):
        self.data_dir = Path(os.getenv("DATA_DIR", data_dir))
        self.filepath = self.data_dir / filename
        self._ensure_data_dir()

    def _ensure_data_dir(self):
        """Create data directory and initialize file if needed."""
        self.data_dir.mkdir(parents=True, exist_ok=True)
        if not self.filepath.exists():
            self._write_json({"conversations": [], "metadata": {"last_updated": None}})

    def _read_json(self) -> Dict[str, Any]:
        """Read JSON file with file locking (Unix only)."""
        try:
            with open(self.filepath, "r", encoding="utf-8") as f:
                if fcntl:
                    fcntl.flock(f.fileno(), fcntl.LOCK_SH)
                try:
                    return json.load(f)
                finally:
                    if fcntl:
                        fcntl.flock(f.fileno(), fcntl.LOCK_UN)
        except (json.JSONDecodeError, FileNotFoundError):
            return {"conversations": [], "metadata": {"last_updated": None}}

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
        temp_path.replace(self.filepath)

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
        data = self._read_json()
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
        self._write_json(data)

    def get_by_session(self, session_id: str) -> List[Dict[str, Any]]:
        """Get all log entries for a session."""
        data = self._read_json()
        return [e for e in data["conversations"] if e.get("session_id") == session_id]

    def get_by_user(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all log entries for a user."""
        data = self._read_json()
        return [e for e in data["conversations"] if e.get("user_id") == user_id]

    def get_by_date_range(
        self, start_date: str, end_date: str
    ) -> List[Dict[str, Any]]:
        """
        Get log entries within a date range.
        Date format: YYYY-MM-DD
        """
        data = self._read_json()
        result = []
        for e in data["conversations"]:
            ts = e.get("timestamp", "")
            if ts:
                date_part = ts[:10]
                if start_date <= date_part <= end_date:
                    result.append(e)
        return result

    def get_all(self) -> List[Dict[str, Any]]:
        """Get all conversation logs."""
        data = self._read_json()
        return data.get("conversations", [])
