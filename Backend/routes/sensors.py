import random
import time
from datetime import datetime
from fastapi import APIRouter, HTTPException
from database.db import machines, sensor_history, add_sensor_reading, add_alert, resolve_machine_alerts
from models.predictor import predict
from schemas.response import ok

router = APIRouter()

def generate_ai_insight(machine_name: str, sensors: dict, prediction: dict) -> dict:
    """
    Build a (reason, recommendation) pair in the same format as the Dashboard
    AI Recommendations panel.

    reason         → "<MachineName>: <predictor reason>"
                     e.g. "Motor A: Detected elevated temperature (82.3°C), high current draw (11.1A)"

    recommendation → "<MachineName> <contextual action>" built from live sensor
                     values — same multi-metric logic the Dashboard uses for
                     prediction_warning labels.
    """
    temp      = sensors.get("temperature", 0)
    current   = sensors.get("current", 0)
    vibration = sensors.get("vibration", 0)
    rpm       = sensors.get("rpm", 1750)

    pred_reason = prediction.get("reason", "Abnormal readings detected")
    reason = f"{machine_name}: {pred_reason}"

    issues = []
    if temp > 85:
        issues.append("critical overheating")
    elif temp > 75:
        issues.append("elevated temperature")

    if current > 10:
        issues.append("excessive current draw")
    elif current > 7:
        issues.append("high current load")

    if vibration > 6:
        issues.append("severe vibration")
    elif vibration > 4:
        issues.append("elevated vibration")

    if rpm < 200:
        issues.append("near-stall RPM")
    elif rpm < 1680:
        issues.append("below-nominal RPM")

    if len(issues) >= 3:
        recommendation = (
            f"{machine_name} is likely to fail soon — "
            f"multiple abnormal conditions detected ({', '.join(issues)})"
        )
    elif len(issues) == 2:
        recommendation = (
            f"{machine_name} requires immediate inspection — "
            f"{issues[0]} and {issues[1]} detected simultaneously"
        )
    elif len(issues) == 1:
        recommendation = (
            f"{machine_name}: Address {issues[0]} before it escalates to failure"
        )
    else:
        recommendation = (
            f"{machine_name}: Marginal readings detected — monitor closely and "
            f"schedule preventive maintenance"
        )

    return {"reason": reason, "recommendation": recommendation}


STATE_TARGETS = {
    "normal":   {"temperature": 45.0, "current": 5.5,  "rpm": 1750.0, "vibration": 2.0},
    "high":     {"temperature": 65.0, "current": 8.5,  "rpm": 1720.0, "vibration": 5.0},
    "overload": {"temperature": 85.0, "current": 13.5, "rpm": 1640.0, "vibration": 9.0},
}

STATE_RANGES = {
    "temperature": (20.0, 110.0),
    "current":     (0.0,  20.0),
    "rpm":         (0.0,  1800.0),
    "vibration":   (0.0,  15.0),
}

NOISE = {
    "temperature": 0.8,
    "current":     0.3,
    "rpm":         8.0,
    "vibration":   0.2,
}

_machine_state: dict = {}


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def _get_state(machine_id: int) -> dict:
    """Return (and lazily initialise) the simulation state for a machine."""
    if machine_id not in _machine_state:
        _machine_state[machine_id] = {
            "state":          "normal",
            "override":       False,
            "override_until": 0.0,   
            "tick":           0,
            "temperature": STATE_TARGETS["normal"]["temperature"],
            "current":     STATE_TARGETS["normal"]["current"],
            "rpm":         STATE_TARGETS["normal"]["rpm"],
            "vibration":   STATE_TARGETS["normal"]["vibration"],
        }
    return _machine_state[machine_id]


def simulate_reading(machine_id: int) -> dict:
    state = _get_state(machine_id)
    state["tick"] += 1

    if state["override"] and time.time() >= state["override_until"]:
        state["override"] = False
        state["state"]    = "normal"

    if state["override"]:
        state["temperature"] = 90.0 + random.uniform(-0.5,  0.5)
        state["current"]     = 14.0 + random.uniform(-0.2,  0.2)
        state["rpm"]         = 1630.0 + random.uniform(-5.0, 5.0)
        state["vibration"]   = 9.0  + random.uniform(-0.1,  0.1)
    else:
        targets = STATE_TARGETS[state["state"]]
        for key in ("temperature", "current", "rpm", "vibration"):
            target = targets[key]
            noise  = random.uniform(-NOISE[key], NOISE[key])
            lo, hi = STATE_RANGES[key]
            state[key] += (target - state[key]) * 0.1 + noise
            state[key]  = _clamp(state[key], lo, hi)

    temperature = round(state["temperature"], 2)
    current     = round(state["current"],     2)
    rpm         = round(state["rpm"],         2)
    vibration   = round(state["vibration"],   2)
    scenario    = state["state"]

    reading = {
        "machine_id": machine_id,
        "timestamp":  datetime.now().isoformat(),
        "rpm":        rpm,
        "current":    current,
        "temperature":temperature,
        "vibration":  vibration,
        "scenario":   scenario,
    }

    #  ML prediction
    prediction = predict({
        "temperature": temperature,
        "current":     current,
        "rpm":         rpm,
        "vibration":   vibration,
    })
    reading["status"]     = prediction["label"]
    reading["confidence"] = prediction["confidence"]
    reading["method"]     = prediction["method"]
    reading["reason"]     = prediction["reason"]

    # Predictive warning
    history_list = sensor_history.get(machine_id, [])
    prediction_warning = None
    if len(history_list) >= 5:
        recent     = history_list[-5:]
        bad_count  = sum(1 for r in recent if r["status"] == "Bad")
        warn_count = sum(1 for r in recent if r["status"] in ("Bad", "Warning"))
        vib_trend  = recent[-1]["vibration"]   - recent[0]["vibration"]
        temp_trend = recent[-1]["temperature"] - recent[0]["temperature"]
        if bad_count >= 3:
            prediction_warning = "Likely to fail in ~2 minutes — multiple Bad readings detected"
        elif warn_count >= 4 and (vib_trend > 1 or temp_trend > 5):
            prediction_warning = "Failure risk elevated — worsening sensor trend"
        elif vib_trend > 2 and temp_trend > 8:
            prediction_warning = "Sensor degradation detected — monitor closely"
    reading["prediction_warning"] = prediction_warning

    add_sensor_reading(machine_id, reading)

    # Alert creation / resolution
    machine = next(
        (m for m in machines if m["id"] == machine_id),
        {"name": f"Machine {machine_id}"},
    )
    problem_detected = False
    sensor_snapshot = {"temperature": temperature, "current": current, "vibration": vibration, "rpm": rpm}

    def _attach_insight(alert_obj):
        """Stamp reason + recommendation onto a *newly created* alert only.
        Calls generate_ai_insight with the predictor output so the text
        is identical to what the Dashboard AI Recommendations panel shows."""
        if alert_obj and not alert_obj.get("reason"):
            insight = generate_ai_insight(machine["name"], sensor_snapshot, prediction)
            alert_obj["reason"]         = insight["reason"]
            alert_obj["recommendation"] = insight["recommendation"]

    if temperature > 75:
        obj = add_alert(machine_id, machine["name"], "high_temperature",
                        f"High temperature: {temperature}°C", "critical")
        _attach_insight(obj)
        problem_detected = True

    if prediction["label"] == "Bad":
        obj = add_alert(machine_id, machine["name"], "ml_bad",
                        f"ML classified as Bad (confidence: {prediction['confidence']})", "critical")
        _attach_insight(obj)
        problem_detected = True

    if vibration > 6:
        obj = add_alert(machine_id, machine["name"], "high_vibration",
                        f"High vibration: {vibration} mm/s", "warning")
        _attach_insight(obj)
        problem_detected = True

    if not problem_detected and reading["status"] == "Good":
        resolve_machine_alerts(machine_id)

    return reading



@router.get("/sensor/{machine_id}")
def get_sensor(machine_id: int):
    machine = next((m for m in machines if m["id"] == machine_id), None)
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    history = sensor_history.get(machine_id, [])
    return ok({"history": history[-20:], "machine": machine})


@router.get("/machines/{machine_id}/history")
def get_machine_history(machine_id: int):
    machine = next((m for m in machines if m["id"] == machine_id), None)
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    history = sensor_history.get(machine_id, [])
    return ok({"history": history, "machine": machine, "count": len(history)})


@router.get("/realtime/{machine_id}")
def get_realtime(machine_id: int):
    machine = next((m for m in machines if m["id"] == machine_id), None)
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")
    reading = simulate_reading(machine_id)
    return ok(reading)


@router.put("/machines/{machine_id}/simulate-bad")
def simulate_bad(machine_id: int):
    """Force a machine into overload for 60 seconds (wall-clock, polling-independent)."""
    machine = next((m for m in machines if m["id"] == machine_id), None)
    if not machine:
        raise HTTPException(status_code=404, detail="Machine not found")

    state = _get_state(machine_id)
    state["state"]          = "overload"
    state["override"]       = True
    state["override_until"] = time.time() + 60   

    return ok({
        "machine_id":     machine_id,
        "state":          state["state"],
        "override":       state["override"],
        "override_until": state["override_until"],
    }, "Machine set to overload — auto-recovers after 60 s")


@router.put("/simulate-alert")
def simulate_alert():
    """
    Randomly select one active machine, force it into overload, and let the
    normal simulation loop handle alert creation (one alert per issue, no spam).

    Selection strategy: prefer machines NOT already in override so the triggered
    event is always visible and distinct. Falls back to any machine if all are
    already overloaded.
    """
    if not machines:
        raise HTTPException(status_code=404, detail="No machines registered")

    idle = [m for m in machines if not _get_state(m["id"]).get("override", False)]
    target = random.choice(idle) if idle else random.choice(machines)

    machine_id = target["id"]
    state = _get_state(machine_id)
    
    resolve_machine_alerts(machine_id)
    state["state"]          = "overload"
    state["override"]       = True
    state["override_until"] = time.time() + 4   

    return ok({
        "machine_id":     machine_id,
        "machine_name":   target["name"],
        "state":          state["state"],
        "override":       state["override"],
        "override_until": state["override_until"],
    }, f"Alert simulation started on '{target['name']}' — auto-recovers after 4 s")
