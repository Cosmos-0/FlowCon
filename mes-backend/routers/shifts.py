from fastapi import APIRouter, HTTPException, Depends
from db import get_connection
import psycopg2.extras
from auth import require_role

router = APIRouter()

@router.get("/")
def get_shifts():
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("SELECT * FROM shifts")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return {"shifts": rows}

@router.get("/{shift_id}")
def get_shift(shift_id: int):
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("SELECT * FROM shifts WHERE id = %s", (shift_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if row:
        return {"shift": row}
    raise HTTPException(status_code=404, detail="Shift not found")

@router.post("/")
def create_shift(shift: dict, user=Depends(require_role("Admin", "Moderator", "User"))):
    # Validation: require start_time and end_time
    if not shift.get("start_time"):
        raise HTTPException(status_code=400, detail="start_time is required")
    if not shift.get("end_time"):
        raise HTTPException(status_code=400, detail="end_time is required")
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    # Convert empty string time fields to None
    start_time = shift.get("start_time") or None
    end_time = shift.get("end_time") or None
    cur.execute("INSERT INTO shifts (line_id, name, start_time, end_time, shift_quantity, operator, duration) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id", (
        shift["line_id"],
        shift["name"],
        start_time,
        end_time,
        shift.get("shift_quantity", 0),
        shift.get("operator"),
        shift.get("duration")
    ))
    shift_id = cur.fetchone()["id"]
    conn.commit()
    cur.close()
    conn.close()
    return {"id": shift_id}

@router.put("/{shift_id}")
def update_shift(shift_id: int, shift: dict, user=Depends(require_role("Admin", "Moderator", "User"))):
    # Validation: require start_time and end_time
    if not shift.get("start_time"):
        raise HTTPException(status_code=400, detail="start_time is required")
    if not shift.get("end_time"):
        raise HTTPException(status_code=400, detail="end_time is required")
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    # Convert empty string time fields to None
    start_time = shift.get("start_time") or None
    end_time = shift.get("end_time") or None
    cur.execute("UPDATE shifts SET line_id=%s, name=%s, start_time=%s, end_time=%s, shift_quantity=%s, operator=%s, duration=%s WHERE id=%s", (
        shift["line_id"],
        shift["name"],
        start_time,
        end_time,
        shift.get("shift_quantity", 0),
        shift.get("operator"),
        shift.get("duration"),
        shift_id
    ))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Shift updated"}

@router.delete("/{shift_id}")
def delete_shift(shift_id: int, user=Depends(require_role("Admin"))):
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("DELETE FROM shifts WHERE id = %s", (shift_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Shift deleted"} 