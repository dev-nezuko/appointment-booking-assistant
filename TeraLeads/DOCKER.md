# Docker Setup Guide

This guide explains how to build, run, and manage the Docker containers for the AI Chatbot Appointment Booking System.

## Prerequisites

- Docker Engine 20.10+ installed
- Docker Compose 2.0+ installed
- At least 4GB of available RAM
- OpenAI API key (or Anthropic API key) for the AI service

## Quick Start

1. **Clone the repository and navigate to the project root:**
   ```bash
   cd /path/to/TeraLeads
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Update `.env` with your configuration:**
   - Set `JWT_SECRET` to a strong random string (minimum 32 characters)
   - Set `OPENAI_API_KEY` with your OpenAI API key
   - Adjust database credentials if needed
   - Update CORS origins for your frontend URL

4. **Build and start all services:**
   ```bash
   docker-compose up -d --build
   ```

5. **Check service status:**
   ```bash
   docker-compose ps
   ```

6. **View logs:**
   ```bash
   docker-compose logs -f
   ```

## Services

The docker-compose setup includes the following services:

### 1. PostgreSQL Database (`postgres`)
- **Port:** 5432
- **Container:** `chatbot-postgres`
- **Volume:** `postgres_data` (persistent storage)
- **Health Check:** Automatic database readiness check

### 2. AI Microservice (`ai-service`)
- **Port:** 8000
- **Container:** `chatbot-ai`
- **Technology:** Python/FastAPI with LangChain
- **Dependencies:** Requires `postgres` to be healthy
- **API Docs:** http://localhost:8000/docs

### 3. Backend API (`backend`)
- **Port:** 3001
- **Container:** `chatbot-backend`
- **Technology:** Node.js/Express
- **Dependencies:** Requires `postgres` and `ai-service` to be healthy
- **Health Check:** http://localhost:3001/health

### 4. Frontend (`frontend`)
- **Port:** 3000
- **Container:** `chatbot-frontend`
- **Technology:** Next.js/React
- **Dependencies:** Requires `backend` to be healthy
- **URL:** http://localhost:3000

## Common Commands

### Start Services
```bash
# Start all services in detached mode
docker-compose up -d

# Start with build (rebuild images)
docker-compose up -d --build

# Start specific service
docker-compose up -d frontend
```

### Stop Services
```bash
# Stop all services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers, volumes, and networks
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f ai-service
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Rebuild Services
```bash
# Rebuild all services
docker-compose build

# Rebuild specific service
docker-compose build frontend

# Rebuild without cache
docker-compose build --no-cache
```

### Execute Commands in Containers
```bash
# Backend container
docker-compose exec backend sh

# AI service container
docker-compose exec ai-service bash

# Database container
docker-compose exec postgres psql -U postgres -d chatbot_db
```

### Check Service Health
```bash
# View service status
docker-compose ps

# Check health endpoints
curl http://localhost:3001/health  # Backend
curl http://localhost:8000/health  # AI Service
```

## Individual Service Dockerfiles

### Frontend Dockerfile
- **Base Image:** `node:18-alpine`
- **Multi-stage Build:** Yes (deps → builder → runner)
- **Optimization:** Standalone Next.js output
- **Security:** Non-root user (nextjs:nodejs)
- **Port:** 3000

### Backend Dockerfile
- **Base Image:** `node:18-alpine`
- **Multi-stage Build:** Yes (deps → builder → runner)
- **Security:** Non-root user (nodejs:nodejs)
- **Health Check:** Built-in
- **Port:** 3001

### AI Service Dockerfile
- **Base Image:** `python:3.11-slim`
- **Multi-stage Build:** Yes (base → deps → runner)
- **Security:** Non-root user (appuser)
- **Health Check:** Built-in
- **Port:** 8000

## Environment Variables

### Required Variables
- `JWT_SECRET`: Secret key for JWT token signing (minimum 32 characters)
- `OPENAI_API_KEY`: OpenAI API key for LLM provider

### Optional Variables
- `LLM_PROVIDER`: LLM provider (`openai` or `anthropic`, default: `openai`)
- `OPENAI_MODEL`: OpenAI model name (default: `gpt-3.5-turbo`)
- `ANTHROPIC_API_KEY`: Anthropic API key (if using Anthropic)
- `ANTHROPIC_MODEL`: Anthropic model name
- `DB_PASSWORD`: PostgreSQL password (default: `postgres`)
- `CORS_ORIGIN`: Allowed CORS origin (default: `http://localhost:3000`)

See `.env.example` for all available variables.

## Database Setup

The database is automatically initialized with:
1. Schema creation (`schema.sql`)
2. Index creation (`indexing.sql`)
3. Sample data (`data.sql`)

These scripts run automatically when the PostgreSQL container starts for the first time.

### Accessing the Database

```bash
# Using docker-compose exec
docker-compose exec postgres psql -U postgres -d chatbot_db

# Using external client
psql -h localhost -p 5432 -U postgres -d chatbot_db
```

### Database Backups

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres chatbot_db > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres chatbot_db < backup.sql
```

## Troubleshooting

### Services Won't Start

1. **Check logs:**
   ```bash
   docker-compose logs
   ```

2. **Verify environment variables:**
   ```bash
   docker-compose config
   ```

3. **Check port availability:**
   ```bash
   # Check if ports are in use
   lsof -i :3000
   lsof -i :3001
   lsof -i :8000
   lsof -i :5432
   ```

### Database Connection Issues

1. **Wait for database to be ready:**
   ```bash
   docker-compose logs postgres
   # Look for "database system is ready to accept connections"
   ```

2. **Check database health:**
   ```bash
   docker-compose exec postgres pg_isready -U postgres
   ```

### Frontend Build Issues

1. **Clear Next.js cache:**
   ```bash
   docker-compose exec frontend rm -rf .next
   docker-compose restart frontend
   ```

2. **Rebuild frontend:**
   ```bash
   docker-compose build --no-cache frontend
   ```

### AI Service Issues

1. **Verify API keys:**
   ```bash
   docker-compose exec ai-service env | grep API_KEY
   ```

2. **Check Python dependencies:**
   ```bash
   docker-compose exec ai-service pip list
   ```

## Production Deployment

### Security Considerations

1. **Change default passwords:**
   - Set strong `JWT_SECRET` (minimum 32 characters, use random generator)
   - Set strong `DB_PASSWORD`
   - Use secrets management (Docker secrets, Kubernetes secrets, etc.)

2. **Environment variables:**
   - Never commit `.env` file to version control
   - Use environment-specific `.env` files
   - Use secrets management in production

3. **Network security:**
   - Use reverse proxy (nginx, Traefik) for HTTPS
   - Restrict CORS origins to production domains
   - Use internal Docker networks (already configured)

4. **Image security:**
   - Regularly update base images
   - Scan images for vulnerabilities
   - Use non-root users (already configured)

### Production Docker Compose

For production, consider:
- Using Docker Swarm or Kubernetes
- Setting up proper logging (ELK stack, etc.)
- Implementing monitoring (Prometheus, Grafana)
- Using managed database services
- Setting up CI/CD pipelines
- Using image registries for distribution

## Development Workflow

### Hot Reload (Development)

For development with hot reload, you may want to mount volumes:

```yaml
# Add to docker-compose.yml for development
volumes:
  - ./chatbot-frontend:/app
  - /app/node_modules
  - /app/.next
```

Then run:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Running Tests in Containers

```bash
# Frontend tests
docker-compose exec frontend npm test

# Backend tests
docker-compose exec backend npm test

# AI service tests
docker-compose exec ai-service pytest
```

## Cleanup

### Remove Everything
```bash
# Stop and remove containers, networks, and volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Prune system (careful!)
docker system prune -a
```

### Remove Specific Service
```bash
docker-compose stop frontend
docker-compose rm frontend
```

## Performance Optimization

1. **Use multi-stage builds** (already implemented)
2. **Layer caching:** Dependencies are cached separately
3. **Alpine images:** Smaller base images
4. **Health checks:** Automatic service recovery
5. **Resource limits:** Set in production

## Monitoring

### Container Stats
```bash
docker stats
```

### Service Health
```bash
# Check all health endpoints
curl http://localhost:3001/health
curl http://localhost:8000/health
```

## Support

For issues or questions:
1. Check service logs: `docker-compose logs`
2. Verify environment variables: `docker-compose config`
3. Check service status: `docker-compose ps`
4. Review this documentation

