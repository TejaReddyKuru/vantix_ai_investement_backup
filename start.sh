#!/usr/bin/env bash
set -e

if [ -f "/opt/render/project/src/.venv/bin/activate" ]; then
    . /opt/render/project/src/.venv/bin/activate
elif [ -f "$VIRTUAL_ENV/bin/activate" ]; then
    . "$VIRTUAL_ENV/bin/activate"
fi

export PYTHONPATH="/opt/render/project/src:."
PORT="${PORT:-10000}"

echo "[CoinCrest] Starting uvicorn on port $PORT..."
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
