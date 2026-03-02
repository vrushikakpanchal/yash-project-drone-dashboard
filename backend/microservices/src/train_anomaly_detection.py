import pandas as pd
import joblib
import os
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

FEATURE_COLUMNS = [
    "rpm",
    "voltage_v",
    "current_a",
    "power_w",
    "vibration_rms",
    "temperature_c",
    "thrust_gradient",
    "current_gradient"
]

def train_anomaly_model():

    data = pd.read_csv("data/features.csv")

    X = data[FEATURE_COLUMNS]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(
        contamination=0.02,  # 2% anomalies
        random_state=42
    )

    model.fit(X_scaled)

    os.makedirs("models", exist_ok=True)

    joblib.dump(model, "models/anomaly_model.pkl")
    joblib.dump(scaler, "models/anomaly_scaler.pkl")

    print("Anomaly model saved.")

if __name__ == "__main__":
    train_anomaly_model()