import numpy as np
import pandas as pd
import os

np.random.seed(42)

def generate_synthetic_dataset(n_samples=5000):

    rpm = np.random.uniform(1000, 8000, n_samples)
    voltage_v = np.random.normal(14.8, 0.3, n_samples)

    thrust_kgf = 0.00000002 * (rpm ** 2)
    thrust_kgf += np.random.normal(0, 0.05, n_samples)

    current_a = 0.000000000004 * (rpm ** 3)
    current_a += np.random.normal(0, 0.2, n_samples)

    power_w = voltage_v * current_a
    vibration_rms = 0.0001 * rpm + np.random.normal(0, 0.05, n_samples)
    temperature_c = 25 + (current_a * 0.3) + np.random.normal(0, 1.0, n_samples)

    thrust_gradient = np.gradient(thrust_kgf)
    current_gradient = np.gradient(current_a)

    data = pd.DataFrame({
        "rpm": rpm,
        "voltage_v": voltage_v,
        "current_a": current_a,
        "power_w": power_w,
        "vibration_rms": vibration_rms,
        "temperature_c": temperature_c,
        "thrust_gradient": thrust_gradient,
        "current_gradient": current_gradient,
        "thrust_kgf": thrust_kgf
    })

    os.makedirs("data", exist_ok=True)
    data.to_csv("data/features.csv", index=False)

    print("Synthetic dataset generated.")
    print("Saved to data/features.csv")
    print("Shape:", data.shape)


if __name__ == "__main__":
    generate_synthetic_dataset()