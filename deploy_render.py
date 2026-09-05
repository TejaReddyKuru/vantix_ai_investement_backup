import httpx
import json
import secrets
from dotenv import dotenv_values

env = dotenv_values('.env')

# Generate strong secrets
jwt_secret = secrets.token_hex(32)
encryption_key = secrets.token_hex(32)

env_vars = [
    {'key': 'DATABASE_URL', 'value': env.get('DATABASE_URL')},
    {'key': 'OPENAI_API_KEY', 'value': env.get('OPENAI_API_KEY')},
    {'key': 'LLM_BASE_URL', 'value': env.get('LLM_BASE_URL')},
    {'key': 'LLM_MODEL', 'value': env.get('LLM_MODEL')},
    {'key': 'ALPHA_VANTAGE_API_KEY', 'value': env.get('ALPHA_VANTAGE_API_KEY')},
    {'key': 'BINANCE_API_KEY', 'value': env.get('BINANCE_API_KEY') or ''},
    {'key': 'BINANCE_API_SECRET', 'value': env.get('BINANCE_API_SECRET') or ''},
    {'key': 'BINANCE_API_BASE_URL', 'value': env.get('BINANCE_API_BASE_URL')},
    {'key': 'JWT_SECRET', 'value': jwt_secret},
    {'key': 'ENCRYPTION_KEY', 'value': encryption_key},
    {'key': 'CORS_ALLOWED_ORIGINS', 'value': 'https://vantix-ai-investement-backup.vercel.app'}, # placeholder, will update later
    {'key': 'ENV', 'value': 'production'},
]

payload = {
    "type": "web_service",
    "name": "coincrest-backend",
    "ownerId": "tea-d7s72fvlk1mc73dik640",
    "repo": "https://github.com/TejaReddyKuru/vantix_ai_investement_backup",
    "autoDeploy": "yes",
    "branch": "main",
    "envVars": env_vars,
    "serviceDetails": {
        "env": "python",
        "region": "oregon",
        "plan": "free",
        "envSpecificDetails": {
            "buildCommand": "pip install -r requirements.txt",
            "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
        }
    }
}

headers = {
    'Authorization': 'Bearer rnd_g7mzIpbZUSJ7Ibaaxs91DEz6IodA',
    'Accept': 'application/json',
    'Content-Type': 'application/json'
}

response = httpx.post('https://api.render.com/v1/services', headers=headers, json=payload)
if response.status_code == 201:
    data = response.json()
    print("Service created successfully!")
    print("URL:", data['service']['serviceDetails']['url'])
    print("Service ID:", data['service']['id'])
else:
    print("Failed to create service:", response.status_code)
    print(response.text)
