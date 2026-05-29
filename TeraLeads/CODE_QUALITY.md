# Code Quality Standards

This document outlines the code quality standards and best practices for the AI Chatbot Appointment Booking System.

## Code Structure

### Modularity
- Code is organized into small, reusable components and functions
- Each module has a single, well-defined responsibility (Single Responsibility Principle)
- Clear separation of concerns between layers:
  - **Frontend**: UI components, state management, API clients
  - **Backend**: Routes, controllers, services, models
  - **AI Service**: Conversation management, LLM integration, flows

### File Organization
- Consistent directory structure across all repositories
- Related files grouped together
- Clear naming conventions for files and directories

## Documentation

### Code Comments
- **Functions**: All functions have JSDoc/docstring comments explaining:
  - Purpose and behavior
  - Parameters with types and descriptions
  - Return values
  - Example usage (where applicable)
  - Error conditions

- **Classes**: All classes have docstrings explaining:
  - Purpose and responsibility
  - Key methods and their usage
  - Example usage

- **Complex Logic**: Non-obvious code sections have inline comments explaining:
  - Why certain decisions were made
  - Algorithm explanations
  - Security considerations

### API Documentation
- Backend: Swagger/OpenAPI documentation available at `/api-docs`
- AI Service: FastAPI automatically generates OpenAPI docs at `/docs`
- All endpoints documented with request/response schemas

## Naming Conventions

### JavaScript/TypeScript
- **Variables & Functions**: `camelCase`
- **Classes**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Files**: `kebab-case` or `camelCase` matching the export

### Python
- **Variables & Functions**: `snake_case`
- **Classes**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Files**: `snake_case`

### Database
- **Tables**: `snake_case` (plural)
- **Columns**: `snake_case`
- **Indexes**: `idx_<table>_<column>`

## Error Handling

### Frontend
- Custom error classes (`AuthenticationError`, `ChatbotError`)
- User-friendly error messages
- Proper error propagation with context
- Error boundaries for React components

### Backend
- Custom error classes with status codes
- Centralized error handling middleware
- Generic error messages in production (prevents information leakage)
- Detailed error logging for debugging
- Proper HTTP status codes

### AI Service
- Try-catch blocks around all async operations
- Validation errors return 400 status
- Internal errors return 500 with generic messages
- Comprehensive error logging

## Logging

### Best Practices
- Log all API requests with context (user ID, IP, path)
- Log errors with stack traces (development only)
- Never log sensitive data (passwords, tokens, API keys)
- Use structured logging (JSON format)
- Different log levels: INFO, WARN, ERROR, DEBUG

### What to Log
- ✅ API requests and responses (without sensitive data)
- ✅ Authentication events (login, signup, token generation)
- ✅ Errors and exceptions
- ✅ Critical business events (appointment creation, etc.)

### What NOT to Log
- ❌ Passwords or password hashes
- ❌ JWT tokens or API keys
- ❌ Full request bodies with sensitive data
- ❌ Personal identifiable information (PII) unless necessary

## Security

### Authentication
- JWT tokens with expiration (24h for user tokens, 15m for chatbot tokens)
- Secure password hashing (bcrypt with 10 salt rounds)
- Token verification on all protected routes
- Generic error messages to prevent user enumeration

### Input Validation
- All user inputs validated and sanitized
- Email format validation
- Password strength requirements
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)

### Rate Limiting
- Chatbot token generation: 5 requests per 15 minutes
- Chat messages: 30 requests per minute
- Configurable limits per endpoint

### Data Protection
- Passwords never stored in plain text
- Sensitive data redacted in logs
- HTTPS required in production
- CORS configured appropriately

## Testing

### Test Coverage
- Unit tests for all services and utilities
- Integration tests for API endpoints
- Test coverage target: 80%+

### Test Structure
- Tests organized by feature/component
- Clear test descriptions
- Arrange-Act-Assert pattern
- Mock external dependencies

### Running Tests
```bash
# Frontend
cd chatbot-frontend && npm test

# Backend
cd chatbot-backend && npm test

# AI Service
cd chatbot-ai && pytest
```

## Performance

### Database
- Indexes on frequently queried columns
- Composite indexes for multi-column queries
- GIN indexes for JSONB fields
- Connection pooling

### API
- Efficient query patterns
- Avoid N+1 query problems
- Response caching where appropriate
- Rate limiting to prevent abuse

### Frontend
- Code splitting
- Lazy loading
- Optimized bundle sizes
- Efficient state management

## Linting and Formatting

### JavaScript/TypeScript
- ESLint with Next.js and TypeScript rules
- Consistent code style enforced
- Auto-fix available: `npm run lint:fix`

### Python
- Pylint for code quality
- Consistent naming and formatting
- Type hints where applicable

## Code Review Checklist

Before merging code, ensure:

- [ ] Code follows naming conventions
- [ ] Functions have proper documentation
- [ ] Error handling is comprehensive
- [ ] Security considerations addressed
- [ ] Tests written and passing
- [ ] No sensitive data in logs or code
- [ ] Linting passes
- [ ] Performance considerations addressed
- [ ] Database queries are optimized
- [ ] API responses are properly formatted

## Continuous Improvement

- Regular code reviews
- Refactoring when needed
- Updating dependencies
- Monitoring and logging improvements
- Performance optimization
- Security audits

