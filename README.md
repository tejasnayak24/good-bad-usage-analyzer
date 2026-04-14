# Nexus Monitor — Machine Usage Pattern Analyzer (Challenge 04: "Good Usage vs Bad Usage" Analyzer)

> ML-driven industrial monitoring system that analyzes machine usage patterns in real time, detects improper usage that could lead to damage, and enforces realistic operator-driven resolution workflows.

---

## Quick Start

```bash
# Backend
cd Backend
python -3.12 -m venv venv || python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (new terminal)
cd Frontend
npm install
npm run dev
```

Open: http://localhost:5173

---

## Problem

Industrial machines (such as electric motors, pumps, and compressors) are often used in ways that gradually lead to damage, even when operating within acceptable limits at a given moment.

Existing monitoring systems:
- Rely on static, one-size-fits-all thresholds instead of usage patterns
- Lack contextual understanding of multi-metric degradation over time
- Fail to detect improper usage patterns
- Generate alerts without meaningful resolution workflows

This leads to:
- Hidden degradation and unplanned downtime
- Higher maintenance and repair costs
- Increased risk of failure and reduced machine lifespan

In industrial environments, improper usage patterns often go unnoticed until failure occurs, making early detection critical.

---

## Solution

Nexus Monitor analyzes machine usage patterns over time and classifies behavior into proper (good) and improper (bad) usage states:

- **Good** — optimal operating conditions
- **Warning** — early signs of improper usage, attention required
- **Critical** — high likelihood of damage, immediate intervention needed

Each classification includes:
- ML-based prediction with confidence score
- Human-readable explanation
- Actionable recommendation

---

## Core Innovation

- Unlike traditional monitoring systems, Nexus Monitor identifies improper machine usage patterns even when individual sensor values remain within acceptable limits.
- By combining ML classification with short-term trend analysis, the system detects gradual degradation before it becomes a critical failure.

---

## Key Features

- **Real-time dashboard** — live sensor readings, ML classification, system health score
- **ML-powered classification** — RandomForestClassifier trained on temperature, current, RPM, and vibration patterns
- **Usage pattern analysis** — evaluates how machine parameters evolve over time, not just instantaneous values
- **Predictive warnings** — trend analysis detects failure risk before hard thresholds are hit
- **Contextual alert system** — alerts include model-generated reason and recommendation, not just threshold breach messages
- **Simulate Alert** — one-click anomaly injection for live demo and testing
- **Operator resolution workflow** — alerts can only be resolved when the machine returns to normal
- **Analytics page** — aggregate good/warning/bad distributions and sensor averages
- **Device management** — add, edit, delete, and group machines with full CRUD
- **Replay mode** — scrub through the last 60 sensor readings per machine

---

## How It Works

```
1. Industrial machines (e.g., motors) generate simulated sensor data every 2 seconds:
   Temperature · Current · RPM · Vibration

2. A RandomForest ML model classifies each reading:
   Good / Warning / Critical  +  confidence score  +  human reason

3. Trend analysis scans the last 5 readings:
   → Detects worsening usage patterns before hard thresholds are hit
   → Identifies improper usage before damage occurs

4. Alerts fire when:
   → Temperature > 75°C  (critical)
   → Vibration > 6 mm/s  (warning)
   → ML label == Critical (critical)
   → Sustained abnormal trends are detected

5. Each alert carries:
   → Reason:  "Motor A: Detected elevated temperature (82°C), high current draw (14A)"
   → Action:  "Motor A requires immediate inspection — elevated temperature and
               excessive current draw detected simultaneously"

6. Alerts resolve only when:
   → Machine metrics return to safe range
   → Operator acknowledges the resolved alert
```

---

## Screenshots

<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/c4328e89-ad7f-4ad7-afd1-5b77ed07d26a" />
<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/1721c00b-5c49-4fdf-bc6d-f8f46050e2d2" />
<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/4020cec6-96dd-4f3b-92f3-2f4707c3528d" />
<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/eecf6275-23ac-4268-ae49-318e5cf09fed" />

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Charts | Chart.js + react-chartjs-2 |
| Backend | FastAPI 0.111 (Python 3.12) |
| ML Model | scikit-learn — RandomForestClassifier |
| Data | NumPy · Pandas |
| Server | Uvicorn (ASGI) |

---

## Project Structure

```
NexusMonitor/
├── Backend/
│   ├── main.py                  # FastAPI app, CORS, startup
│   ├── requirements.txt
│   ├── routes/
│   │   ├── sensors.py           # Simulation engine + alert creation
│   │   ├── alerts.py            # Alert CRUD + ack endpoints
│   │   ├── machines.py          # Machine CRUD
│   │   └── analytics.py        # Aggregate stats
│   ├── models/
│   │   └── predictor.py         # RandomForest training + predict()
│   ├── database/
│   │   └── db.py                # In-memory store + alert dedup logic
│   └── schemas/
│       └── response.py
│
└── Frontend/
    └── src/
        ├── pages/
        │   ├── Dashboard.jsx    # Health score + AI recommendations
        │   ├── Realtime.jsx     # Per-machine live gauges + replay
        │   ├── Alerts.jsx       # Full alert center with filters
        │   ├── MachineList.jsx  # Device management
        │   ├── Analytics.jsx    # Aggregate charts
        │   └── MachineDetail.jsx
        ├── components/
        │   ├── Sidebar.jsx      # Nav + live alert badge
        │   ├── Navbar.jsx       # Sim controls + clock
        │   ├── Chart.jsx
        │   └── Toast.jsx
        └── context/
            └── SimulationContext.jsx  # Global simulation state
```

---

## Prerequisites

| Tool | Required Version |
|---|---|
| Python | **3.12** |
| Node.js | **18 or higher** |
| npm | 9 or higher (bundled with Node 18+) |

> **Check your versions before starting:**
> ```bash
> python --version   # should print Python 3.12.x
> node -v            # should print v18.x.x or higher
> npm -v             # should print 9.x.x or higher
> ```

---

## How to Run

### 1. Clone the repository

```bash
git clone https://github.com/Nikhil00211/good-bad-analyzer.git
cd good-bad-analyzer
```

### 2. Backend Setup

```bash
cd Backend

# Create a virtual environment
python -3.12 -m venv venv
# or
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn main:app --reload
```

Backend runs at: `http://localhost:8000`  
Auto-generated API docs: `http://localhost:8000/docs`

### 3. Frontend Setup

Open a **new terminal window** and run:

```bash
cd Frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Demo Flow

| Step | Action | What to Expect |
|---|---|---|
| 1 | Open `http://localhost:5173` | Dashboard loads, all machines in normal state |
| 2 | Click **START SIM** in the top bar | Metrics update every 2 seconds |
| 3 | Watch the **Dashboard** | Health score updates, AI Recommendations panel populates |
| 4 | Click **SIM ALERT** | A random machine enters overload immediately |
| 5 | Navigate to **Alerts** | New alert appears with reason and AI recommendation |
| 6 | Wait ~4 seconds | Machine auto-recovers, alert moves to RECOVERED state |
| 7 | Click **ACK** on the alert | Alert is acknowledged and archived |
| 8 | Go to **Realtime** | Select a machine to see live gauges and replay history |
| 9 | Go to **Analytics** | View aggregate Good/Warning/Bad breakdown |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/machines` | List all machines |
| POST | `/machines` | Add a new machine |
| PUT | `/machines/{id}` | Update machine details |
| DELETE | `/machines/{id}` | Remove a machine |
| GET | `/realtime/{id}` | Live reading + ML prediction |
| GET | `/machines/{id}/history` | Last 60 sensor readings (replay) |
| PUT | `/simulate-alert` | Trigger instant overload on a random machine |
| PUT | `/machines/{id}/simulate-bad` | Force a specific machine into overload for 60 s |
| GET | `/alerts` | All alerts (newest first) |
| GET | `/alerts/stats` | Critical / warning / unack counts |
| PUT | `/alerts/{id}/ack` | Acknowledge an alert |
| GET | `/analytics` | Aggregate sensor + classification stats |

---

## Usage Pattern Analysis

Unlike traditional monitoring systems, Nexus Monitor evaluates how machine parameters evolve over time rather than reacting to individual threshold breaches.

Examples of improper usage patterns detected:
- Gradually increasing temperature under constant load
- Sustained high vibration indicating mechanical stress
- Rising current draw without corresponding output

These patterns are classified as improper usage even before critical thresholds are reached, enabling early intervention before damage occurs.

---

## What Makes This Unique

- **Industrial framing** — simulates real motor/pump/compressor behavior, not generic CPU metrics
- **Usage pattern focus** — classifies proper vs improper machine usage over time, not just instantaneous anomalies
- **Gradual degradation model** — values drift toward failure targets using exponential smoothing, not instant spikes
- **Predictive warnings** — trend analysis across the last 5 readings identifies failure risk before thresholds are crossed
- **AI insight unification** — alerts and the dashboard panel share the exact same ML output so explanations are always consistent
- **Realistic resolution workflow** — alerts cannot be force-closed; they resolve only when the underlying condition clears

---

## Potential Impact

- Detects improper machine usage before damage occurs
- Reduces downtime through early intervention
- Improves maintenance efficiency
- Extends machine lifespan

In industrial environments, even brief undetected overload conditions can result in significant operational and financial loss.

---

## Future Improvements

- Integration with real IoT sensor hardware (MQTT / OPC-UA)
- Persistent storage with PostgreSQL
- User authentication and role-based access (Admin / Operator)
- Export alerts and analytics as PDF / CSV reports
- Mobile-responsive layout

---
