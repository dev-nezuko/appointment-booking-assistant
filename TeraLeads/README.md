# TeraLeads service workspace

See the [repository overview](../README.md) for the current architecture and unfinished integration boundaries. This folder contains the runnable service directories and Compose files.

| Service | Development setup | Default port |
| --- | --- | --- |
| Next.js UI | `cd chatbot-frontend`, `npm ci --ignore-scripts`, copy `.env.example` to `.env.local`, `npm run dev` | 3000 |
| Express API | `cd chatbot-backend`, `npm install --ignore-scripts`, copy/configure `.env.example` as `.env`, `npm run dev` | 3001 |
| FastAPI flow | `cd chatbot-ai`, create an isolated Python environment, install `requirements.txt`, configure `.env`, then `PYTHONPATH=src uvicorn main:app --host 127.0.0.1 --port 8000` | 8000 |

The API needs PostgreSQL initialized using its [database guide](chatbot-backend/src/database/README.md). The Python flow needs a configured model provider and uses separate local JSON storage. It is not automatically a working replacement for the placeholder Express response.

For Compose configuration details, consult [DOCKER.md](DOCKER.md), checking any operational guidance against the current files. Do not use a production database, real appointment information, or shared credentials in this demo. Tests and more implementation detail are available in the [frontend](chatbot-frontend/README.md), [backend](chatbot-backend/README.md), and [AI service](chatbot-ai/README.md) documentation.
