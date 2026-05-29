"""
Pytest configuration and fixtures
"""
import os
import sys
import tempfile
from pathlib import Path

# Add src to path for imports
src_path = Path(__file__).parent.parent / "src"
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))


def pytest_configure(config):
    """Set test environment variables and asyncio mode."""
    os.environ.setdefault("OPENAI_API_KEY", "test-key")
    os.environ.setdefault("LLM_PROVIDER", "openai")
    os.environ.setdefault("DATA_DIR", tempfile.mkdtemp())
    config.addinivalue_line("markers", "asyncio: mark test as async")
