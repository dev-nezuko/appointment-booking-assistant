# chatbot-frontend

Next.js 16 (App Router) client with Redux Toolkit and Tailwind. Pages: `/`
(overview), `/login` (sign in or create an account) and `/chat` (the
conversation plus a booking panel). Chat turns go over socket.io when the
socket is connected and over `POST /api/chatbot/message` otherwise.

## Run and test

Node 22 (`.nvmrc`).

```bash
npm ci
npm test               # Jest + Testing Library
npm run lint
npx tsc --noEmit
npm run build
cp .env.example .env.local && npm run dev
```

`NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` are inlined at build time, so
the Docker image takes them as build args. `npm run test:e2e` runs the
Playwright specs in `e2e/` against `npm run dev` and a running backend.
