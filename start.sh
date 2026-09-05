#!/usr/bin/env bash
set -e

echo "=== CoinCrest Backend Startup ==="

if [ -f "/opt/render/project/src/.venv/bin/python" ]; then
    PYTHON_BIN="/opt/render/project/src/.venv/bin/python"
elif [ -n "$VIRTUAL_ENV" ] && [ -f "$VIRTUAL_ENV/bin/python" ]; then
    PYTHON_BIN="$VIRTUAL_ENV/bin/python"
elif [ -f ".venv/bin/python" ]; then
    PYTHON_BIN=".venv/bin/python"
else
    PYTHON_BIN="$(command -v python3 || command -v python)"
fi

echo "Using Python: $PYTHON_BIN"
"$PYTHON_BIN" --version
echo "PORT: ${PORT:-10000}"

export PYTHONPATH="/opt/render/project/src:.:${PYTHONPATH:-}"

echo "Checking required Python packages..."
"$PYTHON_BIN" -c "import fastapi, uvicorn, alembic; print('FastAPI / Uvicorn / Alembic: OK')"

echo "Checking database migrations..."
if "$PYTHON_BIN" -m alembic upgrade head; then
    echo "Database migrations applied / up-to-date."
elif "$PYTHON_BIN" -c "import database.init_db" >/dev/null 2>&1; then
    echo "Alembic not configured or failed; executing database.init_db fallback..."
    "$PYTHON_BIN" -m database.init_db
else
    echo "No database migration module found; skipping."
fi

echo "Starting CoinCrest backend..."

if [ -f "run.py" ]; then
    exec "$PYTHON_BIN" run.py
else
    exec "$PYTHON_BIN" -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-10000}" --proxy-headers --forwarded-allow-ips="*"
fi
