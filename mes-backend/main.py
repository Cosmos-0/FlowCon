from fastapi import FastAPI
from routers import work_orders, users, production_lines, machines, shifts, stops, alarms, events, auth, products
from fastapi.middleware.cors import CORSMiddleware
from routers import settings

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all. For production, specify your frontend URL.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(work_orders.router, prefix="/api/workorders", tags=["Work Orders"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(production_lines.router)
app.include_router(machines.router, prefix="/api/machines", tags=["Machines"])
app.include_router(shifts.router, prefix="/api/shifts", tags=["Shifts"])
app.include_router(stops.router, prefix="/api/stops", tags=["Stops"])
app.include_router(alarms.router, prefix="/api/alarms", tags=["Alarms"])
app.include_router(events.router, prefix="/api/events", tags=["Events"])
app.include_router(settings.router)
app.include_router(products.router, prefix="/api/products", tags=["Products"])

@app.get("/")
def read_root():
    return {"message": "MES Backend API"} 