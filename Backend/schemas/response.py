from pydantic import BaseModel
from typing import Any, Optional

class StandardResponse(BaseModel):
    status: str = "success"
    data: Any = None
    message: str = ""

def ok(data: Any, message: str = "") -> dict:
    return {"status": "success", "data": data, "message": message}

def err(message: str, data: Any = None) -> dict:
    return {"status": "error", "data": data, "message": message}
