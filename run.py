import os
import sys
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("coincrest")

if __name__ == "__main__":
    port_str = os.environ.get("PORT", "10000")
    try:
        port = int(port_str)
    except ValueError:
        port = 10000

    logger.info(f"Starting CoinCrest API server on 0.0.0.0:{port}...")
    logger.info(f"Environment: {os.environ.get('ENV', 'development')}")

    try:
        from app.main import app
        logger.info("Successfully loaded FastAPI app.")
        import uvicorn
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=port,
            loop="asyncio",
            log_level="info",
            proxy_headers=True,
            forwarded_allow_ips="*",
            timeout_keep_alive=30,
        )
    except Exception as e:
        logger.exception(f"Fatal server failure: {e}")
        sys.exit(1)
