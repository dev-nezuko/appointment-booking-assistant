# AI Appointment Booking Assistant

A chat app for booking appointments. You type something like "I'd like a consultation next Wednesday at 11am", and the assistant pulls out the date, time and service, asks for anything missing, checks availability and confirms the booking. It is split into three services plus Postgres, all under `TeraLeads/`.

- `chatbot-frontend/`: Next.js 14, Redux, Tailwind, socket.io client
- `chatbot-backend/`: Express, JWT auth, PostgreSQL, socket.io server
- `chatbot-ai/`: FastAPI and LangChain, handles the conversation and slot filling

![Chat screen](docs/screenshots/chat.png)

## Quick start

```bash
cd TeraLeads
cp .env.example .env
docker compose up -d --build
```

- Chat UI: http://localhost:3400
- Backend API: http://localhost:3401 (routes under `/api`)
- AI service docs: http://localhost:8400/docs

No API key is required. With `LLM_PROVIDER=auto` the AI service uses OpenAI or Anthropic if a real key is set, and otherwise falls back to a local rule-based LangChain model (`chatbot-ai/src/llm/local_model.py`). Placeholder values like `your-...` count as no key. Set `LLM_PROVIDER` to `openai`, `anthropic` or `local` to force one.

## API overview

Backend:

- `POST /api/auth/signup`, `POST /api/auth/login`
- `POST /api/chatbot/token`, `POST /api/chatbot/message`
- `/api/appointments`: create, list, `GET /availability`, get, update, delete by id

AI service: `POST /chat` and `GET /health`.

Chat messages go over socket.io when connected, with plain HTTP as a fallback. The backend forwards each turn to the AI service (`chatbot-backend/src/services/aiClient.js`) and saves both sides in Postgres.

## Running the tests

```bash
# AI service
cd TeraLeads/chatbot-ai
pip install -r requirements.txt
pytest

# Backend
cd TeraLeads/chatbot-backend
npm install
npm test

# Frontend (Jest unit tests; Playwright e2e with npm run test:e2e)
cd TeraLeads/chatbot-frontend
npm install
npm test
```

## Limitations

- The local model only understands the phrasings it has patterns for. For anything else it asks a follow-up question instead of guessing.
- Appointments are stored both in the AI service's JSON store and the backend's `appointments` table, and the two are not synced.
- Times have no timezone handling.
