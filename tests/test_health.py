from fastapi.testclient import TestClient

from app.main import app


def test_health_routes() -> None:
    client = TestClient(app)

    response = client.get('/health')
    assert response.status_code == 200
    assert response.json() == {'status': 'ok'}

    response = client.get('/health/live')
    assert response.status_code == 200
    assert response.json() == {'status': 'alive'}

    response = client.get('/health/ready')
    assert response.status_code in (200, 503)
    assert 'status' in response.json()
