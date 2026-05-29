"""
LLM provider abstraction for OpenAI, Anthropic, or a local rule-based model.

Provider selection is `auto` by default: use a real model when a key is
present, and fall back to the local model when none is. Previously the
constructor raised without OPENAI_API_KEY, so the service could not start and
the tests could not run without a billing relationship — which put the parts
worth reviewing (slot filling, availability, the double-booking guard) out of
reach of anyone who cloned the repository.
"""
import os
from typing import Optional
from langchain_openai import ChatOpenAI

from llm.local_model import LocalChatModel

try:
    from langchain_anthropic import ChatAnthropic
except ImportError:
    ChatAnthropic = None  # type: ignore


class LLMProvider:
    """
    Abstraction layer for different LLM providers.
    Supports OpenAI and Anthropic via langchain-openai and langchain-anthropic.
    """

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
        """
        Initialize the appropriate LLM based on provider.
        """
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
                model=os.getenv("OPENAI_MODEL", "gpt-3.5-turbo"),
                temperature=0.7,
                openai_api_key=api_key,
            )
        elif self.provider == "anthropic":
            if ChatAnthropic is None:
                raise ValueError("langchain-anthropic not installed. pip install langchain-anthropic")
            api_key = self._usable_key("ANTHROPIC_API_KEY")
            if not api_key:
                raise ValueError(
                    "ANTHROPIC_API_KEY is not set to a real key (it is empty or "
                    "still a placeholder from .env.example). Set it, or use "
                    "LLM_PROVIDER=local to run without one."
                )
            return ChatAnthropic(
                model=os.getenv("ANTHROPIC_MODEL", "claude-3-sonnet-20240229"),
                temperature=0.7,
                anthropic_api_key=api_key,
            )
        else:
            raise ValueError(
                f"Unsupported LLM provider: {self.provider!r}. "
                "Use 'openai', 'anthropic', 'local', or 'auto'."
            )

    def get_model(self):
        """Return the underlying LangChain model for use in chains."""
        return self.model

    async def ainvoke(self, prompt: str, context: Optional[dict] = None) -> str:
        """
        Generate a response from the LLM asynchronously.
        """
        try:
            full_prompt = self._build_prompt(prompt, context)
            response = await self.model.ainvoke(full_prompt)
            return response.content if hasattr(response, "content") else str(response)
        except Exception as e:
            err_msg = str(e).lower()
            if "rate" in err_msg or "limit" in err_msg:
                raise RuntimeError("LLM rate limit exceeded. Please try again later.") from e
            if "timeout" in err_msg or "timed out" in err_msg:
                raise RuntimeError("LLM request timed out. Please try again.") from e
            raise RuntimeError(f"LLM invocation failed: {str(e)}") from e

    async def generate_response(self, prompt: str, context: Optional[dict] = None) -> str:
        """
        Generate a response from the LLM asynchronously.
        Alias for ainvoke for backward compatibility.
        """
        return await self.ainvoke(prompt, context)

    def invoke(self, prompt: str, context: Optional[dict] = None) -> str:
        """
        Generate a response from the LLM synchronously.
        """
        try:
            full_prompt = self._build_prompt(prompt, context)
            response = self.model.invoke(full_prompt)
            return response.content if hasattr(response, "content") else str(response)
        except Exception as e:
            raise RuntimeError(f"LLM invocation failed: {str(e)}") from e

    def _build_prompt(self, prompt: str, context: Optional[dict] = None) -> str:
        """
        Build the full prompt with system context.
        """
        system_prompt = """You are a helpful AI assistant for appointment booking.
        Be friendly, professional, and concise. Help users schedule appointments by collecting:
        - Date
        - Time
        - Service type

        Ask for missing information naturally in the conversation."""

        if context:
            context_str = "\n".join([f"{k}: {v}" for k, v in context.items()])
            return f"{system_prompt}\n\nContext:\n{context_str}\n\nUser: {prompt}\nAssistant:"

        return f"{system_prompt}\n\nUser: {prompt}\nAssistant:"
