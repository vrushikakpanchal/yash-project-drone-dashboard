import numpy as np
import pandas as pd
import os

np.random.seed(42)

def generate_fault_dataset(n_samples=6000):

    rpm = np.random.uniform(1000, 8000, n_samples)
    voltage = np.random.normal(14.8, 0.3, n_samples)
    current = 0.000000000004 * (rpm ** 3) + np.random.normal(0, 0.3, n_samples)
    vibration = 0.0001 * rpm + np.random.normal(0, 0.05, n_samples)
    temperature = 25 + current * 0.3

    power = voltage * current
    thrust = 0.00000002 * (rpm ** 2)

    thrust_grad = np.gradient(thrust)
    current_grad = np.gradient(current)

    # Default class = Normal
    fault_label = np.zeros(n_samples)

    for i in range(n_samples):

        rand = np.random.rand()

        # Bearing Fault (high vibration spike)
        if rand < 0.05:
            vibration[i] += np.random.uniform(2, 4)
            fault_label[i] = 1

        # Overcurrent Fault
        elif rand < 0.08:
            current[i] *= 1.5
            fault_label[i] = 2

        # Prop Imbalance
        elif rand < 0.12:
            vibration[i] += np.random.uniform(1, 2)
            fault_label[i] = 3

    data = pd.DataFrame({
        "rpm": rpm,
        "voltage_v": voltage,
        "current_a": current,
        "power_w": power,
        "vibration_rms": vibration,
        "temperature_c": temperature,
        "thrust_gradient": thrust_grad,
        "current_gradient": current_grad,
        "fault_label": fault_label
    })

    os.makedirs("data", exist_ok=True)
    data.to_csv("data/fault_dataset.csv", index=False)

    print("Fault dataset generated.")
    print(data["fault_label"].value_counts())

if __name__ == "__main__":
    generate_fault_dataset()