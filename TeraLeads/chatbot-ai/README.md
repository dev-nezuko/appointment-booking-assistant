# chatbot-ai

FastAPI service that owns the conversation. Each `POST /chat` turn goes through
`flows/appointment_flow.py`: extract service, date and time with the model's
structured output, ask for whatever is missing, check the slot, read a summary
back, and book only when the user agrees to that exact summary.

## Model selection

`LLM_PROVIDER=auto` (default) uses OpenAI or Anthropic when a real key is set
and otherwise `llm/local_model.py`, a rule-based LangChain chat model that
needs no network. Placeholder keys such as `your-...` count as no key. Setting
`openai`, `anthropic` or `local` forces one; a forced hosted provider without a
key fails at startup instead of falling back.

## Run and test

```bash
python3.12 -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt
pytest            # 94 tests, no network or keys needed
pylint src
cp .env.example .env
cd src && uvicorn main:app --port 8000
```

`GET /health` reports the active provider; `/docs` has the OpenAPI UI.

## Storage

Bookings and conversation logs are JSON documents under `DATA_DIR`
(`storage/json_file.py` replaces them atomically). This is the assistant's
own record for availability checks. The backend writes every confirmed
booking to Postgres, which is the calendar of record.

## Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `LLM_PROVIDER` | `auto` | `auto`, `openai`, `anthropic` or `local` |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | empty, `gpt-4o-mini` | hosted OpenAI model |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | empty, `claude-sonnet-4-5` | hosted Anthropic model |
| `DATA_DIR`, `LOG_DIR` | `data`, `logs` | JSON store and log files |
| `CORS_ORIGINS` | `*` | comma-separated origins |
