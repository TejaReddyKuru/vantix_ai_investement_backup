#!/usr/bin/env bash

PYTHON_BIN="$(which python3 || which python)"

echo "=== CoinCrest Startup Diagnostics ==="
echo "Using Python: $PYTHON_BIN"
echo "PORT: ${PORT:-10000}"
echo "PWD: $(pwd)"

export PYTHONPATH="/opt/render/project/src:."
PORT="${PORT:-10000}"

echo "Starting Uvicorn on 0.0.0.0:$PORT..."
exec "$PYTHON_BIN" -m uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --log-level info
