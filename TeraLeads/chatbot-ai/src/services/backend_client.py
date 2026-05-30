"""
HTTP client for backend service communication
"""
import os
import logging
from typing import Dict, Any, Optional
import httpx

logger = logging.getLogger(__name__)


class BackendClient:
    """
    Async HTTP client for backend service communication.
    Supports user validation, appointment confirmation, and retry logic.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        timeout: float = 10.0,
        max_retries: int = 3,
    ):
        self.base_url = base_url or os.getenv("BACKEND_API_URL", "http://localhost:3000/api")
        self.timeout = timeout or float(os.getenv("BACKEND_TIMEOUT", 10))
        self.max_retries = max_retries
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create async HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=self.timeout,
            )
        return self._client

    async def close(self):
        """Close the HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def _request(
        self,
        method: str,
        path: str,
        json: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Make HTTP request with retry logic.
        Returns None if backend is unavailable.
        """
        client = await self._get_client()
        for attempt in range(self.max_retries):
            try:
                response = await client.request(method, path, json=json)
                response.raise_for_status()
                return response.json() if response.content else {}
            except httpx.HTTPStatusError as e:
                logger.warning(
                    "Backend request failed: %s %s - %s",
                    method,
                    path,
                    e.response.status_code,
                )
                return None
            except (httpx.RequestError, httpx.TimeoutException) as e:
                logger.warning(
                    "Backend request error (attempt %d/%d): %s",
                    attempt + 1,
                    self.max_retries,
                    str(e),
                )
                if attempt == self.max_retries - 1:
                    return None
        return None

    async def health_check(self) -> bool:
        """Check if backend service is available."""
        try:
            client = await self._get_client()
            response = await client.get("health")
            return response.status_code == 200
        except Exception as e:
            logger.debug("Backend health check failed: %s", e)
            return False

    async def validate_user(self, user_id: int) -> bool:
        """Validate user exists in backend."""
        result = await self._request("GET", f"users/{user_id}")
        return result is not None and result.get("id") == user_id

    async def create_appointment(self, appointment: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Notify backend to create/confirm appointment.
        Returns backend response or None if failed.
        """
        return await self._request("POST", "appointments", json=appointment)

    async def sync_appointment(self, appointment: Dict[str, Any]) -> bool:
        """
        Sync appointment to backend.
        Returns True if successful.
        """
        result = await self.create_appointment(appointment)
        return result is not None
