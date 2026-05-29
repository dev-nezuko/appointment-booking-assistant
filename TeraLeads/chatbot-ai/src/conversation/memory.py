"""
LangChain memory handling for conversation context.
Uses langchain_core for compatibility across LangChain versions.
"""
from typing import Dict
from langchain_core.messages import HumanMessage, AIMessage


class SimpleChatMemory:
    """Simple in-memory chat history compatible with langchain_core."""

    def __init__(self):
        self._messages: list = []

    def add_user_message(self, message: str) -> None:
        self._messages.append(HumanMessage(content=message))

    def add_ai_message(self, message: str) -> None:
        self._messages.append(AIMessage(content=message))

    @property
    def messages(self) -> list:
        return self._messages

    def clear(self) -> None:
        self._messages = []


class ConversationMemory:
    """
    Wrapper for managing conversation history per session.
    Uses langchain_core messages for compatibility.
    """

    def __init__(self):
        self.memories: Dict[str, SimpleChatMemory] = {}

    def get_memory(self, session_id: str) -> SimpleChatMemory:
        """Get or create memory for a session."""
        if session_id not in self.memories:
            self.memories[session_id] = SimpleChatMemory()
        return self.memories[session_id]

    def add_user_message(self, session_id: str, message: str) -> None:
        """Add a user message to memory."""
        memory = self.get_memory(session_id)
        memory.add_user_message(message)

    def add_ai_message(self, session_id: str, message: str) -> None:
        """Add an AI message to memory."""
        memory = self.get_memory(session_id)
        memory.add_ai_message(message)

    def get_history(self, session_id: str) -> list:
        """Get conversation history for a session."""
        memory = self.get_memory(session_id)
        return memory.messages

    def clear_memory(self, session_id: str) -> None:
        """Clear memory for a session."""
        if session_id in self.memories:
            del self.memories[session_id]
