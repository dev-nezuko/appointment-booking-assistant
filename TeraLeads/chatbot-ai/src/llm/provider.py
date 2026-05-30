"""
LLM provider abstraction for OpenAI, Anthropic, or open-source models
"""
import os
from typing import Optional
from langchain_openai import ChatOpenAI

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
        self.provider = os.getenv("LLM_PROVIDER", "openai").lower()
        self.model = self._initialize_model()

    def _initialize_model(self):
        """
        Initialize the appropriate LLM based on provider.
        """
        if self.provider == "openai":
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY not set in environment variables")
            return ChatOpenAI(
                model=os.getenv("OPENAI_MODEL", "gpt-3.5-turbo"),
                temperature=0.7,
                openai_api_key=api_key,
            )
        elif self.provider == "anthropic":
            if ChatAnthropic is None:
                raise ValueError("langchain-anthropic not installed. pip install langchain-anthropic")
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if not api_key:
                raise ValueError("ANTHROPIC_API_KEY not set in environment variables")
            return ChatAnthropic(
                model=os.getenv("ANTHROPIC_MODEL", "claude-3-sonnet-20240229"),
                temperature=0.7,
                anthropic_api_key=api_key,
            )
        else:
            raise ValueError(f"Unsupported LLM provider: {self.provider}")

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
