"""
Tests for Conversation State Manager
"""

import unittest
from conversation.state_manager import ConversationStateManager
from conversation.memory import ConversationMemory


class TestConversationStateManager(unittest.TestCase):
    """Test cases for ConversationStateManager"""

    def setUp(self):
        """Set up test fixtures"""
        self.state_manager = ConversationStateManager()
        self.session_id = "test-session-123"

    def test_get_state_creates_new_state(self):
        """Test that get_state creates a new state if it doesn't exist"""
        state = self.state_manager.get_state(self.session_id)
        
        self.assertIsNotNone(state)
        self.assertEqual(state["session_id"], self.session_id)
        self.assertEqual(state["messages"], [])
        self.assertIn("created_at", state)

    def test_add_message(self):
        """Test adding messages to conversation state"""
        self.state_manager.add_message(self.session_id, "user", "Hello")
        self.state_manager.add_message(self.session_id, "assistant", "Hi there!")
        
        state = self.state_manager.get_state(self.session_id)
        self.assertEqual(len(state["messages"]), 2)
        self.assertEqual(state["messages"][0]["role"], "user")
        self.assertEqual(state["messages"][0]["content"], "Hello")

    def test_set_and_get_context(self):
        """Test setting and getting context values"""
        self.state_manager.set_context(self.session_id, "appointment_date", "2024-01-15")
        
        date = self.state_manager.get_context(self.session_id, "appointment_date")
        self.assertEqual(date, "2024-01-15")
        
        # Test default value
        missing = self.state_manager.get_context(self.session_id, "missing_key", "default")
        self.assertEqual(missing, "default")

    def test_clear_state(self):
        """Test clearing conversation state"""
        self.state_manager.get_state(self.session_id)
        self.state_manager.clear_state(self.session_id)

        # Should create a new state after clearing
        state = self.state_manager.get_state(self.session_id)
        self.assertEqual(state["messages"], [])

    def test_get_memory_for_session_without_memory(self):
        """Test get_memory_for_session returns None when no ConversationMemory"""
        manager = ConversationStateManager(conversation_memory=None)
        self.assertIsNone(manager.get_memory_for_session("session-1"))

    def test_state_manager_with_conversation_memory(self):
        """Test state manager syncs with ConversationMemory"""
        memory = ConversationMemory()
        manager = ConversationStateManager(conversation_memory=memory)
        manager.add_message("sess-1", "user", "Hello")
        manager.add_message("sess-1", "assistant", "Hi!")
        history = memory.get_history("sess-1")
        self.assertEqual(len(history), 2)


if __name__ == "__main__":
    unittest.main()

