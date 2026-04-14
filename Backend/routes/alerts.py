from fastapi import APIRouter, HTTPException
from database.db import alerts
from schemas.response import ok
from datetime import datetime

router = APIRouter()


@router.get("/alerts")
def get_alerts():
    """Return last 50 alerts, newest first."""
    return ok(list(reversed(alerts[-50:])), f"{len(alerts)} total alerts")


@router.get("/alerts/stats")
def get_alert_stats():
    """
    Counts for the summary cards.
    Critical / Warning counts include ACTIVE alerts only.
    Unacknowledged = active alerts that have not been ack'd (resolved or not).
    """
    active_alerts = [a for a in alerts if a["status"] == "active"]
    stats = {
        "critical":       sum(1 for a in active_alerts if a["severity"] == "critical" and not a["resolved"]),
        "warning":        sum(1 for a in active_alerts if a["severity"] == "warning"  and not a["resolved"]),
        "resolved_unack": sum(1 for a in active_alerts if a["resolved"]),
        "unack":          len(active_alerts),
        "total":          len(alerts),
    }
    return ok(stats)


@router.get("/alerts/machine/{machine_id}")
def get_machine_alerts(machine_id: int):
    filtered = [a for a in alerts if a["machine_id"] == machine_id]
    return ok(list(reversed(filtered[-20:])))


@router.post("/alerts/{alert_id}/acknowledge")
def acknowledge_alert_legacy(alert_id: int):
    for alert in alerts:
        if alert["id"] == alert_id:
            alert["status"]          = "ack"
            alert["acknowledged"]    = True
            alert["acknowledged_at"] = datetime.now().isoformat()
            return ok(alert, "Alert acknowledged")
    raise HTTPException(status_code=404, detail="Alert not found")


@router.put("/alerts/{alert_id}/ack")
def acknowledge_alert(alert_id: int):
    """
    Acknowledge an alert.  Works regardless of resolved state —
    both ACTIVE and RESOLVED alerts can be ack'd.
    Sets status='ack', acknowledged=True, acknowledged_at=now.
    """
    for alert in alerts:
        if alert["id"] == alert_id:
            alert["status"]          = "ack"
            alert["acknowledged"]    = True
            alert["acknowledged_at"] = datetime.now().isoformat()
            return ok(alert, "Alert acknowledged")
    raise HTTPException(status_code=404, detail="Alert not found")
