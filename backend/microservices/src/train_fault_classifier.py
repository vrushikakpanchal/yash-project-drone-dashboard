import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report

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

def train_classifier():

    data = pd.read_csv("data/hybrid_fault_dataset.csv")

    X = data[FEATURE_COLUMNS]
    y = data["fault_label"]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42
    )

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=18,
        random_state=42
    )

    model.fit(X_train, y_train)

    preds = model.predict(X_test)

    print("\nClassification Report:")
    print(classification_report(y_test, preds))

    os.makedirs("models", exist_ok=True)
    joblib.dump(model, "models/fault_classifier.pkl")
    joblib.dump(scaler, "models/fault_scaler.pkl")

    print("Hybrid fault classifier saved.")

if __name__ == "__main__":
    train_classifier()