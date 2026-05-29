# AI Chatbot Microservice

Python microservice for AI-powered conversation management and appointment scheduling using LangChain.

## Features

- **LangChain Integration** - Conversational AI with multi-turn support
- **LLM-Powered Extraction** - Structured appointment data extraction (date, time, service type)
- **Conversation State Management** - Context maintained across messages
- **Multiple LLM Providers** - OpenAI or Anthropic via langchain-openai/langchain-anthropic
- **JSON Storage** - Appointments and conversation logs stored in JSON files (MVP)
- **Backend HTTP Integration** - Notify backend service on appointment confirmation
- **Comprehensive Logging** - File and JSON line logs for debugging and analytics
- **FastAPI REST API** - Full API documentation

## Prerequisites

- Python 3.9+
- pip
- API key for LLM provider (OpenAI or Anthropic)

## Installation

### 1. Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your API keys and settings:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
```

### 4. Run Development Server

```bash
cd src && python main.py
```

Or with uvicorn (from project root):

```bash
PYTHONPATH=src uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Chat
- `POST /chat` - Send a message and get AI response

```json
{
  "session_id": "unique-session-id",
  "message": "I want to book an appointment for tomorrow at 2pm",
  "user_id": 1
}
```

Response:
```json
{
  "response": "What type of service are you looking for?",
  "session_id": "unique-session-id",
  "metadata": {
    "status": "collecting_info",
    "missing_fields": ["service_type"]
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LLM_PROVIDER` | `openai` or `anthropic` | `openai` |
| `OPENAI_API_KEY` | OpenAI API key | Required for OpenAI |
| `OPENAI_MODEL` | OpenAI model name | `gpt-3.5-turbo` |
| `ANTHROPIC_API_KEY` | Anthropic API key | Required for Anthropic |
| `ANTHROPIC_MODEL` | Anthropic model name | `claude-3-sonnet-20240229` |
| `BACKEND_API_URL` | Backend service URL for HTTP communication | `http://localhost:3000/api` |
| `BACKEND_TIMEOUT` | Backend request timeout (seconds) | `10` |
| `DATA_DIR` | Directory for JSON storage | `data` |
| `LOG_DIR` | Directory for log files | `logs` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `*` |

## Testing

```bash
PYTHONPATH=src pytest tests/ -v
```

Run with coverage:
```bash
PYTHONPATH=src pytest tests/ -v --cov=src --cov-report=html
```

## Docker Deployment

### Build

```bash
docker build -t chatbot-ai:latest .
```

### Run

```bash
docker run -p 8000:8000 \
  -e OPENAI_API_KEY=your-key \
  -e BACKEND_API_URL=http://host.docker.internal:3000/api \
  chatbot-ai:latest
```

### Docker Compose

```bash
export OPENAI_API_KEY=your-key
docker-compose up -d
```

Data and logs are persisted in Docker volumes.

## Project Structure

```
src/
├── main.py                 # FastAPI application entry point
├── conversation/           # Conversation state management
│   ├── state_manager.py    # Session state with memory integration
│   └── memory.py          # LangChain memory per session
├── flows/
│   └── appointment_flow.py # LLM-based appointment scheduling
├── llm/
│   ├── provider.py        # OpenAI/Anthropic abstraction
│   └── chain.py            # Conversation chain wrapper
├── storage/               # JSON-based storage
│   ├── appointment_store.py
│   └── log_store.py
├── services/
│   └── backend_client.py   # HTTP client for backend
└── utils/
    ├── logger.py          # Structured logging
    └── availability.py    # Slot availability checks

data/                      # Appointments and logs (JSON)
└── appointments.json
└── conversations.json

tests/
├── test_state_manager.py
├── test_llm_provider.py
├── test_appointment_flow.py
├── test_storage.py
└── integration/
    ├── test_api.py
    └── test_backend_communication.py
```

## Conversation Flow

The appointment scheduling flow:

1. **Collect** - Date, time, service type via LLM extraction
2. **Validate** - Check availability against stored appointments
3. **Confirm** - User confirms; appointment saved to JSON
4. **Sync** - Notify backend via HTTP (if configured)

Missing information is requested naturally through follow-up questions. The system handles relative dates ("tomorrow", "next week") and various time formats.

## Technologies

- FastAPI
- LangChain 0.3+
- langchain-openai / langchain-anthropic
- Pydantic v2
- httpx
