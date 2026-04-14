from datetime import datetime

_next_machine_id = 5      
_next_alert_id   = 1      

machines = [
    {"id": 1, "name": "Motor A",      "location": "Plant Floor 1", "type": "Induction Motor",   "status": "active", "group": "Motors"},
    {"id": 2, "name": "Motor B",      "location": "Plant Floor 2", "type": "Servo Motor",        "status": "active", "group": "Motors"},
    {"id": 3, "name": "Pump C",       "location": "Cooling Unit",  "type": "Centrifugal Pump",   "status": "active", "group": "Pumps"},
    {"id": 4, "name": "Compressor D", "location": "HVAC Room",     "type": "Screw Compressor",   "status": "active", "group": "Compressors"},
]

sensor_history = {1: [], 2: [], 3: [], 4: []}

alerts = []


def get_next_id():
    global _next_machine_id
    _next_machine_id += 1
    return _next_machine_id - 1


def _next_alert_id_val():
    global _next_alert_id
    _next_alert_id += 1
    return _next_alert_id - 1



def find_active_alert(machine_id: int, alert_type: str):
    """
    Return the first UNRESOLVED alert for (machine_id, type), or None.

    Intentionally does NOT filter on status — an ACK'd-but-unresolved alert
    still blocks a duplicate from being created.  Only once the underlying
    condition clears (resolved=True) can a new alert for the same issue be
    raised.  This prevents alert spam when the user ACKs while the machine
    is still in a bad state.
    """
    for a in alerts:
        if (a["machine_id"] == machine_id
                and a["type"] == alert_type
                and not a["resolved"]):   
            return a
    return None


def add_alert(machine_id: int, machine_name: str, alert_type: str, message: str, severity: str):
    """
    Create a new alert ONLY if no active+unresolved alert of the same
    (machine_id, type) already exists.  Returns the existing alert if
    a duplicate is found (no-op), or the newly created alert.
    """
    existing = find_active_alert(machine_id, alert_type)
    if existing:
        return existing   

    now = datetime.now().isoformat()
    alert = {
        "id":               _next_alert_id_val(),
        "machine_id":       machine_id,
        "machine_name":     machine_name,
        "type":             alert_type,
        "message":          message,
        "severity":         severity,
        "status":           "active",   
        "resolved":         False,
        "created_at":       now,
        "resolved_at":      None,
        "acknowledged_at":  None,
        "timestamp":        now,
        "acknowledged":     False,
    }
    alerts.append(alert)
    if len(alerts) > 200:
        alerts.pop(0)
    return alert


def resolve_machine_alerts(machine_id: int):
    """
    Mark every active+unresolved alert for a machine as resolved.
    Called when sensor readings return to Good.
    Never deletes — only stamps resolved_at and flips resolved=True.
    """
    now = datetime.now().isoformat()
    for a in alerts:
        if a["machine_id"] == machine_id and not a["resolved"]:
            a["resolved"]    = True
            a["resolved_at"] = now


def add_sensor_reading(machine_id, reading):
    if machine_id in sensor_history:
        sensor_history[machine_id].append(reading)
        if len(sensor_history[machine_id]) > 60:
            sensor_history[machine_id].pop(0)
