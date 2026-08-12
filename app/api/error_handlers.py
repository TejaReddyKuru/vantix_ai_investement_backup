from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from loguru import logger

from app.core.exceptions import APIError


def format_error(request_id: str | None, code: str, message: str) -> dict[str, object]:
    return {
        "error": {
            "code": code,
            "message": message,
            "request_id": request_id or "",
        }
    }


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)
    # Preserve backward-compatible 'detail' top-level key while keeping the
    # standardized 'error' structure to avoid breaking tests and clients.
    content = format_error(request_id, "http_error", str(exc.detail) if exc.detail else "HTTP error")
    # Ensure tests and external clients that expect FastAPI's default 'detail'
    # key still receive it alongside the standardized error envelope.
    detail_value = str(exc.detail) if exc.detail else "HTTP error"
    response_body = {"detail": detail_value, **content}
    return JSONResponse(
        status_code=exc.status_code,
        content=response_body,
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)
    message = "Validation error"
    if exc.errors():
        message = exc.errors()[0].get("msg", message)
    return JSONResponse(
        status_code=422,
        content=format_error(request_id, "validation_error", message),
    )


async def api_error_handler(request: Request, exc: APIError) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)
    return JSONResponse(
        status_code=400,
        content=format_error(request_id, exc.__class__.__name__, str(exc)),
    )


async def unexpected_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)
    logger.exception("Unhandled exception [request_id=%s]", request_id)
    return JSONResponse(
        status_code=500,
        content=format_error(request_id, "internal_server_error", "An unexpected error occurred."),
    )
