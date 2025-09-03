
# AI‑MedAssistant — Backend de Login con Redis (Flask)

## Endpoints
- POST /auth/login  -> devuelve { access, refresh, user }
- POST /auth/refresh (Authorization: Bearer <refresh>)
- POST /auth/logout  (Authorization: Bearer <access|refresh>)
- GET  /auth/me      (Authorization: Bearer <access>)
- GET  /health

## Variables (.env o env del sistema)
PORT=8080
JWT_SECRET=change_me
ACCESS_TTL_MIN=60
REFRESH_TTL_MIN=43200
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
REDIS_URL=redis://localhost:6379/0

## Redis con Docker
docker run --name aimed-redis -p 6379:6379 -d redis:7

## Ejecutar (Windows)
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
set REDIS_URL=redis://localhost:6379/0
set JWT_SECRET=dev_secret
python app.py
