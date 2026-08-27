from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_v1_auth_and_user_foundation():
    payload = {"email": "phase4-user@example.com", "password": "Password1!", "display_name": "Phase Four User"}
    register = client.post('/api/v1/auth/register', json=payload)
    assert register.status_code == 201, register.text

    login = client.post('/api/v1/auth/login', json=payload)
    assert login.status_code == 200, login.text
    access_token = login.json()['tokens']['access_token']

    headers = {'Authorization': f'Bearer {access_token}'}

    me = client.get('/api/v1/users/me', headers=headers)
    assert me.status_code == 200, me.text

    patch_me = client.patch('/api/v1/users/me', json={'display_name': 'Updated Friday User', 'country': 'US'}, headers=headers)
    assert patch_me.status_code == 200, patch_me.text

    prefs = client.get('/api/v1/users/me/preferences', headers=headers)
    assert prefs.status_code == 200, prefs.text

    patch_prefs = client.patch('/api/v1/users/me/preferences', json={'theme_preference': 'light'}, headers=headers)
    assert patch_prefs.status_code == 200, patch_prefs.text


def test_v1_read_only_collection_endpoints():
    payload = {"email": "phase4-reader@example.com", "password": "Password1!", "display_name": "Phase Four Reader"}
    register = client.post('/api/v1/auth/register', json=payload)
    assert register.status_code == 201, register.text

    login = client.post('/api/v1/auth/login', json=payload)
    assert login.status_code == 200, login.text
    access_token = login.json()['tokens']['access_token']

    headers = {'Authorization': f'Bearer {access_token}'}

    assets = client.get('/api/v1/assets?q=BTC', headers=headers)
    assert assets.status_code == 200, assets.text

    asset_search = client.get('/api/v1/assets/search', params={'q': 'BTC'}, headers=headers)
    assert asset_search.status_code == 200, asset_search.text

    plans = client.get('/api/v1/subscriptions/plans', headers=headers)
    assert plans.status_code == 200, plans.text

    portfolio = client.get('/api/v1/portfolio/summary', headers=headers)
    assert portfolio.status_code == 200, portfolio.text


def test_v1_domain_routes_require_authentication():
    protected_routes = [
        '/api/v1/users/me',
        '/api/v1/assets',
        '/api/v1/watchlists',
        '/api/v1/portfolio',
        '/api/v1/paper-trading/account',
        '/api/v1/journal',
        '/api/v1/alerts/rules',
        '/api/v1/notifications',
        '/api/v1/subscriptions/me',
    ]
    for route in protected_routes:
        response = client.get(route)
        assert response.status_code == 401, (route, response.status_code, response.text)
