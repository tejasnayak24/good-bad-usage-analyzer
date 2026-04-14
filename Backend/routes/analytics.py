from fastapi import APIRouter
from database.db import sensor_history, machines
from schemas.response import ok

router = APIRouter()

@router.get("/analytics")
def get_analytics():
    all_readings = []
    for readings in sensor_history.values():
        all_readings.extend(readings)

    if not all_readings:
        return ok({
            "total_readings": 0,
            "good_pct": 0, "warning_pct": 0, "bad_pct": 0,
            "avg_temperature": 0, "avg_current": 0,
            "avg_rpm": 0, "avg_vibration": 0,
            "per_machine": []
        })

    total = len(all_readings)
    good    = sum(1 for r in all_readings if r["status"] == "Good")
    warning = sum(1 for r in all_readings if r["status"] == "Warning")
    bad     = sum(1 for r in all_readings if r["status"] == "Bad")

    avg_temp = round(sum(r["temperature"] for r in all_readings) / total, 2)
    avg_cur  = round(sum(r["current"]     for r in all_readings) / total, 2)
    avg_rpm  = round(sum(r["rpm"]         for r in all_readings) / total, 2)
    avg_vib  = round(sum(r["vibration"]   for r in all_readings) / total, 2)

    per_machine = []
    for m in machines:
        readings = sensor_history.get(m["id"], [])
        if readings:
            last = readings[-1]
            m_total = len(readings)
            per_machine.append({
                "machine_id": m["id"],
                "machine_name": m["name"],
                "readings": m_total,
                "last_status": last["status"],
                "last_temp": last["temperature"],
                "last_rpm": last["rpm"],
                "good_pct": round(sum(1 for r in readings if r["status"] == "Good") / m_total * 100, 1),
                "bad_pct":  round(sum(1 for r in readings if r["status"] == "Bad")  / m_total * 100, 1),
            })

    return ok({
        "total_readings": total,
        "good_pct":    round(good    / total * 100, 1),
        "warning_pct": round(warning / total * 100, 1),
        "bad_pct":     round(bad     / total * 100, 1),
        "avg_temperature": avg_temp,
        "avg_current":     avg_cur,
        "avg_rpm":         avg_rpm,
        "avg_vibration":   avg_vib,
        "per_machine":     per_machine,
    })

@router.get("/analytics/machine/{machine_id}")
def get_machine_analytics(machine_id: int):
    readings = sensor_history.get(machine_id, [])
    if not readings:
        return ok({"readings": [], "stats": {}})

    recent = readings[-30:]
    temps   = [r["temperature"] for r in recent]
    rpms    = [r["rpm"]         for r in recent]
    currents = [r["current"]    for r in recent]
    vibs    = [r["vibration"]   for r in recent]

    return ok({
        "readings": recent,
        "stats": {
            "avg_temp":      round(sum(temps)    / len(temps),    2),
            "max_temp":      round(max(temps),                    2),
            "avg_rpm":       round(sum(rpms)     / len(rpms),     2),
            "avg_current":   round(sum(currents) / len(currents), 2),
            "avg_vibration": round(sum(vibs)     / len(vibs),     2),
            "status_counts": {
                "Good":    sum(1 for r in recent if r["status"] == "Good"),
                "Warning": sum(1 for r in recent if r["status"] == "Warning"),
                "Bad":     sum(1 for r in recent if r["status"] == "Bad"),
            }
        }
    })
