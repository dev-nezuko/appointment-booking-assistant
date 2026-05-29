"""
Logging utilities for conversation tracking and service monitoring
"""
import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional


class JsonFormatter(logging.Formatter):
    """Format log records as JSON for structured logging."""

    def format(self, record: logging.LogRecord) -> str:
        log_obj: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if hasattr(record, "action"):
            log_obj["action"] = record.action
        if hasattr(record, "session_id"):
            log_obj["session_id"] = record.session_id
        if hasattr(record, "user_id"):
            log_obj["user_id"] = record.user_id
        if hasattr(record, "error"):
            log_obj["error"] = record.error
        if hasattr(record, "error_type"):
            log_obj["error_type"] = record.error_type
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj, default=str)


def setup_logger(
    name: str = "chatbot_ai",
    log_dir: Optional[str] = None,
) -> logging.Logger:
    """
    Set up logger with file, console, and optional JSON file handlers.
    Supports structured metadata for debugging and analysis.
    """
    log_dir = log_dir or os.getenv("LOG_DIR", "logs")
    log_level = getattr(
        logging,
        os.getenv("LOG_LEVEL", "INFO").upper(),
        logging.INFO,
    )

    logger = logging.getLogger(name)
    logger.setLevel(log_level)

    # Avoid duplicate handlers
    if logger.handlers:
        return logger

    Path(log_dir).mkdir(parents=True, exist_ok=True)

    # File handler (text format)
    log_file = Path(log_dir) / f"chatbot_{datetime.now().strftime('%Y%m%d')}.log"
    file_handler = logging.FileHandler(log_file, encoding="utf-8")
    file_handler.setLevel(log_level)
    file_handler.setFormatter(
        logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
    )
    logger.addHandler(file_handler)

    # JSON file handler (structured)
    json_log_file = Path(log_dir) / f"chatbot_{datetime.now().strftime('%Y%m%d')}.jsonl"
    json_handler = logging.FileHandler(json_log_file, encoding="utf-8")
    json_handler.setLevel(log_level)
    json_handler.setFormatter(JsonFormatter())
    logger.addHandler(json_handler)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(
        logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    )
    logger.addHandler(console_handler)

    return logger
