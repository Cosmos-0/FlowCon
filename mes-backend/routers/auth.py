from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from auth import create_access_token, verify_password
from db import get_connection

router = APIRouter()

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_connection(cursor_factory=None)
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE username = %s", (form_data.username,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    if not user or not verify_password(form_data.password, user[2]):  # password_hash is 3rd col
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    # Convert to dict if needed
    columns = [desc[0] for desc in cur.description]
    user_dict = dict(zip(columns, user))
    if user_dict["status"].lower() == "banned":
        raise HTTPException(status_code=403, detail="User is banned")
    access_token = create_access_token(data={"sub": user_dict["username"], "role": user_dict["role"]})
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": user_dict["id"], "username": user_dict["username"], "role": user_dict["role"], "email": user_dict["email"], "full_name": user_dict["full_name"]}} 