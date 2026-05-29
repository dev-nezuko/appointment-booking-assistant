"""
Chooses the chat model: OpenAI, Anthropic, or the local rule-based model.

Selection is `auto` by default: a hosted model when its key is present, the
local model otherwise. That keeps the service and its tests runnable from a
fresh clone with no vendor account.
"""
import os
from typing import Optional

from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI

from llm.local_model import LocalChatModel


class LLMProvider:
    """Resolves LLM_PROVIDER and the API keys into one LangChain chat model."""

    def __init__(self):
        self.provider = self._resolve_provider()
        self.model = self._initialize_model()

    #: Values that are present in the environment but are not keys. Copying
    #: .env.example to .env leaves these behind, and a placeholder is the most
    #: common reason a first run fails — with a 401 from the vendor rather than
    #: anything pointing at the actual cause.
    _PLACEHOLDER_MARKERS = (
        "your-", "your_", "changeme", "change-me", "xxx", "<", "sk-...",
        "api-key-here", "add-your", "todo",
    )

    @classmethod
    def _usable_key(cls, name: str) -> Optional[str]:
        """Return the env var's value only if it looks like a real key."""
        value = (os.getenv(name) or "").strip()
        if not value:
            return None
        lowered = value.lower()
        if any(marker in lowered for marker in cls._PLACEHOLDER_MARKERS):
            return None
        return value

    @staticmethod
    def _resolve_provider() -> str:
        """
        Decide which backend to use.

        LLM_PROVIDER=auto (the default) picks a hosted model when its key is
        present and the local model otherwise. Naming a provider explicitly
        still forces it, and still fails loudly if its key is missing — an
        explicit request for OpenAI should not silently become something else.
        """
        configured = os.getenv("LLM_PROVIDER", "auto").lower()
        if configured != "auto":
            return configured
        if LLMProvider._usable_key("OPENAI_API_KEY"):
            return "openai"
        if LLMProvider._usable_key("ANTHROPIC_API_KEY"):
            return "anthropic"
        return "local"

    def is_local(self) -> bool:
        """True when running without a hosted model."""
        return self.provider == "local"

    def _initialize_model(self):
        if self.provider == "local":
            return LocalChatModel()
        if self.provider == "openai":
            api_key = self._usable_key("OPENAI_API_KEY")
            if not api_key:
                raise ValueError(
                    "OPENAI_API_KEY is not set to a real key (it is empty or still "
                    "a placeholder from .env.example). Set it, or use "
                    "LLM_PROVIDER=local to run without one."
                )
            return ChatOpenAI(
                model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                temperature=0.7,
                openai_api_key=api_key,
            )
        if self.provider == "anthropic":
            api_key = self._usable_key("ANTHROPIC_API_KEY")
            if not api_key:
                raise ValueError(
                    "ANTHROPIC_API_KEY is not set to a real key (it is empty or "
                    "still a placeholder from .env.example). Set it, or use "
                    "LLM_PROVIDER=local to run without one."
                )
            return ChatAnthropic(
                model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-5"),
                temperature=0.7,
                anthropic_api_key=api_key,
            )
        raise ValueError(
            f"Unsupported LLM provider: {self.provider!r}. "
            "Use 'openai', 'anthropic', 'local', or 'auto'."
        )

    def get_model(self):
        """Return the underlying LangChain model for use in chains."""
        return self.model
