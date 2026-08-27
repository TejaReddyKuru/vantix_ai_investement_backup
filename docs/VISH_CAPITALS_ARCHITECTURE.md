# Vish Capitals / Friday Architecture

This repository is the Phase 1 foundation for the Friday crypto trading intelligence platform.

## Current structure

- `app/`: application package containing API routing, configuration, logging, and analytics.
  - `app/main.py`: FastAPI application entrypoint.
  - `app/api/`: request handlers and versioned API routing.
  - `app/core/`: configuration, logger, and domain exceptions.
  - `app/agents/market_analysis/`: reusable market analysis pipeline and analysis modules.
  - `app/services/`: service abstractions and the Binance-backed market data provider.
- `database/`: SQLAlchemy async database configuration, session factory, and initialization support.
- `static/`: vanilla HTML/CSS/JavaScript demo UI.
- `tests/`: pytest suite for API, configuration, and pipeline validation.
- `docs/`: implementation documentation and audit reports.

## Phase 1 focus

- Strengthen repository hygiene and security.
- Build a stable configuration system.
- Establish database foundation with SQLite for development and PostgreSQL compatibility for production.
- Clean up service-layer abstractions without changing the existing market-analysis behavior.
- Harden API versioning, CORS, and error handling.
