import asyncio

import pytest
from fastapi.testclient import TestClient

from app.core.security import create_access_token, hash_password, verify_password
from app.main import app
from app.models.user import User
from database.session import AsyncSessionLocal

client = TestClient(app)


def test_registration_and_login_flow():
    email = 'auth-user@example.com'
    payload = {'email': email, 'password': 'Password1!', 'display_name': 'Auth User'}

    register = client.post('/api/v1/auth/register', json=payload)
    assert register.status_code == 201, register.text
    body = register.json()
    assert body['user']['email'] == email

    login = client.post('/api/v1/auth/login', json=payload)
    assert login.status_code == 200, login.text
    tokens = login.json()['tokens']
    assert tokens['access_token']
    assert tokens['refresh_token']

    me = client.get(
        '/api/v1/auth/me',
        headers={'Authorization': f"Bearer {tokens['access_token']}"},
    )
    assert me.status_code == 200, me.text
    assert me.json()['user']['email'] == email


def test_duplicate_email_rejected():
    payload = {'email': 'duplicate@example.com', 'password': 'Password1!', 'display_name': 'Dup'}
    first = client.post('/api/v1/auth/register', json=payload)
    assert first.status_code == 201

    second = client.post('/api/v1/auth/register', json=payload)
    assert second.status_code == 409, second.text


def test_refresh_and_logout_flow():
    payload = {'email': 'refresh@example.com', 'password': 'Password1!', 'display_name': 'Refresh User'}
    register = client.post('/api/v1/auth/register', json=payload)
    assert register.status_code == 201

    login = client.post('/api/v1/auth/login', json=payload)
    assert login.status_code == 200
    tokens = login.json()['tokens']

    refresh = client.post('/api/v1/auth/refresh', json={'refresh_token': tokens['refresh_token']})
    assert refresh.status_code == 200, refresh.text
    new_tokens = refresh.json()['tokens']
    assert new_tokens['access_token']

    logout = client.post(
        '/api/v1/auth/logout',
        json={'refresh_token': new_tokens['refresh_token']},
        headers={'Authorization': f"Bearer {new_tokens['access_token']}"},
    )
    assert logout.status_code == 200, logout.text
    assert logout.json()['message'] == 'Logged out successfully.'


def test_password_hashing_and_validation():
    hashed = hash_password('Password1!')
    assert verify_password('Password1!', hashed)
    assert not verify_password('Password2!', hashed)

    with pytest.raises(ValueError):
        hash_password('short')


def test_admin_route_requires_staff_user():
    async def seed_admin_user():
        async with AsyncSessionLocal() as session:
            user = User(email='admin@example.com', password_hash=hash_password('Password1!'), is_staff=True, is_active=True)
            session.add(user)
            await session.commit()
            await session.refresh(user)
            return str(user.id)

    user_id = asyncio.run(seed_admin_user())
    token = create_access_token(user_id)

    response = client.get('/api/v1/auth/admin/health', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200, response.text
    assert response.json()['status'] == 'ok'

    response_no_access = client.get('/api/v1/auth/admin/health')
    assert response_no_access.status_code == 401, response_no_access.text
