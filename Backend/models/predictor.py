import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

_model = None
_label_encoder = None

def _generate_training_data():
    np.random.seed(42)
    X, y = [], []

    # Good samples
    for _ in range(300):
        temp = np.random.uniform(40, 60)
        current = np.random.uniform(4, 7)
        rpm = np.random.uniform(1720, 1780)
        vibration = np.random.uniform(1, 4)
        X.append([temp, current, rpm, vibration])
        y.append("Good")

    # Warning samples
    for _ in range(200):
        temp = np.random.uniform(61, 79)
        current = np.random.uniform(7, 10)
        rpm = np.random.uniform(1600, 1720)
        vibration = np.random.uniform(4, 6)
        X.append([temp, current, rpm, vibration])
        y.append("Warning")

    # Bad samples
    for _ in range(200):
        scenario = np.random.randint(0, 3)
        if scenario == 0:  # Bearing failure
            temp = np.random.uniform(70, 95)
            current = np.random.uniform(8, 12)
            rpm = np.random.uniform(1680, 1760)
            vibration = np.random.uniform(6, 12)
        elif scenario == 1:  # Overload
            temp = np.random.uniform(80, 105)
            current = np.random.uniform(10, 16)
            rpm = np.random.uniform(1400, 1680)
            vibration = np.random.uniform(3, 8)
        else:  # Stall
            temp = np.random.uniform(60, 90)
            current = np.random.uniform(13, 16)
            rpm = np.random.uniform(0, 200)
            vibration = np.random.uniform(2, 7)
        X.append([temp, current, rpm, vibration])
        y.append("Bad")

    return np.array(X), np.array(y)

def train_model():
    global _model, _label_encoder
    X, y = _generate_training_data()
    _label_encoder = LabelEncoder()
    y_enc = _label_encoder.fit_transform(y)
    _model = RandomForestClassifier(n_estimators=100, random_state=42)
    _model.fit(X, y_enc)
    print("[ML] RandomForestClassifier trained successfully.")

def predict(data: dict) -> dict:
    global _model, _label_encoder

    temp = data.get("temperature", 50)
    current = data.get("current", 5)
    rpm = data.get("rpm", 1750)
    vibration = data.get("vibration", 2)

    # Build reasons
    reasons = []
    if temp > 80: reasons.append(f"critical temperature ({temp}°C)")
    elif temp > 60: reasons.append(f"elevated temperature ({temp}°C)")
    if current > 10: reasons.append(f"high current draw ({current}A)")
    elif current > 7: reasons.append(f"moderate current ({current}A)")
    if vibration > 6: reasons.append(f"excessive vibration ({vibration} mm/s)")
    elif vibration > 4: reasons.append(f"elevated vibration ({vibration} mm/s)")
    if rpm < 200: reasons.append(f"near stall RPM ({rpm})")
    elif rpm < 1680: reasons.append(f"below nominal RPM ({rpm})")

    # Fallback rule-based logic
    if _model is None:
        if temp > 80 or current > 10 or vibration > 6 or rpm < 200:
            label = "Bad"
        elif temp > 60 or current > 7 or vibration > 4:
            label = "Warning"
        else:
            label = "Good"
        reason = ", ".join(reasons) if reasons else "All parameters nominal"
        return {"label": label, "confidence": 0.75, "method": "rule-based", "reason": reason}

    features = np.array([[temp, current, rpm, vibration]])
    pred_enc = _model.predict(features)[0]
    proba = _model.predict_proba(features)[0]
    label = _label_encoder.inverse_transform([pred_enc])[0]
    confidence = float(np.max(proba))

    if label == "Good":
        reason = "All parameters within normal operating range"
    elif not reasons:
        reason = "Marginal sensor readings detected"
    else:
        reason = "Detected: " + ", ".join(reasons)

    return {
        "label": label,
        "confidence": round(confidence, 3),
        "method": "ml",
        "reason": reason,
    }
