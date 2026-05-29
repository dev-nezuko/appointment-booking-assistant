"""
Conversation state management using LangChain
"""
from typing import Dict, Any, Optional, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from conversation.memory import ConversationMemory


class ConversationStateManager:
    """
    Manages conversation state for multi-turn conversations.
    Integrates with ConversationMemory to persist context for LangChain chains.
    """

    def __init__(self, conversation_memory: Optional["ConversationMemory"] = None):
        self.states: Dict[str, Dict[str, Any]] = {}
        self.conversation_memory = conversation_memory

    def get_state(self, session_id: str) -> Dict[str, Any]:
        """
        Get conversation state for a session.
        Creates new state if session doesn't exist.
        """
        if session_id not in self.states:
            self.states[session_id] = {
                "session_id": session_id,
                "messages": [],
                "context": {},
                "appointment_data": {},
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            }
        return self.states[session_id]

    def update_state(self, session_id: str, state: Dict[str, Any]):
        """
        Update conversation state.
        """
        state["updated_at"] = datetime.now().isoformat()
        self.states[session_id] = state

    def add_message(self, session_id: str, role: str, content: str):
        """
        Add a message to the conversation history.
        Syncs to ConversationMemory when available for LangChain context.
        """
        state = self.get_state(session_id)
        state["messages"].append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
        })
        self.update_state(session_id, state)

        if self.conversation_memory:
            if role == "user":
                self.conversation_memory.add_user_message(session_id, content)
            elif role == "assistant":
                self.conversation_memory.add_ai_message(session_id, content)

    def set_context(self, session_id: str, key: str, value: Any):
        """
        Set a context value for the conversation.
        """
        state = self.get_state(session_id)
        state["context"][key] = value
        self.update_state(session_id, state)

    def get_context(self, session_id: str, key: str, default: Any = None) -> Any:
        """
        Get a context value from the conversation.
        """
        state = self.get_state(session_id)
        return state["context"].get(key, default)

    def get_memory_for_session(self, session_id: str):
        """
        Get LangChain memory for a session, if ConversationMemory is configured.
        Returns None otherwise.
        """
        if self.conversation_memory:
            return self.conversation_memory.get_memory(session_id)
        return None

    def clear_state(self, session_id: str):
        """
        Clear conversation state and memory for a session.
        """
        if session_id in self.states:
            del self.states[session_id]
        if self.conversation_memory:
            self.conversation_memory.clear_memory(session_id)
