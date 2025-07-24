from fastapi import APIRouter, HTTPException, Depends
from db import get_connection
import psycopg2.extras
import bcrypt
from auth import get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.put("/profile")
def update_profile(data: dict, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    fields = []
    values = []
    if "full_name" in data and data["full_name"]:
        fields.append("full_name=%s")
        values.append(data["full_name"])
    if "username" in data and data["username"]:
        fields.append("username=%s")
        values.append(data["username"])
    if "email" in data and data["email"]:
        fields.append("email=%s")
        values.append(data["email"])
    if "password" in data and data["password"]:
        password_hash = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt()).decode()
        fields.append("password_hash=%s")
        values.append(password_hash)
    if not fields:
        cur.close()
        conn.close()
        return {"message": "No fields to update"}
    sql = f"UPDATE users SET {', '.join(fields)} WHERE id=%s"
    values.append(user_id)
    cur.execute(sql, tuple(values))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Profile updated"} 