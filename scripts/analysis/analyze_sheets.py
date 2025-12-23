import pandas as pd

file_path = '/workspaces/BioEmm/public/docs/Dosificaciones Provefrut.xlsx'

try:
    # Load the Excel file to list sheet names
    xls = pd.ExcelFile(file_path)
    print("Sheet names found:", xls.sheet_names)
    
    # Read each sheet to see a preview
    for sheet_name in xls.sheet_names:
        print(f"\n--- Preview of sheet: {sheet_name} ---")
        df = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
        print(df.head(10))

except Exception as e:
    print(f"Error reading Excel file: {e}")
