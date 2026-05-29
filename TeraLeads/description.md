DESCRIPTION:

Assessment Objective:
 - Build a simplified end-to-end AI chatbot that supports appointment booking.
Focus on:
 - Conversational flow design
 - Scheduling and booking logic
 - Clean service boundaries
 - Practical and scalable AI integration

Core Deliverables

1. Frontend Application ( Technology: React or Next.js )
Requirements:
 - A Web page with an integrated chatbot UI
 - Real-time chat interface (WebSockets or polling acceptable) for appointment-related requests
 - Basic user authentication and session handling (signup/login with session or JWT)
 - Clean, intuitive UX (visual polish optional)

Evaluation:
 - Component structure and state management
 - API interaction patterns
 - Conversation-driven UX design

2. Backend API, (Technology: Node.js with Express)
Requirements:
 - POST /api/chatbot/token endpoint for generating short-lived access tokens
 - Secure authentication (JWT or session-based) implementation
 - Middleware for request validation, logging, and basic rate limiting
 - Proper error handling

Evaluation:
 - API design and clarity
 - Security awareness
 - Middleware composition and maintainability
 - Service responsibility boundaries

3. Python AI Microservice, (Technology: Python with LangChain)
Requirements:
 - Chatbot service implemented using LangChain
 - Integration with an LLM provider (OpenAI, Anthropic, or open-source)
 - Multi-turn conversation state management
 - Appointment scheduling flow:
 - Collect required booking details
 - Check or simulate availability
 - Create/update appointment records
 - Log all interactions (can be database, JSON, or console logs) for analytics/debugging

Evaluation:
 - LangChain usage and prompt design
 - Conversation orchestration and memory handling
 - Handling ambiguity and incomplete user input
 - Real-world AI system design

4. Database Design, (Technology: PostgreSQL)
Requirements:
 - SQL schema (DDL) for:
 - users – user profiles and authentication
 - appointments – scheduling data and status
 - chat_sessions – conversation logs and metadata
 - Include sample data insertions
 - Indexing strategy and performance considerations
 - Multi-tenancy consideration (business_id) optional

Evaluation:
 - Data modeling and normalization
 - Scalability awareness
 - SaaS-ready schema thinking

Technical Skills Being Assessed
 - Frontend Engineering: React/Next.js patterns, chat UI implementation
 - Backend Engineering: API design, authentication, middleware
 - AI & LLM Engineering: LangChain integration, conversational system design
 - Database Design: Relational modeling, indexing, performance
 - System Architecture: End-to-end integration, scalability
 - Problem Solving: Practical decision-making, UX + AI tradeoffs

Evaluation Criteria
 - Will not be evaluated: UI aesthetics, feature completeness, production-scale optimizations

Focus will be on:
 - Clarity of thought and documentation
 - Code readability and structure
 - Sensible architectural decisions
 - Effective use of AI in real workflows
 - Ability to explain and defend tradeoffs

Final Note:
This assessment is intended to reflect how you think and build, not how fast you code. Make reasonable assumptions, document them clearly, and prioritize clean, intentional engineering decisions over completeness.