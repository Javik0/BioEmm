import pandas as pd

file_path = '/workspaces/BioEmm/public/docs/Dosificaciones Provefrut.xlsx'

try:
    # Read the Excel file
    # Try reading without header first to see the raw layout, as excel files often have title rows
    df = pd.read_excel(file_path, header=None)
    
    print("First 10 rows of raw data:")
    print(df.head(10))
    
    print("\nInfo:")
    print(df.info())

except Exception as e:
    print(f"Error reading Excel file: {e}")
