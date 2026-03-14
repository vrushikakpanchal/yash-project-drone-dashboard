# AI Drone Thrust Measurement Dashboard

An AI-enabled drone thrust measurement and monitoring dashboard that combines a **Python-based backend simulation + ML inference pipeline** with a **React/Next.js real-time visualization interface**.

The system simulates motor dynamics, performs AI-based anomaly and fault detection, and streams telemetry to a live dashboard for **thrust monitoring, electrical analysis, and health diagnostics**.

---

# System Architecture

The project is divided into two primary layers.

```
yash-project-drone-dashboard
│
├── backend/
│   ├── app.py
│   └── microservices/
│       ├── src/
│       ├── models/
│       └── logs/
│
└── frontend-revised/
    └── src/
        ├── components/
        ├── context/
        └── app/
```

---

# Backend (backend/)

Responsible for **simulation, AI inference, and telemetry streaming**.

### Key Components

- **API Server**  
  `app.py` (FastAPI + WebSocket)

- **Realtime Simulation + Inference Engine**  
  `microservices/src/realtime_pi_inference.py`

- **ML Models and Scalers**  
  `microservices/models/*.pkl`

### Backend Outputs

- WebSocket telemetry stream → `/ws/motor-data`
- Session analysis data → `/analysis-data`
- CSV log → `microservices/logs/health_log.csv`

---

# Frontend (frontend-revised/)

Responsible for **real-time monitoring, visualization, and AI insights display**.

### Core Components

| Component | Purpose |
|--------|--------|
| WebSocketContext.jsx | WebSocket lifecycle and data orchestration |
| RealTimeData.jsx | Live thrust and RPM gauges |
| DataLogGraph.jsx | Trend charts and telemetry logs |
| ControlStatus.jsx | Throttle control and simulation start/stop |
| IMUAnalysis.jsx | IMU visualization and AI insights |

### 3D Visualization Components

```
src/components/imu3d/
├── IMUDronePanel.jsx
├── DroneScene.jsx
└── DroneModel.jsx
```

---

# Backend Mechanism

## Model Initialization

During startup, the backend loads trained ML models and scalers:

- thrust_model
- anomaly_model
- fault_model

Feature metadata is loaded from:

```
model_metadata.json
```

Runtime state variables include:

- throttle
- current_rpm
- health history buffers
- degradation history

---

# Motor Dynamics Simulation

The frontend sends **throttle commands (0–100%)** through WebSocket.

Backend calculates target RPM:

```
target_rpm = (throttle / 100) * 8000
```

Smooth motor response:

```
current_rpm += (target_rpm - current_rpm) * 0.15
```

Noise is added to simulate real-world motor behavior.

---

# Electrical and Physics Modeling

Each telemetry cycle computes electrical and mechanical parameters.

### Current Model

```
base_current = (rpm / MAX_RPM)^2 * 20
```

### Voltage Sag

```
base_voltage = 14.8 - current * 0.04
```

### Electrical Power

```
power = voltage * current
```

### Vibration Model

```
vibration ≈ 0.00008 * rpm + noise
```

### Temperature Model

```
temperature = 25 + current * 0.5 + noise
```

### Thrust Model

```
thrust_kgf = (rpm / MAX_RPM)^2 * 2.0
```

Small measurement noise is introduced for realism.

---

# Feature Engineering

The backend constructs ML features from telemetry.

### Raw Features

- rpm
- voltage_v
- current_a
- power_w
- vibration_rms
- temperature_c

### Derived Features

- thrust_gradient
- current_gradient

These features are used for ML inference.

---

# AI Inference Pipeline

Each telemetry packet passes through multiple AI analysis stages.

### 1. Thrust Prediction
Regression model estimates thrust.

### 2. Anomaly Detection
Outputs:
- anomaly prediction
- severity score

### 3. Health Monitoring

System health adjusts dynamically:

- anomalies decrease health
- normal behavior slowly recovers health

### 4. Degradation Trend Classification

Possible states:

- STABLE
- WARN SLOW DEGRADATION
- WARN RAPID DEGRADATION

### 5. Fault Classification

Possible faults:

- Normal
- Bearing Fault
- Overcurrent Fault
- Propeller Imbalance

### 6. Remaining Useful Life (RUL)

Estimated from historical degradation patterns.

---

# Data Logging

Each telemetry cycle writes a row to:

```
microservices/logs/health_log.csv
```

Logged fields include:

- timestamp
- rpm
- thrust
- anomaly severity
- health score
- degradation trend
- fault type
- RUL estimate

UTF-8 encoding ensures cross-platform compatibility.

---

# FastAPI Service Layer

### REST Endpoints

| Endpoint | Purpose |
|--------|--------|
| /health | Backend health check |
| /start-stream | Start telemetry streaming |
| /stop-stream | Stop telemetry streaming |
| /analysis-data | Retrieve session analysis |
| /get-data | System metadata and status |

---

# WebSocket Endpoint

```
/ws/motor-data
```

Responsibilities:

- receive throttle commands from frontend
- broadcast telemetry packets
- support multiple client connections

---

# Streaming Loop

`WebSocketManager._stream_motor_data()` performs:

1. Generate motor telemetry snapshot
2. Append packet to session analysis buffers
3. Broadcast telemetry packet to clients
4. Sleep until next cycle

This creates **continuous real-time telemetry streaming**.

---

# Frontend Real-Time Flow

## WebSocket Context

`WebSocketContext.jsx` manages:

- backend discovery and fallback
- websocket connection lifecycle
- automatic reconnect
- throttle transmission
- payload normalization
- UI smoothing
- analysis retrieval after simulation

---

# Control and Visualization UI

### Control Panel

`ControlStatus.jsx`

Features:

- throttle slider
- start simulation
- stop simulation
- emergency stop

---

### Live Dashboard

`RealTimeData.jsx`

Displays:

- thrust gauge
- RPM gauge
- voltage
- current
- power metrics

---

### Trend Analysis

`DataLogGraph.jsx`

Provides:

- live telemetry charts
- textual log feed
- session analysis charts

---

# IMU and AI Visualization

## Data Source Handling

`IMUAnalysis.jsx` maps telemetry data to the IMU panel.

Behavior:

- uses real IMU values when available
- simulated IMU fallback during streaming
- neutral orientation when idle

---

# 3D Drone Visualization

Uses:

- three.js
- @react-three/fiber
- @react-three/drei

### Interaction

- Left drag → orbit
- Right drag → pan
- Scroll → zoom
- Reset camera button

### Orientation Mapping

```
Roll  -> Z axis
Pitch -> X axis
Yaw   -> Y axis
```

Damped rotation updates ensure stable motion.

---

# AI Insights Panel

The IMU panel displays diagnostic insights:

- anomaly status
- severity level
- health percentage
- remaining useful life
- detected fault type

Color-coded indicators highlight anomaly severity.

---

# End-to-End Real-Time Workflow

1. User adjusts throttle in UI
2. Throttle command is sent via WebSocket
3. Backend updates motor simulation
4. Motor physics and electrical behavior are simulated
5. AI inference evaluates system health
6. Backend broadcasts telemetry packet
7. Frontend receives and normalizes values
8. Gauges, charts, and IMU visualization update
9. After simulation stop, session analysis becomes available

---

# Engineering Safeguards

The system includes reliability mechanisms:

- streaming loop protected from runtime failures
- fallback logic for missing fault labels
- UTF-8 logging compatibility
- backend URL fallback handling
- automatic WebSocket reconnection
- responsive UI safeguards

---

# System Concept

This platform represents a **digital twin + AI monitoring stack**.

### Control Layer
User throttle input.

### Physical Simulation Layer

Simulates:

- RPM
- current
- voltage
- thrust
- vibration
- temperature

### AI Diagnostics Layer

Performs:

- anomaly detection
- fault classification
- health monitoring
- RUL estimation

### Visualization Layer

Displays:

- thrust gauges
- electrical metrics
- trend charts
- 3D IMU scene

### Analytics Layer

Session analysis provides deeper diagnostic insights after simulation.
