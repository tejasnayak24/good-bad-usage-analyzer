from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models.predictor import train_model
from routes import machines, sensors, alerts, analytics

app = FastAPI(title="Nexus Monitor", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(machines.router)
app.include_router(sensors.router)
app.include_router(alerts.router)
app.include_router(analytics.router)

@app.on_event("startup")
def startup():
    train_model()
    print("[Server] Nexus Monitor API ready at http://localhost:8000")

@app.get("/")
def root():
    return {"message": "Nexus Monitor API", "status": "running", "version": "2.0.0"}
