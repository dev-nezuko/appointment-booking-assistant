"""
Integration tests for backend communication
"""
import os
import pytest
from unittest.mock import AsyncMock, patch


@pytest.fixture(autouse=True)
def set_env():
    """Set test environment."""
    os.environ["BACKEND_API_URL"] = "http://localhost:9999"
    os.environ["BACKEND_TIMEOUT"] = "2"


@pytest.mark.asyncio
async def test_backend_client_health_check_unavailable():
    """Test health check when backend is down."""
    from services.backend_client import BackendClient

    client = BackendClient()
    # Backend at localhost:9999 likely not running
    result = await client.health_check()
    # Should not raise - returns False if unavailable
    assert isinstance(result, bool)
    await client.close()


@pytest.mark.asyncio
async def test_backend_client_create_appointment_mock():
    """Test create_appointment with mocked response."""
    from services.backend_client import BackendClient

    appointment = {"date": "2024-03-15", "time": "10:00:00", "service_type": "Consultation"}

    with patch.object(BackendClient, "_request", new_callable=AsyncMock) as mock_request:
        mock_request.return_value = {"id": "123"}

        client = BackendClient()
        result = await client.create_appointment(appointment)
        assert result is not None
        assert result.get("id") == "123"
        await client.close()


@pytest.mark.asyncio
async def test_backend_client_handles_timeout():
    """Test that client handles timeout gracefully."""
    from services.backend_client import BackendClient

    with patch.object(BackendClient, "_request", new_callable=AsyncMock) as mock_request:
        mock_request.return_value = None  # Simulates failure

        client = BackendClient(max_retries=1)
        result = await client.create_appointment({"date": "2024-03-15"})
        assert result is None
        await client.close()
