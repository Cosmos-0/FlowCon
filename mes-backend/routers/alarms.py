from fastapi import APIRouter, HTTPException
from db import get_connection
import psycopg2.extras

router = APIRouter()

@router.get("/")
def get_alarms():
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("SELECT * FROM alarms")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return {"alarms": rows}

@router.get("/{alarm_id}")
def get_alarm(alarm_id: int):
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("SELECT * FROM alarms WHERE id = %s", (alarm_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if row:
        return {"alarm": row}
    raise HTTPException(status_code=404, detail="Alarm not found")

@router.post("/")
def create_alarm(alarm: dict):
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("INSERT INTO alarms (machine_id, code, description, occurred_at, cleared_at) VALUES (%s, %s, %s, %s, %s) RETURNING id", (alarm["machine_id"], alarm["code"], alarm.get("description"), alarm["occurred_at"], alarm.get("cleared_at")))
    alarm_id = cur.fetchone()["id"]
    conn.commit()
    cur.close()
    conn.close()
    return {"id": alarm_id}

@router.put("/{alarm_id}")
def update_alarm(alarm_id: int, alarm: dict):
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("UPDATE alarms SET machine_id=%s, code=%s, description=%s, occurred_at=%s, cleared_at=%s WHERE id=%s", (alarm["machine_id"], alarm["code"], alarm.get("description"), alarm["occurred_at"], alarm.get("cleared_at"), alarm_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Alarm updated"}

@router.delete("/{alarm_id}")
def delete_alarm(alarm_id: int):
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("DELETE FROM alarms WHERE id = %s", (alarm_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Alarm deleted"} 