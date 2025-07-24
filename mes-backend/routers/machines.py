from fastapi import APIRouter, HTTPException, Depends
from db import get_connection
import psycopg2.extras
from auth import require_role
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/")
def get_machines():
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("SELECT * FROM machines")
    machines = cur.fetchall()
    # For each machine, calculate OEE dynamically
    for machine in machines:
        machine_id = machine["id"]
        # Get planned production time (assume 8h shift = 28800s for now)
        planned_time = 8 * 60 * 60
        # Get downtime from stops
        shift_start = datetime.now() - timedelta(hours=8)
        cur.execute(
            "SELECT SUM(EXTRACT(EPOCH FROM (COALESCE(end_time, NOW()) - start_time))) as downtime "
            "FROM stops WHERE machine_id = %s AND start_time >= %s",
            (machine_id, shift_start)
        )
        downtime = cur.fetchone()["downtime"] or 0
        operating_time = planned_time - downtime
        if operating_time < 0:
            operating_time = 0
        # Get actual output (pieces produced)
        if machine["counter_type"] == "status":
            actual_output = operating_time  # 1 piece/sec
        else:
            actual_output = (machine["avg_pieces_per_sec"] or 0) * operating_time
        # Theoretical output (ideal)
        if machine["counter_type"] == "status":
            theoretical_output = planned_time  # 1 piece/sec
        else:
            theoretical_output = (machine["avg_pieces_per_sec"] or 0) * planned_time
        # OEE components
        availability = operating_time / planned_time if planned_time > 0 else 0
        performance = (actual_output / theoretical_output) if theoretical_output > 0 else 0
        quality = 1  # Assume 100% good pieces
        # Ensure all are float for multiplication
        oee = float(availability) * float(performance) * float(quality) * 100
        print(f"[OEE DEBUG] Machine {machine_id}: planned_time={planned_time}, downtime={downtime}, operating_time={operating_time}, actual_output={actual_output}, theoretical_output={theoretical_output}, availability={availability}, performance={performance}, oee={oee}")
        machine["oee"] = round(oee, 1)
        machine["availability"] = round(float(availability) * 100, 2)
        machine["performance"] = round(float(performance) * 100, 2)
        machine["quality"] = round(float(quality) * 100, 2)
    cur.close()
    conn.close()
    return {"machines": machines}

@router.get("/{machine_id}")
def get_machine(machine_id: int):
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("SELECT * FROM machines WHERE id = %s", (machine_id,))
    machine = cur.fetchone()
    if not machine:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Machine not found")
    # Calculate OEE dynamically for this machine
    planned_time = 8 * 60 * 60
    shift_start = datetime.now() - timedelta(hours=8)
    cur.execute(
        "SELECT SUM(EXTRACT(EPOCH FROM (COALESCE(end_time, NOW()) - start_time))) as downtime "
        "FROM stops WHERE machine_id = %s AND start_time >= %s",
        (machine_id, shift_start)
    )
    downtime = cur.fetchone()["downtime"] or 0
    operating_time = planned_time - downtime
    if operating_time < 0:
        operating_time = 0
    if machine["counter_type"] == "status":
        actual_output = operating_time
    else:
        actual_output = (machine["avg_pieces_per_sec"] or 0) * operating_time
    if machine["counter_type"] == "status":
        theoretical_output = planned_time
    else:
        theoretical_output = (machine["avg_pieces_per_sec"] or 0) * planned_time
    availability = operating_time / planned_time if planned_time > 0 else 0
    performance = (actual_output / theoretical_output) if theoretical_output > 0 else 0
    quality = 1
    oee = float(availability) * float(performance) * float(quality) * 100
    machine["oee"] = round(oee, 1)
    machine["availability"] = round(float(availability) * 100, 2)
    machine["performance"] = round(float(performance) * 100, 2)
    machine["quality"] = round(float(quality) * 100, 2)
    cur.close()
    conn.close()
    return {"machine": machine}

@router.post("/")
def create_machine(machine: dict, user=Depends(require_role("Admin", "Moderator"))):
    avg_pieces_per_sec = machine.get("avg_pieces_per_sec")
    if avg_pieces_per_sec == "":
        avg_pieces_per_sec = None
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("INSERT INTO machines (name, line_id, status, type, counter_type, avg_pieces_per_sec, product_id) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id", (
        machine["name"],
        machine["line_id"],
        machine["status"],
        machine.get("type"),
        machine.get("counter_type", "status"),
        avg_pieces_per_sec,
        machine.get("productId")
    ))
    machine_id = cur.fetchone()["id"]
    conn.commit()
    cur.close()
    conn.close()
    return {"id": machine_id}

@router.put("/{machine_id}")
def update_machine(machine_id: int, machine: dict, user=Depends(require_role("Admin", "Moderator"))):
    avg_pieces_per_sec = machine.get("avg_pieces_per_sec")
    if avg_pieces_per_sec == "":
        avg_pieces_per_sec = None
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("UPDATE machines SET name=%s, line_id=%s, status=%s, type=%s, counter_type=%s, avg_pieces_per_sec=%s, product_id=%s WHERE id=%s", (
        machine["name"],
        machine["line_id"],
        machine["status"],
        machine.get("type"),
        machine.get("counter_type", "status"),
        avg_pieces_per_sec,
        machine.get("productId"),
        machine_id
    ))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Machine updated"}

@router.delete("/{machine_id}")
def delete_machine(machine_id: int, user=Depends(require_role("Admin"))):
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("DELETE FROM machines WHERE id = %s", (machine_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Machine deleted"} 