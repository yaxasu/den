from fastapi import Request, HTTPException
from jose import jwt, JWTError
from app.core.config import settings

# Supabase JWTs are signed with HS256 using this secret
JWT_SECRET = settings.SUPABASE_JWT_SECRET
JWT_ALGORITHM = "HS256"

def get_token_from_header(request: Request) -> str:
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    return auth.split(" ")[1]

def decode_jwt_token(token: str) -> dict:
    try:
        print("[JWT] Decoding token:", token[:12], "...")
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            options={"verify_aud": False},
        )
        print("[JWT] Payload:", payload)
        return payload
    except JWTError as e:
        print("[JWT] Decode error:", str(e))
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def get_user_id_from_token(request: Request) -> str:
    token = get_token_from_header(request)
    payload = decode_jwt_token(token)

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing 'sub' (user ID)")
    
    return user_id

def get_current_user_id(request: Request) -> str:
    return get_user_id_from_token(request)
