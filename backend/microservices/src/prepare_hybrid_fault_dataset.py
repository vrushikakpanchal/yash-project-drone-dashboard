import pandas as pd
import os

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

FAULT_MAPPING = {
    "Normal": 0,
    "Bearing Fault": 1,
    "Overcurrent Fault": 2,
    "Prop Imbalance": 3
}

def prepare_hybrid_dataset():

    synthetic = pd.read_csv("data/fault_dataset.csv")

    # Load real logs if available
    if os.path.exists("logs/health_log.csv"):

        real = pd.read_csv("logs/health_log.csv")

        # Remove rows without fault type
        real = real.dropna(subset=["fault_type"])

        real["fault_label"] = real["fault_type"].map(FAULT_MAPPING)

        # You may not have full feature columns in logs
        # So for now we only use rpm + severity + health patterns
        # You can extend logging later for full feature training

        # Drop rows with unmapped labels
        real = real.dropna(subset=["fault_label"])

        print("Real log samples added:", len(real))

        # For now append only synthetic (since log doesn't contain full features)
        combined = synthetic

    else:
        print("No real log found. Using synthetic only.")
        combined = synthetic

    combined.to_csv("data/hybrid_fault_dataset.csv", index=False)
    print("Hybrid dataset saved.")

if __name__ == "__main__":
    prepare_hybrid_dataset()