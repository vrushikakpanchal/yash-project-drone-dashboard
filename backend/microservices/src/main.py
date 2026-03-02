from synthetic_data import generate_synthetic_dataset
from train_model import train

def main():
    print("Generating synthetic data...")
    generate_synthetic_dataset()

    print("Training model...")
    train()

    print("Pipeline completed successfully.")

if __name__ == "__main__":
    main()