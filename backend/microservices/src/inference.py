import joblib
import json
import pandas as pd

model = joblib.load("models/thrust_model.pkl")
scaler = joblib.load("models/scaler.pkl")

with open("models/model_metadata.json") as f:
    metadata = json.load(f)

FEATURE_COLUMNS = metadata["feature_columns"]

def predict_thrust(feature_dict):

    ordered = [feature_dict[col] for col in FEATURE_COLUMNS]
    df = pd.DataFrame([ordered], columns=FEATURE_COLUMNS)

    scaled = scaler.transform(df)
    prediction = model.predict(scaled)

    return prediction[0]


if __name__ == "__main__":

    test_input = {
        "rpm": 5000,
        "voltage_v": 14.7,
        "current_a": 18.5,
        "power_w": 271.95,
        "vibration_rms": 0.6,
        "temperature_c": 32,
        "thrust_gradient": 0.01,
        "current_gradient": 0.02
    }

    pred = predict_thrust(test_input)
    print("Predicted Thrust (kgf):", round(pred, 4))