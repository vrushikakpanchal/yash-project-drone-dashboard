## AI-Enabled Drone Thrust Measurement System

### 1. Project idea (in simple words)

This project is a **dashboard for testing drone motors**.

It shows:

- How much **thrust** the motor is making (push/force)
- How fast it is spinning (**RPM**)
- How much **voltage, current, and power** it is using
- Simple **AI-based health checks** that say if the motor looks normal, risky, or close to failure

You open a web page, start the test, and see live gauges and charts that update in real time.

The project has two main parts:

- **Frontend (Next.js)** – the web page you see in the browser.
- **Backend (FastAPI + ML microservices)** – the engine that creates data, runs AI models, and sends results to the frontend.

---

### 2. What problem does it solve?

Testing drone motors today often means:

- Using separate tools (scales, meters, spreadsheets)
- Writing down numbers by hand
- Manually checking if values “look ok”
- Spending a lot of time to understand when a motor is getting unhealthy

This project solves that by:

- Showing **all important values in one simple dashboard**
- Updating the data **live**, many times each second
- Using **AI models** in the background to:
  - Spot strange patterns (anomalies)
  - Estimate motor **health**
  - Estimate **remaining useful life (RUL)**

So an engineer, student, or hobbyist can **quickly see** if a drone motor is performing well or if there might be a problem.

---

### 3. How it works (step by step, high level)

1. **Motor and sensors**  
   A motor test stand (real or simulated) provides sensor values such as:
   - Thrust
   - RPM
   - Voltage
   - Current
   - Power

2. **Backend collects and analyzes data**  
   The **backend** (FastAPI + Python ML code) does the following:
   - Reads or simulates the sensor data at a regular speed using `get_motor_data_snapshot`
   - Builds a “feature set” from these numbers
   - Uses trained **AI/ML models** to:
     - Estimate thrust
     - Detect anomalies
     - Estimate health and remaining life
   - Keeps short histories of these values so they can be used for graphs

3. **Backend exposes APIs and a WebSocket**  
   The backend:
   - Offers **HTTP endpoints** (URLs) for:
     - Health checks
     - Analysis data for charts
     - Starting and stopping the live data stream
   - Offers a **WebSocket** endpoint for:
     - Pushing live sensor and analysis data to the frontend in real time

4. **Frontend connects to the backend**  
   The **frontend** (Next.js app) does this:
   - Reads the backend URLs from environment variables
   - Connects to the backend WebSocket at `/ws/motor-data`
   - Sends a “start stream” request when you begin a test
   - Listens for incoming data messages

5. **Dashboard updates live**  
   As data comes in from the backend:
   - The dashboard updates:
     - **Thrust gauge** (value in grams, g)
     - **RPM gauge**
     - **Voltage, current, and power** cards
   - Other components show:
     - AI health status
     - Anomaly warnings
     - Historical graphs and logs

6. **User observes and decides**  
   You watch:
   - If thrust increases as expected
   - If RPM, current, and power are in the right range
   - If the AI says the motor is healthy or at risk  
   Then you can change test conditions or stop the stream.

---

### 4. What inputs does the user give?

From a normal user point of view, inputs are simple:

- **Before running:**
  - Make sure the backend is running on your machine
  - Make sure the frontend `.env.local` file points to the backend (URL and port)

- **On the dashboard:**
  - Use the **control panel** (`ControlStatus` component) to:
    - Start the live data stream
    - Stop the live data stream
    - Trigger an emergency stop (sets throttle to 0 and fetches final analysis)
  - Change **physical test conditions** on the rig (for example, throttle level) if you have a real motor setup

You do **not** need to write code to use the dashboard after it is set up.

---

### 5. What outputs does the user see?

On the dashboard you see:

- **Real-time gauges**
  - **Thrust gauge** in grams (g)
  - **RPM gauge** showing how fast the motor spins

- **Electrical readings**
  - **Voltage** (V)
  - **Current** (A)
  - **Power** (W)

- **AI analysis panels** (depending on the exact components used)
  - Motor **health score**
  - **Anomaly status** (normal / warning / abnormal)
  - **Remaining useful life** estimate
  - Fault type information (if the model supports it)

- **Graphs and logs**
  - Historical plots of values over time
  - Logs that can be used for deeper analysis

If the backend is not running or not reachable, gauges stay at zero and the page may show errors in the browser console.

---

### 6. Key features (non-technical summary)

- **Live dashboard**  
  See thrust, RPM, and electrical values that update automatically.

- **AI-powered health checks**  
  AI models watch the data and flag abnormal behavior and motor wear.

- **Combined view**  
  All important information is in one place: no manual copying into spreadsheets.

- **Web-based**  
  Runs in a browser. You can use it on the same computer as the test stand or across a local network (if configured).

- **Data logging and graphs**  
  Stores and shows past values for better understanding, not just instant snapshots.

---

### 7. Real-world applications

Some ways this project can be used:

- **Drone motor testing benches** – check motor performance under different loads.
- **R&D labs** – experiment with new motor and propeller combinations.
- **Production quality control** – quickly screen motors before shipping.
- **Education and training** – teach students about thrust, power, and predictive maintenance.
- **Field diagnostics** – debug strange behavior in drones by simulating or replaying runs.

---

### 8. System overview (slightly technical, still simple)

#### 8.1 Frontend (Next.js)

- Located in the `frontend-revised` folder.
- Built with **Next.js** (React).
- Main page file:  
  - `src/app/page.jsx` – defines the dashboard layout:
    - Title: “AI-Enabled Drone Thrust Measurement System”
    - Left sidebar: `ControlStatus` component
    - Main area: `RealTimeData`, `IMUAnalysis`, and `DataLogGraph`
- Key components (inside `src/components`):
  - `ControlStatus.jsx` – controls to start/stop streaming, change throttle, and show connection status.
  - `RealTimeData.jsx` – shows thrust, RPM, and electric readings using gauges and cards.
  - `DataLogGraph.jsx` – shows time-series graphs and logs (historical view).
  - `IMUAnalysis.jsx` and `AnalysisCharts.jsx` – show analysis and chart views.
- Uses a **WebSocket context**:
  - `WebSocketContext` in `src/context/WebSocketContext.jsx` manages:
    - The WebSocket connection to the backend (`WS_CONFIG.WS_URL`)
    - HTTP calls to `/start-stream`, `/stop-stream`, and `/analysis-data`
    - Shared `sensorData`, `throttle`, `logs`, `history`, and analysis data for all components.

#### 8.2 Backend (FastAPI + microservices)

- Located in the `backend` folder.
- Main FastAPI app:
  - File: `backend/app.py`
  - Run with: `uvicorn app:app --reload`
- The backend does:
  - Loads environment variables using `python-dotenv`.
  - Sets up **CORS** (cross-origin settings) so the frontend can talk to it:
    - Allowed origins are taken from `ALLOWED_ORIGINS` (default `http://localhost:3000`).
  - Uses a `WebSocketManager` class to:
    - Track active WebSocket connections
    - Start and stop the real-time data stream
    - Keep analysis buffers for thrust, anomaly, and health over time
  - Calls helper code under `backend/microservices/src` to:
    - Generate or read motor data snapshots via `get_motor_data_snapshot`
    - Run AI/ML models (for thrust, anomalies, health, RUL, etc.)

- Main backend technologies:
  - **FastAPI** for HTTP and WebSocket endpoints
  - **Uvicorn** for running the server
  - **Pandas, NumPy, scikit-learn, joblib** for AI and data handling


