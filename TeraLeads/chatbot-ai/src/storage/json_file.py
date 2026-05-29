"""
A JSON document on disk, replaced atomically on every write.

Writing to a sibling temp file and renaming it over the original means a
reader sees either the old document or the new one, never half of each. The
service runs as a single worker, so there is no cross-process writer to lock
against; a multi-worker deployment would need a database instead.
"""
import copy
import json
import os
from pathlib import Path
from typing import Any, Dict


class JsonFile:
    def __init__(self, path: Path, empty: Dict[str, Any]):
        self.path = path
        self._empty = empty
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.write(self._empty)

    def read(self) -> Dict[str, Any]:
        """The document, or a fresh empty one if the file is missing or corrupt."""
        try:
            with open(self.path, "r", encoding="utf-8") as handle:
                return json.load(handle)
        except (OSError, json.JSONDecodeError):
            return copy.deepcopy(self._empty)

    def write(self, data: Dict[str, Any]) -> None:
        temp_path = self.path.with_suffix(".tmp")
        with open(temp_path, "w", encoding="utf-8") as handle:
            json.dump(data, handle, indent=2, default=str)
        os.replace(temp_path, self.path)
