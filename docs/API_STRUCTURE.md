# Friday API Structure

## Versioning

All market API routes are exposed under `/api/v1/market`.
Legacy `/market` routes remain available for compatibility.

## Public endpoints

### Health

- `GET /health`
- `GET /health/live`
- `GET /health/ready`

### Market analysis

- `GET /api/v1/market/analyze/{symbol}`
  - Returns a full market intelligence response for the requested symbol.
- `GET /api/v1/market/summary/{symbol}`
  - Returns a short analysis summary.
- `GET /api/v1/market/score/{symbol}`
  - Returns market score and confidence.

## Input rules

- `symbol` must be a ticker symbol with 3 to 12 alphanumeric characters.
- Invalid symbols are rejected with a structured validation error.

## Error format

Errors follow a unified JSON structure:

```json
{
  "error": {
    "code": "...",
    "message": "...",
    "request_id": "..."
  }
}
```
