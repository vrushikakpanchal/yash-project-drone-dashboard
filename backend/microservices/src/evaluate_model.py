import pandas as pd
import joblib
from sklearn.metrics import r2_score, mean_absolute_error

data = pd.read_csv("data/features.csv")

model = joblib.load("models/thrust_model.pkl")
scaler = joblib.load("models/scaler.pkl")

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

X = scaler.transform(data[FEATURE_COLUMNS])
y = data["thrust_kgf"]

pred = model.predict(X)

print("R2:", r2_score(y, pred))
print("MAE:", mean_absolute_error(y, pred))