"""
HTTP-level tests for the FastAPI app, running on the keyless local model.
"""
import importlib
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(name="client")
def fixture_client(tmp_path, monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "local")
    monkeypatch.setenv("DATA_DIR", str(tmp_path / "data"))
    monkeypatch.setenv("LOG_DIR", str(tmp_path / "logs"))
    import main  # pylint: disable=import-outside-toplevel

    return TestClient(importlib.reload(main).app)


def test_health_reports_the_active_provider(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["llm_provider"] == "local"


@pytest.mark.parametrize(
    "body",
    [
        {},
        {"session_id": "s", "message": "", "user_id": 1},
        {"session_id": "s", "message": "   ", "user_id": 1},
        {"session_id": "s", "message": "hi", "user_id": 0},
        {"session_id": "s", "message": "x" * 1001, "user_id": 1},
    ],
)
def test_invalid_requests_are_rejected(client, body):
    assert client.post("/chat", json=body).status_code == 422


def test_a_booking_conversation_over_http(client):
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")

    def say(text):
        response = client.post("/chat", json={"session_id": "api-1", "message": text, "user_id": 3})
        assert response.status_code == 200
        return response.json()

    first = say("I'd like a check-up tomorrow")
    assert first["metadata"] == {"status": "collecting_info", "missing_fields": ["time"]}

    second = say("2pm please")
    assert second["metadata"]["status"] == "ready_to_book"
    assert second["metadata"]["appointment_data"] == {
        "service_type": "Check-up",
        "date": tomorrow,
        "time": "14:00:00",
    }

    third = say("yes")
    assert third["metadata"]["status"] == "booked"
    assert third["session_id"] == "api-1"
