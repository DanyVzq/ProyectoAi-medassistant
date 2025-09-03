
import os
import uuid
from datetime import datetime, timedelta, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
import redis

JWT_SECRET = os.getenv("JWT_SECRET", "dev_super_secret")
ACCESS_TTL_MIN = int(os.getenv("ACCESS_TTL_MIN", "60"))
REFRESH_TTL_MIN = int(os.getenv("REFRESH_TTL_MIN", "43200"))
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174").split(",")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

r = redis.Redis.from_url(REDIS_URL, decode_responses=True)

app = Flask(__name__)
CORS(app, origins=ALLOWED_ORIGINS, supports_credentials=False)

USERS = {
    "medico@clinica.com": {"name": "Dr. Demo", "role": "practitioner", "password_hash": generate_password_hash("123456")},
    "admin@clinica.com": {"name": "Admin Demo", "role": "admin", "password_hash": generate_password_hash("123456")},
}

def now_utc():
    return datetime.now(timezone.utc)

def make_token(sub: str, role: str, ttl_min: int, typ: str):
    jti = str(uuid.uuid4())
    exp = now_utc() + timedelta(minutes=ttl_min)
    payload = {"sub": sub, "role": role, "jti": jti, "type": typ, "exp": exp, "iat": now_utc()}
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return token, jti, int(ttl_min * 60)

def allow_access(jti: str, seconds: int): r.setex(f"jwt:allow:{jti}", seconds, "1")
def allow_refresh(jti: str, seconds: int): r.setex(f"rt:allow:{jti}", seconds, "1")
def is_access_allowed(jti: str) -> bool: return r.exists(f"jwt:allow:{jti}") == 1
def is_refresh_allowed(jti: str) -> bool: return r.exists(f"rt:allow:{jti}") == 1
def revoke_access(jti: str): r.delete(f"jwt:allow:{jti}")
def revoke_refresh(jti: str): r.delete(f"rt:allow:{jti}")
def decode_token(token: str): return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

def parse_auth_header():
    auth = request.headers.get("Authorization", "")
    parts = auth.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return None

@app.get("/health")
def health():
    try: pong = r.ping()
    except Exception: pong = False
    return {"status":"ok","redis":pong,"time":now_utc().isoformat()}

@app.post("/auth/login")
def login():
    try: data = request.get_json(force=True) or {}
    except Exception: return jsonify({"message":"Bad JSON"}), 400

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    user = USERS.get(email)
    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"message":"Credenciales inválidas"}), 401

    access, aj, asec = make_token(email, user["role"], ACCESS_TTL_MIN, "access")
    refresh, rj, rsec = make_token(email, user["role"], REFRESH_TTL_MIN, "refresh")
    allow_access(aj, asec); allow_refresh(rj, rsec)

    return jsonify({"access": access, "refresh": refresh, "user": {"email": email, "name": user["name"], "role": user["role"]}})

@app.post("/auth/refresh")
def refresh():
    token = parse_auth_header()
    if not token: return jsonify({"message":"Missing Authorization: Bearer <refresh>"}), 401
    try: payload = decode_token(token)
    except jwt.ExpiredSignatureError: return jsonify({"message":"Refresh token expirado"}), 401
    except Exception: return jsonify({"message":"Token inválido"}), 401

    if payload.get("type") != "refresh": return jsonify({"message":"No es un refresh token"}), 400

    jti = payload.get("jti")
    if not is_refresh_allowed(jti): return jsonify({"message":"Refresh revocado/no permitido"}), 401

    sub = payload.get("sub"); role = payload.get("role","practitioner")
    revoke_refresh(jti)
    new_refresh, new_rj, rsec = make_token(sub, role, REFRESH_TTL_MIN, "refresh"); allow_refresh(new_rj, rsec)
    access, aj, asec = make_token(sub, role, ACCESS_TTL_MIN, "access"); allow_access(aj, asec)
    return jsonify({"access": access, "refresh": new_refresh})

@app.post("/auth/logout")
def logout():
    token = parse_auth_header()
    if not token: return jsonify({"message":"Missing Authorization: Bearer <token>"}), 401
    try: payload = decode_token(token)
    except Exception: return jsonify({"message":"Token inválido"}), 401
    typ = payload.get("type"); jti = payload.get("jti")
    if typ == "access": revoke_access(jti)
    elif typ == "refresh": revoke_refresh(jti)
    else: revoke_access(jti); revoke_refresh(jti)
    return jsonify({"message":"OK"})

@app.get("/auth/me")
def me():
    token = parse_auth_header()
    if not token: return jsonify({"message":"Missing Authorization"}), 401
    try: payload = decode_token(token)
    except jwt.ExpiredSignatureError: return jsonify({"message":"Token expirado"}), 401
    except Exception: return jsonify({"message":"Token inválido"}), 401
    if payload.get("type") != "access": return jsonify({"message":"Usa un access token"}), 400
    if not is_access_allowed(payload.get("jti")): return jsonify({"message":"Token revocado/no permitido"}), 401
    return jsonify({"sub": payload.get("sub"), "role": payload.get("role"), "jti": payload.get("jti"), "exp": payload.get("exp")})

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8080"))
    app.run(host="0.0.0.0", port=port, debug=True)
