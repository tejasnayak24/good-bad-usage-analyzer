from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database.db import machines, sensor_history, get_next_id
from schemas.response import ok, err

router = APIRouter()

class MachineCreate(BaseModel):
    name: str
    location: str
    type: str
    group: Optional[str] = "General"

class MachineUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    type: Optional[str] = None
    group: Optional[str] = None
    status: Optional[str] = None

@router.get("/machines")
def get_machines():
    return ok(machines, f"{len(machines)} machines found")

@router.get("/machine/{machine_id}")
def get_machine(machine_id: int):
    machine = next((m for m in machines if m["id"] == machine_id), None)
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    return ok(machine)

def normalize(text: str) -> str:
    """Collapse to lowercase alphanumeric only — 'Motor A' == 'motorA' == 'motor a'."""
    return ''.join(ch.lower() for ch in text if ch.isalnum())


@router.post("/machines")
def create_machine(body: MachineCreate):
    norm_name     = normalize(body.name)
    norm_location = normalize(body.location)

    for machine in machines:
        if (normalize(machine["name"]) == norm_name and
                normalize(machine["location"]) == norm_location):
            raise HTTPException(
                status_code=400,
                detail="Device already exists on this floor"
            )

    new_id = get_next_id()
    machine = {
        "id": new_id,
        "name": body.name.strip(),
        "location": body.location.strip(),
        "type": body.type,
        "group": body.group or "General",
        "status": "active",
    }
    machines.append(machine)
    sensor_history[new_id] = []
    return ok(machine, "Machine created successfully")

@router.put("/machines/{machine_id}")
def update_machine(machine_id: int, body: MachineUpdate):
    machine = next((m for m in machines if m["id"] == machine_id), None)
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    if body.name is not None: machine["name"] = body.name
    if body.location is not None: machine["location"] = body.location
    if body.type is not None: machine["type"] = body.type
    if body.group is not None: machine["group"] = body.group
    if body.status is not None: machine["status"] = body.status
    return ok(machine, "Machine updated successfully")

@router.delete("/machines/{machine_id}")
def delete_machine(machine_id: int):
    machine = next((m for m in machines if m["id"] == machine_id), None)
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    machines.remove(machine)
    sensor_history.pop(machine_id, None)
    return ok({"id": machine_id}, "Machine deleted successfully")

