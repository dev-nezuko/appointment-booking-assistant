# chatbot-backend

Express 5 API and socket.io server. It authenticates users with JWTs, forwards
each chat turn to the AI service (`services/aiClient.js`), stores both sides
of the conversation in `chat_sessions`, and writes bookings the assistant
confirms into the `appointments` table.

## Run and test

Node 22 (`.nvmrc`). Tests mock Postgres and the AI service.

```bash
npm ci
npm test              # Jest with coverage
npm run lint
npm run format:check
cp .env.example .env  # then point DB_* and AI_SERVICE_URL at running services
npm run dev
```

## Routes

| Method and path | Auth | Notes |
| --- | --- | --- |
| `POST /api/auth/signup`, `POST /api/auth/login` | none | return `{ token, user }`; rate limited |
| `POST /api/chatbot/message` | Bearer | `{ sessionId, message }` -> `{ message, sessionId, booking }` |
| `POST /api/chatbot/token` | Bearer | 15-minute chat token |
| `GET/POST /api/appointments`, `GET/PUT/DELETE /api/appointments/:id` | Bearer | own appointments only |
| `GET /api/appointments/availability?date=YYYY-MM-DD` | Bearer | free 60-minute starts, 09:00-17:00 |
| `GET /health` | none | |
| `/api-docs` | none | Swagger UI when `NODE_ENV=development` or `SWAGGER_ENABLED=true` |

Socket.io: connect with `auth: { token }`, emit `chat:message`
`{ sessionId, message }`, receive `bot:message` or `chat:error`.

Schema, indexes and sample data are in `src/database/` (see its README).
