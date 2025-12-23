import pandas as pd
import json

file_path = '/workspaces/BioEmm/public/docs/Dosificaciones Provefrut.xlsx'

def parse_excel_to_json():
    try:
        # Read with header at row 2
        df = pd.read_excel(file_path, header=2)
        
        # Rename columns
        df.columns = ['category', 'phase_code', 'product_code', 'product_name', 'dosage_ha', 'dosage_half_ha', 'unit', 'price', 'total_cost']
        
        # Forward fill category
        df['category'] = df['category'].ffill()
        df['phase_code'] = df['phase_code'].ffill()
        
        # Filter out rows with no product name
        df = df.dropna(subset=['product_name'])
        
        templates = {}
        
        for _, row in df.iterrows():
            category = row['category']
            if pd.isna(category):
                continue
                
            # Clean category name
            category = str(category).strip()
            
            if category not in templates:
                templates[category] = {
                    'name': category,
                    'code': str(row['phase_code']).strip() if pd.notna(row['phase_code']) else '',
                    'products': []
                }
            
            product = {
                'productCode': str(row['product_code']).strip() if pd.notna(row['product_code']) else '',
                'productName': str(row['product_name']).strip(),
                'quantity': float(row['dosage_ha']) if pd.notna(row['dosage_ha']) else 0,
                'unit': str(row['unit']).strip() if pd.notna(row['unit']) else ''
            }
            
            templates[category]['products'].append(product)
            
        return list(templates.values())

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    data = parse_excel_to_json()
    print(json.dumps(data, indent=2, ensure_ascii=False))
