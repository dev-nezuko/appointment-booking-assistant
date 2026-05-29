"""
Tests for LLM Provider
"""
import os
import pytest
from unittest.mock import patch


@pytest.fixture(autouse=True)
def set_openai_key():
    """Ensure OpenAI API key is set for tests."""
    os.environ["OPENAI_API_KEY"] = "test-key"
    os.environ["LLM_PROVIDER"] = "openai"


def test_llm_provider_requires_api_key():
    """Test that LLMProvider raises when API key is missing."""
    with patch.dict(os.environ, {"OPENAI_API_KEY": "", "LLM_PROVIDER": "openai"}):
        with pytest.raises(ValueError, match="OPENAI_API_KEY"):
            from llm.provider import LLMProvider
            LLMProvider()


def test_llm_provider_unsupported_provider():
    """Test that unsupported provider raises ValueError."""
    with patch.dict(os.environ, {"OPENAI_API_KEY": "key", "LLM_PROVIDER": "invalid"}):
        with pytest.raises(ValueError, match="Unsupported"):
            from llm.provider import LLMProvider
            LLMProvider()


def test_llm_provider_get_model():
    """Test get_model returns the underlying model."""
    with patch.dict(os.environ, {"OPENAI_API_KEY": "test", "LLM_PROVIDER": "openai"}):
        from llm.provider import LLMProvider

        provider = LLMProvider()
        model = provider.get_model()
        assert model is not None
        assert model == provider.model
