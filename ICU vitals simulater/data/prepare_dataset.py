import pandas as pd

# Load original dataset
df = pd.read_csv("Dataset.csv")

# Count rows per patient
patient_counts = df['Patient_ID'].value_counts()

# Select top 5 patients
top_patients = patient_counts.nlargest(5).index

# Filter dataset
filtered_df = df[df['Patient_ID'].isin(top_patients)]

# Save new dataset
filtered_df.to_csv("dataset_top5.csv", index=False)

print("Top 5 patients:", list(top_patients))
print("New dataset saved as dataset_top5.csv")