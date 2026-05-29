# Database Schema

## Entity Relationship Diagram

```
users (1) ----< appointments (N)
users (1) ----< chat_sessions (N)
appointments (1) ----< chat_sessions (N)  [optional link]
businesses (1) ----< appointments (N)
businesses (1) ----< chat_sessions (N)
```

## Tables

- **users**: User accounts and authentication
- **businesses**: Multi-tenancy; optional business context
- **appointments**: Appointment records linked to users and optional business
- **chat_sessions**: Chat logs; optionally linked to appointments when booking via chat

## Index Strategy

- Foreign keys indexed for fast joins
- Composite `(user_id, date)` for user appointments by date
- Partial index on `(date, time) WHERE status IN ('pending','confirmed')` for availability
- GIN index on `messages` (JSONB) for JSON queries

## Migration Workflow

1. Create migration: `npm run migrate:create <name>`
2. Run up: `npm run migrate:up`
3. Run down: `npm run migrate:down`
4. Status: `npm run migrate:status`

## Local Development

With Docker:

```bash
docker-compose up -d postgres
psql -h localhost -U postgres -d chatbot_db -f src/database/data.sql  # optional sample data
```

Without Docker:

```bash
createdb chatbot_db
psql -d chatbot_db -f src/database/schema.sql
psql -d chatbot_db -f src/database/indexing.sql
psql -d chatbot_db -f src/database/data.sql  # optional
```

## Scalability

- **Partitioning**: Consider RANGE partitioning `appointments` by `date` when rows exceed ~1M
- **Partitioning**: Consider RANGE partitioning `chat_sessions` by `created_at`
- **Sharding**: Shard by `business_id` or `user_id` for horizontal scaling
