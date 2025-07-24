from fastapi import APIRouter, Depends, HTTPException
from db import get_connection
from auth import require_role
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()

class ProductIn(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = 'Active'

class ProductOut(ProductIn):
    id: int
    created_at: datetime
    updated_at: datetime

@router.get("/")
def get_products():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name, description, status, created_at, updated_at FROM products")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    keys = ["id", "name", "description", "status", "created_at", "updated_at"]
    return {"products": [dict(zip(keys, row)) for row in rows]}

@router.post("/")
def create_product(product: ProductIn, user=Depends(require_role("Admin", "Moderator"))):
    conn = get_connection()
    cur = conn.cursor()
    now = datetime.now()
    cur.execute(
        """
        INSERT INTO products (name, description, status, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s) RETURNING id, created_at, updated_at
        """,
        (product.name, product.description, product.status, now, now)
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return {"id": row[0], "created_at": row[1], "updated_at": row[2]}

@router.put("/{product_id}")
def update_product(product_id: int, product: ProductIn, user=Depends(require_role("Admin", "Moderator"))):
    conn = get_connection()
    cur = conn.cursor()
    now = datetime.now()
    cur.execute("SELECT id FROM products WHERE id=%s", (product_id,))
    if not cur.fetchone():
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")
    cur.execute(
        """
        UPDATE products SET name=%s, description=%s, status=%s, updated_at=%s WHERE id=%s
        """,
        (product.name, product.description, product.status, now, product_id)
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Product updated"}

@router.delete("/{product_id}")
def delete_product(product_id: int, user=Depends(require_role("Admin"))):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM products WHERE id=%s", (product_id,))
    if cur.rowcount == 0:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Product deleted"} 