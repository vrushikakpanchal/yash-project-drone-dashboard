import pandas as pd
import numpy as np
import joblib
import json
import os

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error

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

TARGET_COLUMN = "thrust_kgf"

def train():

    data = pd.read_csv("data/features.csv")

    X = data[FEATURE_COLUMNS]
    y = data[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = RandomForestRegressor(
        n_estimators=150,
        max_depth=12,
        random_state=42,
        n_jobs=-1
    )

    model.fit(X_train_scaled, y_train)

    predictions = model.predict(X_test_scaled)

    rmse = np.sqrt(mean_squared_error(y_test, predictions))
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)

    print("Model Performance:")
    print("RMSE:", round(rmse, 4))
    print("MAE:", round(mae, 4))
    print("R2:", round(r2, 4))

    os.makedirs("models", exist_ok=True)

    joblib.dump(model, "models/thrust_model.pkl")
    joblib.dump(scaler, "models/scaler.pkl")

    metadata = {
        "feature_columns": FEATURE_COLUMNS,
        "target": TARGET_COLUMN,
        "rmse": float(rmse),
        "mae": float(mae),
        "r2": float(r2)
    }

    with open("models/model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=4)

    print("Model saved to models/ folder")


if __name__ == "__main__":
    train()