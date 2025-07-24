from fastapi import APIRouter, Depends, HTTPException
from db import get_connection
from auth import require_role
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

router = APIRouter()

# Pydantic model for validation
class WorkOrderIn(BaseModel):
    product_id: int
    quantity: int
    status: str
    due_date: Optional[date] = None
    assigned_line_id: Optional[int] = None
    progress: float = Field(0, ge=0, le=1)
    alarms: int = 0
    # Future: operator_id: Optional[int] = None
    # Future: comments: Optional[str] = None

class WorkOrderOut(WorkOrderIn):
    id: int
    created_at: datetime
    updated_at: datetime

@router.get("/")
def get_work_orders():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, product_id, quantity, status, due_date, assigned_line_id, progress, alarms, created_at, updated_at FROM work_orders")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    keys = ["id", "product_id", "quantity", "status", "due_date", "assigned_line_id", "progress", "alarms", "created_at", "updated_at"]
    return {"work_orders": [dict(zip(keys, row)) for row in rows]}

@router.post("/")
def create_work_order(order: WorkOrderIn, user=Depends(require_role("Admin", "Moderator"))):
    conn = get_connection()
    cur = conn.cursor()
    now = datetime.now()
    cur.execute(
        """
        INSERT INTO work_orders (product_id, quantity, status, due_date, assigned_line_id, progress, alarms, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id, created_at, updated_at
        """,
        (order.product_id, order.quantity, order.status, order.due_date, order.assigned_line_id, order.progress, order.alarms, now, now)
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return {"id": row[0], "created_at": row[1], "updated_at": row[2]}

@router.put("/{order_id}")
def update_work_order(order_id: int, order: WorkOrderIn, user=Depends(require_role("Admin", "Moderator"))):
    # Enforce valid status transitions (example: can't go from Completed to Open)
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT status FROM work_orders WHERE id=%s", (order_id,))
    current = cur.fetchone()
    if not current:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Work order not found")
    current_status = current[0]
    if current_status == "Completed" and order.status != "Completed":
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot revert a completed work order to another status")
    now = datetime.now()
    cur.execute(
        """
        UPDATE work_orders SET product_id=%s, quantity=%s, status=%s, due_date=%s, assigned_line_id=%s, progress=%s, alarms=%s, updated_at=%s WHERE id=%s
        """,
        (order.product_id, order.quantity, order.status, order.due_date, order.assigned_line_id, order.progress, order.alarms, now, order_id)
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Work order updated"}

@router.delete("/{order_id}")
def delete_work_order(order_id: int, user=Depends(require_role("Admin"))):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM work_orders WHERE id=%s", (order_id,))
    if cur.rowcount == 0:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Work order not found")
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Work order deleted"} 