from fastapi.testclient import TestClient

from app.main import app


def test_api_versioning_and_symbol_validation() -> None:
    client = TestClient(app)

    response = client.get('/api/v1/market/analyze/BTCUSDT')
    assert response.status_code == 200
    assert response.json()['symbol'] == 'BTCUSDT'

    response = client.get('/api/v1/market/analyze/ab')
    assert response.status_code == 422
    assert response.json()['error']['code'] == 'validation_error'

    response = client.get('/api/v1/market/analyze/BTC USDT')
    assert response.status_code == 422
    assert response.json()['error']['code'] == 'validation_error'
