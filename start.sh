#!/usr/bin/env bash
set -e

export PYTHONPATH="/opt/render/project/src:."
PORT="${PORT:-10000}"

echo "[CoinCrest] Starting backend server on 0.0.0.0:${PORT}..."
exec python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT}"
