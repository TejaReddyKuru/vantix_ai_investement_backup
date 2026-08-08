import sys

from loguru import logger

logger.remove()
logger.add(
    sys.stdout,
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {extra[component]} | {extra[request_id]} | {message}",
    level="INFO",
    backtrace=False,
    diagnose=False,
)


def get_logger(name: str):
    return logger.bind(component=name, request_id="-")
