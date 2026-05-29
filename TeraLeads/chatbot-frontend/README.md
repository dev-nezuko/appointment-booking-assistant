# Chatbot Frontend

Frontend application for the AI Chatbot Appointment Booking System built with Next.js and TypeScript.

## Features

- Real-time chat interface with WebSocket support
- User authentication (login/signup) with JWT
- Redux state management
- Protected routes
- Appointment booking integration
- Responsive UI with Tailwind CSS
- Accessibility features (ARIA labels, skip links, keyboard navigation)
- Unit and E2E testing

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Update `.env` with your backend API URL:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

## Environment Variables

| Variable              | Description                            | Default                 |
| --------------------- | -------------------------------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | Backend API base URL for REST requests | `http://localhost:3001` |
| `NEXT_PUBLIC_WS_URL`  | WebSocket (Socket.io) server URL       | `http://localhost:3001` |

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

### Unit Tests

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests with coverage:

```bash
npm run test:coverage
```

### E2E Tests

E2E tests require the backend to be running for authentication flows.

```bash
npm run test:e2e
```

Run E2E tests with UI:

```bash
npm run test:e2e:ui
```

## Build

Build for production:

```bash
npm run build
npm start
```

## Code Quality

- **Lint**: `npm run lint`
- **Format**: `npm run format`
- **Format check**: `npm run format:check`

## Docker Deployment

Build the Docker image:

```bash
docker build -t chatbot-frontend .
```

Run the container:

```bash
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://your-api-url -e NEXT_PUBLIC_WS_URL=http://your-ws-url chatbot-frontend
```

The Dockerfile uses multi-stage builds and Next.js standalone output for an optimized production image.

## Project Structure

```
src/
├── app/              # Next.js app directory (pages)
│   ├── page.tsx      # Homepage
│   ├── login/        # Login/signup page
│   └── chat/         # Chat page (protected)
├── components/
│   ├── Auth/         # Authentication components
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── AuthInitializer.tsx
│   ├── Chat/         # Chat interface components
│   │   ├── ChatInterface.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   └── AppointmentConfirmation.tsx
│   ├── Providers/    # Redux provider
│   └── UI/           # Reusable UI components
├── api/              # API client and functions
│   ├── client.ts     # Axios instance with interceptors
│   ├── auth.ts
│   ├── chatbot.ts
│   └── appointments.ts
├── state/            # Redux store and slices
├── hooks/            # Custom hooks
├── utils/            # Utilities (WebSocket, JWT)
└── styles/           # Global styles
```

## API Integration

- **Authentication**: `/api/auth/login`, `/api/auth/signup`
- **Chat**: `/api/chatbot/message`, `/api/chatbot/token`
- **Appointments**: `/api/appointments`

The WebSocket connection uses Socket.io for real-time chat. If the WebSocket is unavailable, the app falls back to REST API for sending messages.

## Technologies

- Next.js 14
- React 18
- TypeScript
- Redux Toolkit
- Tailwind CSS
- Axios
- Socket.io Client
- Jest & React Testing Library
- Playwright (E2E)
