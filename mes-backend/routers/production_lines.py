from fastapi import APIRouter, HTTPException, Depends
from db import get_connection
import psycopg2.extras
from auth import require_role

router = APIRouter(prefix="/api/production-lines", tags=["production-lines"])

@router.get("/")
def get_lines():
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("SELECT * FROM production_lines")
    rows = cur.fetchall()
    # For each line, add dummy/default values for oee, machines, alarms, lastProduction
    for line in rows:
        # OEE: dummy value or fetch real if available
        line["oee"] = 85  # Replace with real calculation if available
        # Machines: count of machines assigned to this line
        cur.execute("SELECT COUNT(*) as count FROM machines WHERE line_id = %s", (line["id"],))
        line["machines"] = cur.fetchone()["count"]
        # Alarms: count of alarms for this line's machines
        cur.execute("SELECT COUNT(*) as count FROM alarms WHERE machine_id IN (SELECT id FROM machines WHERE line_id = %s)", (line["id"],))
        line["alarms"] = cur.fetchone()["count"]
        # Last Production: dummy value or fetch real if available
        line["lastProduction"] = "-"  # Replace with real value if available
        # Set line status based on machines
        cur.execute("SELECT status FROM machines WHERE line_id = %s", (line["id"],))
        machine_statuses = [row["status"] for row in cur.fetchall()]
        if any(status == "RUNNING" for status in machine_statuses):
            line["status"] = "RUNNING"
        else:
            line["status"] = "STOPPED"
    cur.close()
    conn.close()
    return {"production_lines": rows}

@router.get("/{line_id}")
def get_production_line(line_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name, oee, shift_quantity, description, status, created_at FROM production_lines WHERE id = %s", (line_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Production line not found")
    line = {
        "id": row[0],
        "name": row[1],
        "oee": row[2],
        "shift_quantity": row[3],
        "description": row[4],
        "status": row[5],
        "created_at": row[6],
    }
    # Fetch batch info
    cur.execute("SELECT id, name, current, target, elapsed FROM batches WHERE line_id = %s ORDER BY id DESC LIMIT 1", (line_id,))
    batch = cur.fetchone()
    if batch:
        line["batch"] = {
            "id": batch[0], "name": batch[1], "current": batch[2], "target": batch[3], "elapsed": batch[4]
        }
    else:
        line["batch"] = None
    # Fetch history
    cur.execute("SELECT code, label, qty FROM production_history WHERE line_id = %s ORDER BY id DESC LIMIT 10", (line_id,))
    history = [{"code": h[0], "label": h[1], "qty": h[2]} for h in cur.fetchall()]
    line["history"] = history
    cur.close()
    conn.close()
    return {"production_line": line}

@router.get("/{line_id}/timeline")
def get_production_line_timeline(line_id: int):
    # This should return the rows/segments/markers for the timeline grid
    # For now, return dummy data similar to your frontend
    rows = [
        {
            "id": "08",
            "kpi": "24/43",
            "kpiColor": "text-white",
            "segments": [
                {"start": 0, "end": 180, "status": "STOP", "label": "Product changeover"},
                {"start": 180, "end": 300, "status": "RUNNING"},
                {"start": 300, "end": 330, "status": "STOP", "label": "Unplanned"},
                {"start": 330, "end": 360, "status": "SPEED_LOSS"},
                {"start": 360, "end": 480, "status": "STOP", "label": "Material shortage"},
            ],
            "markers": [{"time": 200, "tooltip": ""}, {"time": 220, "tooltip": ""}]
        },
        # ... more rows can be added here ...
    ]
    return {"rows": rows}

@router.post("/")
def create_line(line: dict, user=Depends(require_role("Admin", "Moderator"))):
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("INSERT INTO production_lines (name, description, status) VALUES (%s, %s, %s) RETURNING id", (line["name"], line.get("description"), line["status"]))
    line_id = cur.fetchone()["id"]
    conn.commit()
    cur.close()
    conn.close()
    return {"id": line_id}

@router.put("/{line_id}")
def update_line(line_id: int, line: dict, user=Depends(require_role("Admin", "Moderator"))):
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("UPDATE production_lines SET name=%s, description=%s, status=%s WHERE id=%s", (line["name"], line.get("description"), line["status"], line_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Production line updated"}

@router.delete("/{line_id}")
def delete_line(line_id: int, user=Depends(require_role("Admin"))):
    conn = get_connection(cursor_factory=psycopg2.extras.RealDictCursor)
    cur = conn.cursor()
    cur.execute("DELETE FROM production_lines WHERE id = %s", (line_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Production line deleted"}

@router.get("/simulate")
def simulate_production_line():
    # Simulated production line data
    line = {
        "id": 1,
        "name": "Simulated Line",
        "oee": 85,
        "shift_quantity": 120,
        "batch": {
            "id": "SIMBATCH1",
            "name": "Simulated Batch",
            "current": 60,
            "target": 100,
            "elapsed": "2h 30min"
        },
        "history": [
            {"code": "SIM001", "label": "Simulated Product A", "qty": "50/0 pcs"},
            {"code": "SIM002", "label": "Simulated Product B", "qty": "70/0 pcs"}
        ]
    }
    # Simulated timeline data
    rows = [
        {
            "id": "01",
            "kpi": "20/40",
            "kpiColor": "text-white",
            "segments": [
                {"start": 0, "end": 120, "status": "RUNNING"},
                {"start": 120, "end": 180, "status": "STOP", "label": "Changeover"},
                {"start": 180, "end": 480, "status": "RUNNING"}
            ],
            "markers": [{"time": 60, "tooltip": "Maintenance"}, {"time": 300, "tooltip": "Inspection"}]
        },
        {
            "id": "02",
            "kpi": "35/60",
            "kpiColor": "text-green-400",
            "segments": [
                {"start": 0, "end": 480, "status": "RUNNING"}
            ],
            "markers": []
        },
        {
            "id": "03",
            "kpi": "0/0",
            "kpiColor": "text-red-600",
            "segments": [],
            "markers": []
        }
    ]
    return {"production_line": line, "rows": rows} 