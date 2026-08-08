# Vish Capitals Security Foundation

This repository phase establishes safe defaults and a secure foundation for Friday.

## Repository hygiene

- `.env` is excluded from version control.
- `.env.example` documents required environment variables without secrets.
- Sensitive directories and runtime artifacts are ignored in `.gitignore`.

## Configuration safety

- Application configuration now uses typed settings via Pydantic.
- Production mode validates required secrets and database configuration.
- CORS origins are configured by environment and do not default to `*`.

## API security posture

- Health endpoints remain public.
- Market analysis is versioned to `/api/v1/market/...`.
- Symbol input is validated strictly.
- Error responses are structured and do not expose internal stack traces or secrets.

## Logging

- Request IDs are added to responses via `X-Request-ID`.
- Logger output is explicit and avoids secret content.

## Database security

- Database connection is configured using `DATABASE_URL`.
- SQLAlchemy is prepared for both SQLite and PostgreSQL.
