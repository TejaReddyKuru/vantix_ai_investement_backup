import os
import sys
import uvicorn

if __name__ == "__main__":
    port_str = os.environ.get("PORT", "10000")
    try:
        port = int(port_str)
    except ValueError:
        port = 10000

    print(f"[CoinCrest] Starting server on 0.0.0.0:{port} in {os.environ.get('ENV', 'development')} mode...", flush=True)
    try:
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=port,
            log_level="info",
            proxy_headers=True,
            forwarded_allow_ips="*",
        )
    except Exception as e:
        print(f"[CoinCrest] Fatal server error: {e}", file=sys.stderr, flush=True)
        sys.exit(1)
