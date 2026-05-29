"""
LangChain chain setup for conversation.
Uses LCEL with langchain_core for compatibility across LangChain versions.
"""
from typing import Optional, List
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage


class ConversationChainWrapper:
    """
    Wrapper for multi-turn conversations using LCEL.
    Works with langchain_core and any chat model.
    """

    def __init__(self, llm, memory=None):
        self.llm = llm
        self.memory = memory
        # Build chain with optional chat history
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a helpful AI assistant for appointment booking. "
             "Be friendly, professional, and concise. Help users schedule appointments."),
            MessagesPlaceholder(variable_name="chat_history", optional=True),
            ("human", "{input}"),
        ])
        self.chain = self.prompt | self.llm

    def _get_messages(self) -> List[BaseMessage]:
        """Get messages from memory if available."""
        if self.memory is None:
            return []
        messages = getattr(self.memory, "messages", None)
        if messages is None:
            messages = getattr(self.memory, "_messages", [])
        return list(messages) if messages else []

    def predict(self, input_text: str) -> str:
        """Generate a response (synchronous)."""
        result = self.chain.invoke({
            "input": input_text,
            "chat_history": self._get_messages(),
        })
        return result.content if hasattr(result, "content") else str(result)

    async def apredict(self, input_text: str) -> str:
        """Generate a response (asynchronous)."""
        result = await self.chain.ainvoke({
            "input": input_text,
            "chat_history": self._get_messages(),
        })
        return result.content if hasattr(result, "content") else str(result)

    def get_memory(self):
        """Get the conversation memory."""
        return self.memory
