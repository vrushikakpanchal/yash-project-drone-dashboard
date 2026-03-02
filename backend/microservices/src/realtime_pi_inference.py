"""The below code is a real-time inference script for predicting thrust based on sensor data from a propulsion system. It reads data from a serial port, processes it, and uses a pre-trained machine learning model to make predictions. The script includes rolling window buffers to compute gradients of features, which can enhance the model's predictive capabilities.
Currently there is no module connected so we are gonna simulate it 
"""

# import serial
# import time
# import joblib
# import json
# import pandas as pd
# import numpy as np
# from collections import deque

# # ==============================
# # Load Model & Scaler
# # ==============================
# model = joblib.load("models/thrust_model.pkl")
# scaler = joblib.load("models/scaler.pkl")

# with open("models/model_metadata.json") as f:
#     metadata = json.load(f)

# FEATURE_COLUMNS = metadata["feature_columns"]

# # ==============================
# # Serial Configuration
# # ==============================
# SERIAL_PORT = "COM5"      # Change to your port (Linux: /dev/ttyUSB0)
# BAUD_RATE = 115200

# # ==============================
# # Rolling Window Buffers
# # ==============================
# rpm_buffer = deque(maxlen=5)
# current_buffer = deque(maxlen=5)
# thrust_buffer = deque(maxlen=5)

# # ==============================
# # Helper Functions
# # ==============================

# def compute_gradient(buffer):
#     if len(buffer) < 2:
#         return 0.0
#     return buffer[-1] - buffer[-2]


# def build_feature_dict(rpm, voltage, current, vibration, temperature):

#     power_w = voltage * current

#     rpm_buffer.append(rpm)
#     current_buffer.append(current)

#     thrust_estimate = 0.00000002 * (rpm ** 2)
#     thrust_buffer.append(thrust_estimate)

#     thrust_gradient = compute_gradient(thrust_buffer)
#     current_gradient = compute_gradient(current_buffer)

#     feature_dict = {
#         "rpm": rpm,
#         "voltage_v": voltage,
#         "current_a": current,
#         "power_w": power_w,
#         "vibration_rms": vibration,
#         "temperature_c": temperature,
#         "thrust_gradient": thrust_gradient,
#         "current_gradient": current_gradient
#     }

#     return feature_dict


# def predict(feature_dict):

#     ordered = [feature_dict[col] for col in FEATURE_COLUMNS]
#     df = pd.DataFrame([ordered], columns=FEATURE_COLUMNS)

#     scaled = scaler.transform(df)
#     prediction = model.predict(scaled)

#     return prediction[0]


# # ==============================
# # Main Real-Time Loop
# # ==============================

# def run():

#     print("Starting Real-Time Inference...")
#     print("Connecting to serial:", SERIAL_PORT)

#     ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
#     time.sleep(2)

#     while True:
#         try:
#             line = ser.readline().decode("utf-8").strip()

#             if not line:
#                 continue

#             values = line.split(",")

#             if len(values) != 5:
#                 continue

#             rpm = float(values[0])
#             voltage = float(values[1])
#             current = float(values[2])
#             vibration = float(values[3])
#             temperature = float(values[4])

#             feature_dict = build_feature_dict(
#                 rpm, voltage, current, vibration, temperature
#             )

#             predicted_thrust = predict(feature_dict)

#             print(f"RPM: {rpm:.0f} | Predicted Thrust: {predicted_thrust:.3f} kgf")

#         except Exception as e:
#             print("Error:", e)


# if __name__ == "__main__":
#     run()

# import time
# import joblib
# import json
# import pandas as pd
# import numpy as np
# from collections import deque

# # ==============================
# # Load Model & Scaler
# # ==============================
# model = joblib.load("models/thrust_model.pkl")
# scaler = joblib.load("models/scaler.pkl")

# with open("models/model_metadata.json") as f:
#     metadata = json.load(f)

# FEATURE_COLUMNS = metadata["feature_columns"]

# # ==============================
# # Rolling Buffers
# # ==============================
# rpm_buffer = deque(maxlen=5)
# current_buffer = deque(maxlen=5)
# thrust_buffer = deque(maxlen=5)

# # ==============================
# # Helper Functions
# # ==============================

# def compute_gradient(buffer):
#     if len(buffer) < 2:
#         return 0.0
#     return buffer[-1] - buffer[-2]


# def build_feature_dict(rpm, voltage, current, vibration, temperature):

#     power_w = voltage * current

#     rpm_buffer.append(rpm)
#     current_buffer.append(current)

#     # Rough thrust estimate for gradient tracking
#     thrust_estimate = 0.00000002 * (rpm ** 2)
#     thrust_buffer.append(thrust_estimate)

#     thrust_gradient = compute_gradient(thrust_buffer)
#     current_gradient = compute_gradient(current_buffer)

#     return {
#         "rpm": rpm,
#         "voltage_v": voltage,
#         "current_a": current,
#         "power_w": power_w,
#         "vibration_rms": vibration,
#         "temperature_c": temperature,
#         "thrust_gradient": thrust_gradient,
#         "current_gradient": current_gradient
#     }


# def predict(feature_dict):
#     ordered = [feature_dict[col] for col in FEATURE_COLUMNS]
#     df = pd.DataFrame([ordered], columns=FEATURE_COLUMNS)
#     scaled = scaler.transform(df)
#     return model.predict(scaled)[0]


# # ==============================
# # Real-Time Simulation Loop
# # ==============================

# def simulate_motor_test():

#     print("Starting Simulated Real-Time Motor Test...\n")

#     rpm = 1000
#     direction = 1  # 1 = ramp up, -1 = ramp down

#     while True:

#         # Simulate RPM ramp
#         rpm += direction * 200

#         if rpm >= 8000:
#             direction = -1
#         if rpm <= 1000:
#             direction = 1

#         # Simulate realistic sensor behavior
#         voltage = 14.8 - (rpm / 8000) * 0.5  # slight voltage sag
#         current = 0.000000000004 * (rpm ** 3) + np.random.normal(0, 0.3)
#         vibration = 0.0001 * rpm + np.random.normal(0, 0.05)
#         temperature = 25 + current * 0.3

#         feature_dict = build_feature_dict(
#             rpm, voltage, current, vibration, temperature
#         )

#         predicted_thrust = predict(feature_dict)

#         print(
#             f"RPM: {rpm:4.0f} | "
#             f"Current: {current:6.2f} A | "
#             f"Predicted Thrust: {predicted_thrust:6.3f} kgf"
#         )

#         time.sleep(0.5)  # 500ms update rate


# if __name__ == "__main__":
#     simulate_motor_test()

#below code is upgraded version of the above code with anomaly detection added in the loop and also simulating anomalies in the data stream

# import time
# import joblib
# import json
# import pandas as pd
# import numpy as np
# from collections import deque

# # ==============================
# # Load Thrust Model
# # ==============================
# thrust_model = joblib.load("models/thrust_model.pkl")
# thrust_scaler = joblib.load("models/scaler.pkl")

# # ==============================
# # Load Anomaly Model
# # ==============================
# anomaly_model = joblib.load("models/anomaly_model.pkl")
# anomaly_scaler = joblib.load("models/anomaly_scaler.pkl")

# with open("models/model_metadata.json") as f:
#     metadata = json.load(f)

# FEATURE_COLUMNS = metadata["feature_columns"]

# # ==============================
# # Buffers
# # ==============================
# rpm_buffer = deque(maxlen=5)
# current_buffer = deque(maxlen=5)
# thrust_buffer = deque(maxlen=5)

# def compute_gradient(buffer):
#     if len(buffer) < 2:
#         return 0.0
#     return buffer[-1] - buffer[-2]


# def build_feature_dict(rpm, voltage, current, vibration, temperature):

#     power_w = voltage * current

#     rpm_buffer.append(rpm)
#     current_buffer.append(current)

#     thrust_estimate = 0.00000002 * (rpm ** 2)
#     thrust_buffer.append(thrust_estimate)

#     thrust_gradient = compute_gradient(thrust_buffer)
#     current_gradient = compute_gradient(current_buffer)

#     return {
#         "rpm": rpm,
#         "voltage_v": voltage,
#         "current_a": current,
#         "power_w": power_w,
#         "vibration_rms": vibration,
#         "temperature_c": temperature,
#         "thrust_gradient": thrust_gradient,
#         "current_gradient": current_gradient
#     }


# def predict_thrust(feature_dict):
#     ordered = [feature_dict[col] for col in FEATURE_COLUMNS]
#     df = pd.DataFrame([ordered], columns=FEATURE_COLUMNS)
#     scaled = thrust_scaler.transform(df)
#     return thrust_model.predict(scaled)[0]


# def detect_anomaly(feature_dict):
#     ordered = [feature_dict[col] for col in FEATURE_COLUMNS]
#     df = pd.DataFrame([ordered], columns=FEATURE_COLUMNS)
#     scaled = anomaly_scaler.transform(df)
#     result = anomaly_model.predict(scaled)
#     return result[0]  # -1 = anomaly, 1 = normal


# # ==============================
# # Simulation Loop
# # ==============================

# def simulate_motor_test():

#     print("Starting Simulated Motor Test with Anomaly Detection...\n")

#     rpm = 1000
#     direction = 1

#     while True:

#         rpm += direction * 200

#         if rpm >= 8000:
#             direction = -1
#         if rpm <= 1000:
#             direction = 1

#         voltage = 14.8 - (rpm / 8000) * 0.5
#         current = 0.000000000004 * (rpm ** 3) + np.random.normal(0, 0.3)
#         vibration = 0.0001 * rpm + np.random.normal(0, 0.05)
#         temperature = 25 + current * 0.3

#         # 🔥 Inject anomaly randomly
#         if np.random.rand() < 0.03:
#             vibration += 3  # big vibration spike

#         feature_dict = build_feature_dict(
#             rpm, voltage, current, vibration, temperature
#         )

#         thrust = predict_thrust(feature_dict)
#         anomaly_flag = detect_anomaly(feature_dict)

#         status = "NORMAL"
#         if anomaly_flag == -1:
#             status = "⚠ ANOMALY DETECTED"

#         print(
#             f"RPM: {rpm:4.0f} | "
#             f"Thrust: {thrust:6.3f} kgf | "
#             f"Status: {status}"
#         )

#         time.sleep(0.5)


# if __name__ == "__main__":
#     simulate_motor_test()


# below code is upgraded version of the above code with health score added to track the overall health of the system based on anomaly severity and also simulating anomalies in the data stream

# import time
# import joblib
# import json
# import pandas as pd
# import numpy as np
# from collections import deque

# # ==============================
# # Load Models
# # ==============================
# thrust_model = joblib.load("models/thrust_model.pkl")
# thrust_scaler = joblib.load("models/scaler.pkl")

# anomaly_model = joblib.load("models/anomaly_model.pkl")
# anomaly_scaler = joblib.load("models/anomaly_scaler.pkl")

# with open("models/model_metadata.json") as f:
#     metadata = json.load(f)

# FEATURE_COLUMNS = metadata["feature_columns"]

# print("\n=== MODEL PERFORMANCE ===")
# print("RMSE:", round(metadata["rmse"], 4))
# print("MAE :", round(metadata["mae"], 4))
# print("R2  :", round(metadata["r2"], 4))
# print("==========================\n")

# # ==============================
# # Buffers
# # ==============================
# rpm_buffer = deque(maxlen=5)
# current_buffer = deque(maxlen=5)
# thrust_buffer = deque(maxlen=5)

# # ==============================
# # Health Score
# # ==============================
# health_score = 100.0


# def compute_gradient(buffer):
#     if len(buffer) < 2:
#         return 0.0
#     return buffer[-1] - buffer[-2]


# def build_feature_dict(rpm, voltage, current, vibration, temperature):

#     power_w = voltage * current

#     rpm_buffer.append(rpm)
#     current_buffer.append(current)

#     thrust_estimate = 0.00000002 * (rpm ** 2)
#     thrust_buffer.append(thrust_estimate)

#     thrust_gradient = compute_gradient(thrust_buffer)
#     current_gradient = compute_gradient(current_buffer)

#     return {
#         "rpm": rpm,
#         "voltage_v": voltage,
#         "current_a": current,
#         "power_w": power_w,
#         "vibration_rms": vibration,
#         "temperature_c": temperature,
#         "thrust_gradient": thrust_gradient,
#         "current_gradient": current_gradient
#     }


# def predict_thrust(feature_dict):
#     ordered = [feature_dict[col] for col in FEATURE_COLUMNS]
#     df = pd.DataFrame([ordered], columns=FEATURE_COLUMNS)
#     scaled = thrust_scaler.transform(df)
#     return thrust_model.predict(scaled)[0]


# def detect_anomaly(feature_dict):
#     ordered = [feature_dict[col] for col in FEATURE_COLUMNS]
#     df = pd.DataFrame([ordered], columns=FEATURE_COLUMNS)
#     scaled = anomaly_scaler.transform(df)

#     prediction = anomaly_model.predict(scaled)[0]
#     severity_score = anomaly_model.decision_function(scaled)[0]

#     return prediction, severity_score


# def update_health(anomaly_flag, severity):
#     global health_score

#     if anomaly_flag == -1:
#         # More negative severity = more abnormal
#         penalty = min(abs(severity) * 10, 2.5)
#         health_score -= penalty
#     else:
#         # Slow recovery if stable
#         health_score += 0.1

#     health_score = max(0, min(100, health_score))
#     return health_score


# # ==============================
# # Simulation Loop
# # ==============================

# def simulate_motor_test():

#     print("Starting Motor Test with Intelligence Layer...\n")

#     rpm = 1000
#     direction = 1

#     while True:

#         rpm += direction * 200

#         if rpm >= 8000:
#             direction = -1
#         if rpm <= 1000:
#             direction = 1

#         voltage = 14.8 - (rpm / 8000) * 0.5
#         current = 0.000000000004 * (rpm ** 3) + np.random.normal(0, 0.3)
#         vibration = 0.0001 * rpm + np.random.normal(0, 0.05)
#         temperature = 25 + current * 0.3

#         # Inject random anomaly
#         if np.random.rand() < 0.03:
#             vibration += 3

#         feature_dict = build_feature_dict(
#             rpm, voltage, current, vibration, temperature
#         )

#         thrust = predict_thrust(feature_dict)

#         anomaly_flag, severity = detect_anomaly(feature_dict)
#         current_health = update_health(anomaly_flag, severity)

#         status = "NORMAL"
#         if anomaly_flag == -1:
#             status = "⚠ ANOMALY"

#         print(
#             f"RPM: {rpm:4.0f} | "
#             f"Thrust: {thrust:6.3f} kgf | "
#             f"Severity: {severity:6.3f} | "
#             f"Health: {current_health:6.2f} | "
#             f"Status: {status}"
#         )

#         time.sleep(0.5)


# if __name__ == "__main__":
#     simulate_motor_test()

"""same code minor changes"""

import time
import joblib
import json
import pandas as pd
import numpy as np
from collections import deque
import os 
from datetime import datetime

# ==============================
# Data Logging
# ==============================
os.makedirs("microservices/logs", exist_ok=True)
log_file_path = "microservices/logs/health_log.csv"
if not os.path.exists(log_file_path):
    with open(log_file_path, "w") as f:
        f.write("timestamp,rpm,thrust,severity,health,trend,fault_type,rul\n")
# ==============================
# Load Models
# ==============================

fault_model = joblib.load("microservices/models/fault_classifier.pkl")
fault_scaler = joblib.load("microservices/models/fault_scaler.pkl")

thrust_model = joblib.load("microservices/models/thrust_model.pkl")
thrust_scaler = joblib.load("microservices/models/scaler.pkl")

anomaly_model = joblib.load("microservices/models/anomaly_model.pkl")
anomaly_scaler = joblib.load("microservices/models/anomaly_scaler.pkl")

with open("microservices/models/model_metadata.json") as f:
    metadata = json.load(f)

FEATURE_COLUMNS = metadata["feature_columns"]

print("\n=== MODEL PERFORMANCE ===")
print("RMSE:", round(metadata["rmse"], 4))
print("MAE :", round(metadata["mae"], 4))
print("R2  :", round(metadata["r2"], 4))
print("==========================\n")

# ==============================
# Buffers
# ==============================
rpm_buffer = deque(maxlen=5)
current_buffer = deque(maxlen=5)
thrust_buffer = deque(maxlen=5)

# ==============================
# Health Score
# ==============================
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
        return "⚠ RAPID DEGRADATION"
    elif trend < -3:
        return "⚠ SLOW DEGRADATION"
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

# ==============================
# Fault Classification 
# ==============================

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

    return mapping[label]

# ==============================
# Logging Function
# ==============================
def log_data(rpm, thrust, severity, health, trend, fault_type, rul):

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    with open(log_file_path, "a") as f:
        f.write(
            f"{timestamp},{rpm},{thrust:.4f},{severity:.4f},"
            f"{health:.2f},{trend},{fault_type},{rul:.2f}\n"
        )

# ==============================
# Global State for Motor Simulation
# ==============================
current_rpm = 1000
rpm_direction = 1

# ==============================
# WebSocket Data Function
# ==============================
def get_motor_data_snapshot():
    """Generate a single snapshot of motor data for WebSocket streaming"""
    global current_rpm, rpm_direction
    
    # Update RPM
    current_rpm += rpm_direction * 200
    
    if current_rpm >= 8000:
        rpm_direction = -1
    if current_rpm <= 1000:
        rpm_direction = 1
    
    # Generate sensor data
    voltage = 14.8 - (current_rpm / 8000) * 0.5
    current = 0.000000000004 * (current_rpm ** 3) + np.random.normal(0, 0.3)
    vibration = 0.0001 * current_rpm + np.random.normal(0, 0.05)
    temperature = 25 + current * 0.3
    
    # Inject random anomaly
    if np.random.rand() < 0.03:
        vibration += 3
    
    # Build features and get predictions
    feature_dict = build_feature_dict(
        current_rpm, voltage, current, vibration, temperature
    )
    
    thrust = predict_thrust(feature_dict)
    anomaly_flag, severity = detect_anomaly(feature_dict)
    current_health = update_health(anomaly_flag, severity)
    trend_status = check_health_trend()
    fault_type = classify_fault_ml(feature_dict)
    rul = estimate_rul()
    
    # Log data (keep existing logging)
    log_data(current_rpm, thrust, severity, current_health, trend_status, fault_type, rul)
    
    # Return structured data for WebSocket
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
        "current": round(current, 6),
        "power": round(voltage * current, 3),
        "vibration": round(vibration, 4),
        "temperature": round(temperature, 2),
        "anomaly_status": "ANOMALY" if anomaly_flag == -1 else "NORMAL"
    }

# ==============================
# Simulation Loop (Original Terminal Version)
# ==============================
def simulate_motor_test():
    """Original terminal-based simulation for standalone testing"""
    print("Starting Motor Test with Intelligence Layer...\n")
    
    while True:
        data = get_motor_data_snapshot()
        
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