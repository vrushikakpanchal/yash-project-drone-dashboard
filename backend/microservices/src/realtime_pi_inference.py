import time
import joblib
import json
import pandas as pd
import numpy as np
import warnings
from collections import deque
import os 
from datetime import datetime

throttle = 0
current_rpm = 0

warnings.filterwarnings(
    "ignore",
    message=r"`sklearn\.utils\.parallel\.delayed` should be used with `sklearn\.utils\.parallel\.Parallel`.*",
    category=UserWarning,
)

def set_throttle(new_value):
    """Safely updates the global throttle from external modules"""
    global throttle
    throttle = max(0.0, min(100.0, float(new_value)))

os.makedirs("microservices/logs", exist_ok=True)
log_file_path = "microservices/logs/health_log.csv"
if not os.path.exists(log_file_path):
    with open(log_file_path, "w", encoding="utf-8") as f:
        f.write("timestamp,rpm,thrust,severity,health,trend,fault_type,rul\n")

fault_model = joblib.load("microservices/models/fault_classifier.pkl")
fault_scaler = joblib.load("microservices/models/fault_scaler.pkl")

thrust_model = joblib.load("microservices/models/thrust_model.pkl")
thrust_scaler = joblib.load("microservices/models/scaler.pkl")

anomaly_model = joblib.load("microservices/models/anomaly_model.pkl")
anomaly_scaler = joblib.load("microservices/models/anomaly_scaler.pkl")

for model in (fault_model, anomaly_model):
    if hasattr(model, "set_params"):
        try:
            model.set_params(n_jobs=1)
        except ValueError:
            pass

with open("microservices/models/model_metadata.json") as f:
    metadata = json.load(f)

FEATURE_COLUMNS = metadata["feature_columns"]

print("\n=== MODEL PERFORMANCE ===")
print("RMSE:", round(metadata["rmse"], 4))
print("MAE :", round(metadata["mae"], 4))
print("R2  :", round(metadata["r2"], 4))
print("==========================\n")

rpm_buffer = deque(maxlen=5)
current_buffer = deque(maxlen=5)
thrust_buffer = deque(maxlen=5)

health_score = 100.0
health_history = deque(maxlen=50)
RUL_hours = 100.0   # initial estimated useful life

def compute_gradient(buffer):
    if len(buffer) < 2:
        return 0.0
    return buffer[-1] - buffer[-2]


def build_feature_dict(rpm, voltage, current, vibration, temperature):

    power_w = voltage * current

    rpm_buffer.append(rpm)
    current_buffer.append(current)

    thrust_estimate = 0.00000002 * (rpm ** 2)
    thrust_buffer.append(thrust_estimate)

    thrust_gradient = compute_gradient(thrust_buffer)
    current_gradient = compute_gradient(current_buffer)

    return {
        "rpm": rpm,
        "voltage_v": voltage,
        "current_a": current,
        "power_w": power_w,
        "vibration_rms": vibration,
        "temperature_c": temperature,
        "thrust_gradient": thrust_gradient,
        "current_gradient": current_gradient
    }


def predict_thrust(feature_dict):
    ordered = [feature_dict[col] for col in FEATURE_COLUMNS]
    df = pd.DataFrame([ordered], columns=FEATURE_COLUMNS)
    scaled = thrust_scaler.transform(df)
    return thrust_model.predict(scaled)[0]


def detect_anomaly(feature_dict):
    ordered = [feature_dict[col] for col in FEATURE_COLUMNS]
    df = pd.DataFrame([ordered], columns=FEATURE_COLUMNS)
    scaled = anomaly_scaler.transform(df)

    prediction = anomaly_model.predict(scaled)[0]
    severity_score = anomaly_model.decision_function(scaled)[0]

    return prediction, severity_score


def update_health(anomaly_flag, severity):
    global health_score, health_history

    if anomaly_flag == -1:
        penalty = min(abs(severity) * 10, 3.0)
        health_score -= penalty
    else:
        health_score += 0.05  # slower recovery

    health_score = max(0, min(100, health_score))

    health_history.append(health_score)

    return health_score

def check_health_trend():

    if len(health_history) < 10:
        return "STABLE"

    trend = health_history[-1] - health_history[0]

    if trend < -10:
        return "WARN RAPID DEGRADATION"
    elif trend < -3:
        return "WARN SLOW DEGRADATION"
    else:
        return "STABLE"
    
def estimate_rul():

    global RUL_hours, health_history

    if len(health_history) < 10:
        return RUL_hours

    degradation_rate = (health_history[0] - health_history[-1]) / len(health_history)

    if degradation_rate > 0:
        estimated_cycles_left = health_score / degradation_rate
        RUL_hours = max(0, estimated_cycles_left * 0.01)

    return RUL_hours

def classify_fault_ml(feature_dict):

    ordered = [feature_dict[col] for col in FEATURE_COLUMNS]
    df = pd.DataFrame([ordered], columns=FEATURE_COLUMNS)
    scaled = fault_scaler.transform(df)

    label = fault_model.predict(scaled)[0]

    mapping = {
        0: "Normal",
        1: "Bearing Fault",
        2: "Overcurrent Fault",
        3: "Prop Imbalance"
    }

    try:
        return mapping.get(int(label), "Unknown Fault")
    except (TypeError, ValueError):
        return "Unknown Fault"

def log_data(rpm, thrust, severity, health, trend, fault_type, rul):

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    with open(log_file_path, "a", encoding="utf-8") as f:
        f.write(
            f"{timestamp},{rpm},{thrust:.4f},{severity:.4f},"
            f"{health:.2f},{trend},{fault_type},{rul:.2f}\n"
        )

current_rpm = 1000
rpm_direction = 1

def get_motor_data_snapshot():
    """Generate a single snapshot of motor data for WebSocket streaming"""
    
    global current_rpm, rpm_direction, throttle

    MAX_RPM = 8000

    # target RPM from throttle
    target_rpm = (throttle / 100) * 8000

    # smooth motor response
    rpm_change = (target_rpm - current_rpm) * 0.15
    current_rpm += rpm_change

    # realistic idle behaviour
    if throttle > 0 and current_rpm < 800:
        current_rpm = 800

    # RPM noise only when spinning
    if current_rpm > 100:
        current_rpm += np.random.normal(0, 5)

    # strict RPM bounds
    current_rpm = max(0.0, min(MAX_RPM, current_rpm))

    # ---------------- CURRENT MODEL ----------------
    # propeller load ~ quadratic relation
    base_current = (current_rpm / MAX_RPM) ** 2 * 20

    if current_rpm > 100:
        current = base_current + np.random.normal(0, 0.2)
    else:
        current = 0.0

    current = max(0.0, current)

    # ---------------- VOLTAGE SAG ----------------
    base_voltage = 14.8 - (current * 0.04)
    voltage = base_voltage + np.random.normal(0, 0.015)

    voltage = max(13.5, min(14.8, voltage))

    # ---------------- VIBRATION ----------------
    base_vibration = 0.00008 * current_rpm

    if current_rpm > 100:
        vibration = base_vibration + np.random.normal(0, 0.015)
    else:
        vibration = 0.0

    vibration = max(0.0, vibration)

    # ---------------- TEMPERATURE ----------------
    temperature = 25 + current * 0.5 + np.random.normal(0, 0.1)

    # ---------------- THRUST PHYSICS ----------------
    # quadratic propeller thrust model
    thrust_kgf = (current_rpm / MAX_RPM) ** 2 * 2.0

    if current_rpm > 100:
        thrust = thrust_kgf + np.random.normal(0, 0.01)
    else:
        thrust = 0.0

    thrust = max(0.0, thrust)

    # ---------------- FAULT INJECTION ----------------
    if np.random.rand() < 0.03:
        vibration += 2.5

    # ---------------- ML PIPELINE ----------------
    feature_dict = build_feature_dict(
        current_rpm,
        voltage,
        current,
        vibration,
        temperature
    )

    try:
        ml_thrust = predict_thrust(feature_dict)   # kept only for ML pipeline
        anomaly_flag, severity = detect_anomaly(feature_dict)
        current_health = update_health(anomaly_flag, severity)
        trend_status = check_health_trend()
        fault_type = classify_fault_ml(feature_dict)
        rul = estimate_rul()
    except Exception as e:
        # Keep stream alive even if any model stage fails on a sample.
        ml_thrust = thrust
        anomaly_flag, severity = 1, 0.0
        current_health = health_score
        trend_status = "STABLE"
        fault_type = "Unknown Fault"
        rul = RUL_hours
        print(f"[INFERENCE] Non-fatal pipeline error: {e}")

    # ---------------- LOGGING ----------------
    log_data(
        current_rpm,
        thrust,
        severity,
        current_health,
        trend_status,
        fault_type,
        rul
    )

    # ---------------- RETURN DATA ----------------
    return {
        "timestamp": datetime.now().isoformat(),
        "rpm": current_rpm,
        "thrust": round(thrust, 4),
        "severity": round(severity, 4),
        "health": round(current_health, 2),
        "trend": trend_status,
        "fault_type": fault_type,
        "rul": round(rul, 2),
        "voltage": round(voltage, 3),
        "current": round(current, 3),
        "power": round(voltage * current, 3),
        "vibration": round(vibration, 4),
        "temperature": round(temperature, 2),
        "anomaly_status": "ANOMALY" if anomaly_flag == -1 else "NORMAL"
    }

def simulate_motor_test():
    """Original terminal-based simulation for standalone testing"""
    print("Starting Motor Test with Intelligence Layer...\n")
    
    while True:
        data = get_motor_data_snapshot()
        print("SIMULATION THROTTLE:", throttle)
        print(
            f"RPM: {data['rpm']:4.0f} | "
            f"Thrust: {data['thrust']:6.3f} kgf | "
            f"Severity: {data['severity']:6.3f} | "
            f"Health: {data['health']:6.2f} | "
            f"Trend: {data['trend']} | "
            f"Fault: {data['fault_type']} | "
            f"RUL: {data['rul']:6.2f} hrs"
        )
        
        time.sleep(0.5)

if __name__ == "__main__":
    simulate_motor_test()
