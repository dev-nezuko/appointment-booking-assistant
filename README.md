# AI Chatbot Appointment Booking System

A full-stack AI-powered chatbot system for appointment scheduling, built with Next.js, Node.js, Express, Python, and LangChain.

## Architecture

The system consists of three main services:

1. **Frontend** (Next.js/React) - User interface and chat interface
2. **Backend** (Node.js/Express) - REST API with authentication and database
3. **AI Microservice** (Python/FastAPI) - LangChain-powered conversational AI

## Quick Start with Docker

The easiest way to run the entire system is using Docker Compose:

```bash
# 1. Clone the repository
git clone <repository-url>
cd TeraLeads

# 2. Create environment file
cp .env.example .env

# 3. Update .env with your API keys
# - Set JWT_SECRET (minimum 32 characters)
# - Set OPENAI_API_KEY

# 4. Start all services
docker-compose up -d --build

# 5. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# AI Service: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

For detailed Docker instructions, see [DOCKER.md](./DOCKER.md).

## Manual Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 14+
- OpenAI API key (or Anthropic API key)

### Frontend Setup

```bash
cd chatbot-frontend
npm install
cp .env.example .env
# Update .env with API URLs
npm run dev
```

### Backend Setup

```bash
cd chatbot-backend
npm install
cp .env.example .env
# Update .env with database and JWT configuration

# Setup database
createdb chatbot_db
psql -d chatbot_db -f src/database/schema.sql
psql -d chatbot_db -f src/database/indexing.sql

npm run dev
```

### AI Service Setup

```bash
cd chatbot-ai
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Update .env with LLM API keys

python src/main.py
```

## Project Structure

```
TeraLeads/
├── chatbot-frontend/     # Next.js frontend application
├── chatbot-backend/      # Node.js/Express backend API
├── chatbot-ai/           # Python/FastAPI AI microservice
├── docker-compose.yml    # Docker Compose configuration
├── DOCKER.md            # Docker setup guide
└── CODE_QUALITY.md      # Code quality standards
```

## Features

- **User Authentication**: JWT-based authentication with secure password hashing
- **Real-time Chat**: WebSocket support for real-time conversations
- **AI-Powered Conversations**: LangChain integration with OpenAI/Anthropic
- **Appointment Scheduling**: Intelligent appointment booking flow
- **Database**: PostgreSQL with optimized indexes
- **API Documentation**: Swagger/OpenAPI docs
- **Docker Support**: Full containerization with docker-compose
- **Security**: Rate limiting, input validation, SQL injection prevention

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Chatbot
- `POST /api/chatbot/token` - Generate chatbot access token
- `POST /api/chatbot/message` - Send chat message

### Health Checks
- `GET /health` - Service health status

## Documentation

- [Docker Setup Guide](./DOCKER.md) - Complete Docker instructions
- [Code Quality Standards](./CODE_QUALITY.md) - Development guidelines
- [Frontend README](./chatbot-frontend/README.md) - Frontend documentation
- [Backend README](./chatbot-backend/README.md) - Backend documentation
- [AI Service README](./chatbot-ai/README.md) - AI service documentation

## Development

### Running Tests

```bash
# Frontend
cd chatbot-frontend && npm test

# Backend
cd chatbot-backend && npm test

# AI Service
cd chatbot-ai && pytest
```

### Linting

```bash
# Frontend
cd chatbot-frontend && npm run lint

# Backend
cd chatbot-backend && npm run lint

# AI Service
cd chatbot-ai && pylint src/
```

## Environment Variables

See `.env.example` for all required environment variables.

### Required
- `JWT_SECRET` - Secret key for JWT tokens (minimum 32 characters)
- `OPENAI_API_KEY` - OpenAI API key for LLM

### Optional
- `LLM_PROVIDER` - LLM provider (`openai` or `anthropic`)
- `DB_PASSWORD` - PostgreSQL password
- `CORS_ORIGIN` - Allowed CORS origin

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens have expiration times
- SQL injection prevention via parameterized queries
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- CORS configuration
- Non-root users in Docker containers

## Contributing

1. Follow the code quality standards in [CODE_QUALITY.md](./CODE_QUALITY.md)
2. Write tests for new features
3. Update documentation as needed
4. Ensure all linting checks pass

## License

[Your License Here]

## Support

For issues or questions, please check:
1. Service logs: `docker-compose logs`
2. Documentation in respective README files
3. [DOCKER.md](./DOCKER.md) for Docker-specific issues

