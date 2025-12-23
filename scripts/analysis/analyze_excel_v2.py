import pandas as pd

file_path = '/workspaces/BioEmm/public/docs/Dosificaciones Provefrut.xlsx'

try:
    # Read with header at row 2 (index 2)
    df = pd.read_excel(file_path, header=2)
    
    print("Columns:", df.columns.tolist())
    print("\nFirst 10 rows:")
    print(df.head(10))
    
    # Let's see a few more rows to understand the structure of the "Semana" grouping
    print("\nRows 10-20:")
    print(df.iloc[10:20])

except Exception as e:
    print(f"Error reading Excel file: {e}")
