# Chatbot Backend

Backend API for the AI Chatbot Appointment Booking System built with Node.js and Express.

## Features

- RESTful API endpoints with comprehensive documentation
- JWT-based authentication with secure token management
- PostgreSQL database integration with optimized queries
- Request validation and rate limiting
- Comprehensive logging with sensitive data sanitization
- Error handling middleware with proper error responses
- Security best practices (SQL injection prevention, input validation)
- API documentation with Swagger/OpenAPI

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up PostgreSQL database:
```bash
# Create database
createdb chatbot_db

# Run schema
psql -d chatbot_db -f src/database/schema.sql

# Run indexes
psql -d chatbot_db -f src/database/indexing.sql

# (Optional) Insert sample data
psql -d chatbot_db -f src/database/data.sql
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chatbot_db
DB_USER=postgres
DB_PASSWORD=postgres
AI_SERVICE_URL=http://localhost:8000
CORS_ORIGIN=http://localhost:3000
```

### Development

Run the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3001`

### Production

Run the production server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
  - Body: `{ email, password, name }`
  - Returns: `{ token, user: { id, email, name } }`

- `POST /api/auth/login` - User login
  - Body: `{ email, password }`
  - Returns: `{ token, user: { id, email, name } }`

### Chatbot
- `POST /api/chatbot/token` - Generate chatbot access token (requires auth)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ token }` (short-lived, 15 minutes)

- `POST /api/chatbot/message` - Send chat message (requires auth)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ sessionId, message }`
  - Returns: `{ message, sessionId }`

### Health Check
- `GET /health` - Server health status

### API Documentation
- `GET /api-docs` - Swagger UI (development only)

## Project Structure

```
src/
├── config/          # Configuration files (database, etc.)
├── routes/          # API route definitions
│   ├── index.js     # Main router
│   ├── auth.routes.js
│   ├── chatbot.routes.js
│   └── swagger.js   # API documentation setup
├── controllers/     # Request handlers
│   ├── auth.controller.js
│   └── chatbot.controller.js
├── services/        # Business logic layer
│   ├── auth.service.js
│   ├── appointment.service.js
│   └── chatbot.service.js
├── middlewares/     # Express middlewares
│   ├── auth.middleware.js      # JWT verification
│   ├── validation.middleware.js
│   ├── logging.middleware.js
│   ├── rateLimit.middleware.js
│   └── errorHandler.middleware.js
├── models/          # Database models (ORM-like layer)
│   ├── User.js
│   ├── Appointment.js
│   └── ChatSession.js
├── utils/           # Utility functions
│   ├── jwt.js       # JWT token management
│   └── logger.js    # Logging utility
└── database/        # SQL schema and migrations
    ├── schema.sql   # Database schema
    ├── data.sql     # Sample data
    └── indexing.sql # Performance indexes
```

## Security Features

- **JWT Authentication**: Secure token-based authentication with expiration
- **Password Hashing**: bcrypt with 10 salt rounds
- **SQL Injection Prevention**: All queries use parameterized statements
- **Rate Limiting**: Prevents abuse of API endpoints
- **Input Validation**: Comprehensive validation middleware
- **Error Sanitization**: Prevents information leakage in error messages
- **CORS Configuration**: Configurable cross-origin resource sharing

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

Watch mode:
```bash
npm run test:watch
```

## Linting

Check code style:
```bash
npm run lint
```

Auto-fix issues:
```bash
npm run lint:fix
```

## Code Quality

- **ESLint**: Code linting with recommended rules
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Logging**: Structured logging with sensitive data sanitization
- **Documentation**: JSDoc comments for all functions and classes
- **Type Safety**: Consistent parameter validation

## Database Schema

The database includes three main tables:

- **users**: User accounts and authentication
  - Indexed on `email` for fast lookups
  - Password hashes stored securely

- **appointments**: Appointment records
  - Indexed on `user_id`, `date`, and `status`
  - Composite index on `(user_id, date)` for common queries

- **chat_sessions**: Conversation logs and metadata
  - GIN index on JSONB `messages` field for efficient queries
  - Indexed on `user_id` and `created_at`

See `src/database/schema.sql` for the complete schema definition.

## Performance Considerations

- Database indexes on frequently queried fields
- Connection pooling for PostgreSQL
- Rate limiting to prevent abuse
- Efficient query patterns with parameterized statements

## Technologies

- **Express.js**: Web framework
- **PostgreSQL**: Relational database
- **JWT (jsonwebtoken)**: Authentication tokens
- **bcryptjs**: Password hashing
- **express-rate-limit**: Rate limiting middleware
- **CORS**: Cross-origin resource sharing

## Deployment

1. Set environment variables in production
2. Use a strong JWT_SECRET (at least 32 characters)
3. Configure CORS_ORIGIN to your frontend domain
4. Set up PostgreSQL connection pooling
5. Enable HTTPS in production
6. Set up monitoring and logging
7. Configure rate limits appropriately for your use case

