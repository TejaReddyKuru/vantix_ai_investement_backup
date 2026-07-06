from loguru import logger

logger.remove()
logger.add(lambda msg: print(msg, end=""), format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}", level="INFO")


def get_logger(name: str):
    return logger.bind(component=name)
