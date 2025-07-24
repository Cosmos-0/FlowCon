from fastapi import APIRouter, HTTPException
from db import get_connection
import psycopg2.extras

router = APIRouter()

@router.get("/")
def get_stops():
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("SELECT * FROM stops")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return {"stops": rows}

@router.get("/{stop_id}")
def get_stop(stop_id: int):
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("SELECT * FROM stops WHERE id = %s", (stop_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if row:
        return {"stop": row}
    raise HTTPException(status_code=404, detail="Stop not found")

@router.post("/")
def create_stop(stop: dict):
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("INSERT INTO stops ( machine_id, reason, start_time, end_time) VALUES (%s, %s, %s, %s) RETURNING id", ( stop["machine_id"], stop.get("reason"), stop["start_time"], stop.get("end_time")))
    stop_id = cur.fetchone()["id"]
    conn.commit()
    cur.close()
    conn.close()
    return {"id": stop_id}

@router.put("/{stop_id}")
def update_stop(stop_id: int, stop: dict):
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    # If end_time is set, mark as resolved
    resolved = stop.get("resolved")
    if resolved is None:
        resolved = stop.get("end_time") is not None
    cur.execute("UPDATE stops SET machine_id=%s, reason=%s, start_time=%s, end_time=%s, resolved=%s WHERE id=%s", (
        stop["machine_id"],
        stop.get("reason"),
        stop["start_time"],
        stop.get("end_time"),
        resolved,
        stop_id
    ))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Stop updated"}

@router.delete("/{stop_id}")
def delete_stop(stop_id: int):
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("DELETE FROM stops WHERE id = %s", (stop_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Stop deleted"} 