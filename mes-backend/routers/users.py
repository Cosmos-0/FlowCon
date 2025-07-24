from fastapi import APIRouter, HTTPException, Depends
from db import get_connection
import psycopg2.extras
from auth import require_role, get_password_hash
import psycopg2

router = APIRouter()

def get_current_user():
    # Placeholder: in real app, extract user from session/JWT
    return {"id": 1, "username": "admin", "role": "Admin"}

@router.get("/")
def get_users(user=Depends(require_role("Admin", "Moderator", "User"))):
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("SELECT * FROM users")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return {"users": rows}

@router.get("/{user_id}")
def get_user(user_id: int, user=Depends(require_role("Admin", "Moderator", "User"))):
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if row:
        return {"user": row}
    raise HTTPException(status_code=404, detail="User not found")

@router.post("/")
def create_user(user: dict, current_user: dict = Depends(require_role("Admin"))):
    if "password" not in user or not user["password"]:
        raise HTTPException(status_code=400, detail="Password is required")
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    try:
        password_hash = get_password_hash(user["password"])
        cur.execute(
            "INSERT INTO users (full_name, username, password_hash, email, role, status) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
            (user["full_name"], user["username"], password_hash, user["email"], user["role"], user.get("status", "Active"))
        )
        user_id = cur.fetchone()["id"]
        conn.commit()
        return {"id": user_id}
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(status_code=400, detail="A user with this email already exists.")
    finally:
        cur.close()
        conn.close()

@router.put("/{user_id}")
def update_user(user_id: int, user: dict, current_user: dict = Depends(require_role("Admin"))):
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    fields = []
    values = []
    if "full_name" in user and user["full_name"]:
        fields.append("full_name=%s")
        values.append(user["full_name"])
    if "username" in user and user["username"]:
        fields.append("username=%s")
        values.append(user["username"])
    if "email" in user and user["email"]:
        fields.append("email=%s")
        values.append(user["email"])
    if "role" in user and user["role"]:
        fields.append("role=%s")
        values.append(user["role"])
    if "password_hash" in user and user["password_hash"]:
        fields.append("password_hash=%s")
        values.append(user["password_hash"])
    if "status" in user and user["status"]:
        fields.append("status=%s")
        values.append(user["status"])
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
    return {"message": "User updated"}

@router.delete("/{user_id}")
def delete_user(user_id: int, current_user: dict = Depends(require_role("Admin"))):
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "User deleted"} 