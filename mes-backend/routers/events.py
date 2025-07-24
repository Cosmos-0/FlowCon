from fastapi import APIRouter, HTTPException
from db import get_connection
import psycopg2.extras

router = APIRouter()

@router.get("/")
def get_events():
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("SELECT * FROM events")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return {"events": rows}

@router.get("/{event_id}")
def get_event(event_id: int):
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("SELECT * FROM events WHERE id = %s", (event_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if row:
        return {"event": row}
    raise HTTPException(status_code=404, detail="Event not found")

@router.post("/")
def create_event(event: dict):
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("INSERT INTO events (machine_id, work_order_id, event_type, description, occurred_at) VALUES (%s, %s, %s, %s, %s) RETURNING id", (event["machine_id"], event["work_order_id"], event["event_type"], event.get("description"), event["occurred_at"]))
    event_id = cur.fetchone()["id"]
    conn.commit()
    cur.close()
    conn.close()
    return {"id": event_id}

@router.put("/{event_id}")
def update_event(event_id: int, event: dict):
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("UPDATE events SET machine_id=%s, work_order_id=%s, event_type=%s, description=%s, occurred_at=%s WHERE id=%s", (event["machine_id"], event["work_order_id"], event["event_type"], event.get("description"), event["occurred_at"], event_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Event updated"}

@router.delete("/{event_id}")
def delete_event(event_id: int):
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("DELETE FROM events WHERE id = %s", (event_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Event deleted"} 