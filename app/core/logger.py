import sys
from loguru import logger


def log_format(record):
    component = record["extra"].get("component", "system")
    request_id = record["extra"].get("request_id", "-")
    record["extra"]["component"] = component
    record["extra"]["request_id"] = request_id
    return "{time:YYYY-MM-DD HH:mm:ss} | {level} | {extra[component]} | {extra[request_id]} | {message}\n"


logger.remove()
logger.add(
    sys.stdout,
    format=log_format,
    level="INFO",
    backtrace=False,
    diagnose=False,
)


def get_logger(name: str):
    return logger.bind(component=name, request_id="-")
