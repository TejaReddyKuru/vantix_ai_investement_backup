# Vish Capitals Development Setup

## Prerequisites

- Python 3.10+
- `pip` installed
- Local virtual environment recommended

## Install dependencies

Use the pinned dependency file:

```bash
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
.venv\Scripts\activate    # Windows
pip install -r requirements.txt
```

## Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with the required values for your environment.

## Database initialization

Use the database initializer to create local SQLite schema:

```bash
python database/init_db.py
```

## Run locally

```bash
uvicorn app.main:app --reload
```

## Health and API verification

- `GET /health`
- `GET /health/live`
- `GET /health/ready`
- `GET /api/v1/market/analyze/BTCUSDT`
- `GET /api/v1/market/summary/BTCUSDT`
- `GET /api/v1/market/score/BTCUSDT`
