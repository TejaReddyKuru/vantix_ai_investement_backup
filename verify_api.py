from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
health = client.get('/health')
print('health_status', health.status_code, health.json())
response = client.get('/market/analyze/BTCUSDT')
print('analyze_status', response.status_code)
print(response.json().keys())
print(response.json())
