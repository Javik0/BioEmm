import pandas as pd
import json
import re

file_path = '/workspaces/BioEmm/public/docs/Dosificaciones Provefrut.xlsx'

def clean_text(text):
    if pd.isna(text):
        return ""
    return str(text).strip()

def parse_master_plan(df, sheet_name):
    # Header is at index 2
    df.columns = df.iloc[2]
    df = df.iloc[3:].reset_index(drop=True)
    
    # Identify relevant columns by name (fuzzy match or exact)
    # Expected: SEMANA/TIPO, CÓDIGO, PRODUCTO NOMBRE COMERCIAL, DOSIS /ha..., UNIDAD, PRECIO UNITARIO
    
    # Normalize column names
    df.columns = [str(c).strip() for c in df.columns]
    
    # Find columns
    col_stage = next((c for c in df.columns if 'SEMANA' in c or 'TIPO' in c), None)
    col_code = next((c for c in df.columns if 'CÓDIGO' in c), None)
    col_name = next((c for c in df.columns if 'NOMBRE COMERCIAL' in c), None)
    col_qty = next((c for c in df.columns if 'DOSIS' in c and '/ha' in c.lower()), None)
    col_unit = next((c for c in df.columns if 'UNIDAD' in c), None)
    col_price = next((c for c in df.columns if 'PRECIO' in c), None)
    
    if not (col_stage and col_name):
        print(f"Skipping {sheet_name}: Could not find required columns")
        return None, []

    # Forward fill stage
    df[col_stage] = df[col_stage].ffill()
    
    stages = {}
    products_found = []
    
    for _, row in df.iterrows():
        prod_name = clean_text(row[col_name])
        if not prod_name:
            continue
            
        stage_name = clean_text(row[col_stage])
        
        if stage_name not in stages:
            stages[stage_name] = []
            
        qty = row[col_qty] if pd.notna(row[col_qty]) else 0
        try:
            qty = float(qty)
        except:
            qty = 0
            
        price = row[col_price] if pd.notna(row[col_price]) else 0
        try:
            price = float(price)
        except:
            price = 0

        product = {
            'code': clean_text(row[col_code]),
            'name': prod_name,
            'quantity': qty,
            'unit': clean_text(row[col_unit]),
            'price': price
        }
        
        stages[stage_name].append(product)
        products_found.append(product)
        
    protocol = {
        'name': f"{sheet_name} - Plan Maestro",
        'type': 'Standard',
        'stages': [{'name': k, 'products': v} for k, v in stages.items()]
    }
    
    return protocol, products_found

def parse_bioems_protocol(df, sheet_name):
    # Header is at index 3 usually
    # Let's find the row that has "Nombre comercial"
    header_idx = -1
    for i, row in df.iterrows():
        row_str = row.astype(str).str.cat()
        if "Nombre comercial" in row_str:
            header_idx = i
            break
            
    if header_idx == -1:
        print(f"Skipping {sheet_name}: Could not find header row")
        return None, []
        
    df.columns = df.iloc[header_idx]
    df = df.iloc[header_idx+1:].reset_index(drop=True)
    df.columns = [str(c).strip() for c in df.columns]
    
    col_week = next((c for c in df.columns if 'Semana' in c), None)
    col_app = next((c for c in df.columns if 'Aplicación' in c), None)
    col_name = next((c for c in df.columns if 'Nombre comercial' in c), None)
    col_qty = next((c for c in df.columns if 'Dosis' in c and '/Ha' in c), None)
    col_price = next((c for c in df.columns if 'Costo' in c and 'unitario' in c), None)
    
    if not col_name:
        return None, []
        
    # Forward fill Week and App
    if col_week: df[col_week] = df[col_week].ffill()
    if col_app: df[col_app] = df[col_app].ffill()
    
    stages = {}
    products_found = []
    
    for _, row in df.iterrows():
        prod_name = clean_text(row[col_name])
        if not prod_name or prod_name.lower() == 'total':
            continue
            
        week = clean_text(row[col_week]) if col_week else ""
        app = clean_text(row[col_app]) if col_app else ""
        
        stage_name = f"Semana {week} - {app}".strip()
        if stage_name.startswith("Semana -"): stage_name = stage_name.replace("Semana -", "").strip()
        
        if stage_name not in stages:
            stages[stage_name] = []
            
        qty = row[col_qty] if pd.notna(row[col_qty]) else 0
        try:
            qty = float(qty)
        except:
            qty = 0
            
        price = row[col_price] if pd.notna(row[col_price]) else 0
        try:
            price = float(price)
        except:
            price = 0
            
        # Infer unit from quantity or context? The sheet says "Dosis (Kg, L)/Ha"
        # We can try to guess or default to 'Unidad'
        # Usually < 1 is L or Kg, but hard to say. Let's leave empty or default.
        unit = 'Kg/L' 
        
        product = {
            'code': '', # Usually no code in this sheet
            'name': prod_name,
            'quantity': qty,
            'unit': unit,
            'price': price
        }
        
        stages[stage_name].append(product)
        products_found.append(product)

    # Rename Vitenza to BioEMS in the protocol name if present, or just use the sheet name
    protocol_name = sheet_name.replace("Dosificación", "Protocolo BioEMS")
    
    protocol = {
        'name': protocol_name,
        'type': 'BioEMS',
        'stages': [{'name': k, 'products': v} for k, v in stages.items()]
    }
    
    return protocol, products_found

def main():
    xls = pd.ExcelFile(file_path)
    all_protocols = []
    all_products = {} # Map name -> product_data to dedup
    
    for sheet_name in xls.sheet_names:
        df = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
        
        protocol = None
        products = []
        
        if "Dosificación" in sheet_name:
            protocol, products = parse_bioems_protocol(df, sheet_name)
        else:
            protocol, products = parse_master_plan(df, sheet_name)
            
        if protocol:
            all_protocols.append(protocol)
            
        for p in products:
            # Use name as key for dedup
            key = p['name'].upper()
            if key not in all_products:
                all_products[key] = p
            else:
                # Update info if we have better info (e.g. code)
                if p['code'] and not all_products[key]['code']:
                    all_products[key]['code'] = p['code']
                if p['unit'] and all_products[key]['unit'] == 'Kg/L':
                     all_products[key]['unit'] = p['unit']

    print(json.dumps({
        "protocols": all_protocols,
        "unique_products_count": len(all_products),
        "unique_products_sample": list(all_products.values())[:5]
    }, indent=2, ensure_ascii=False))
    
    # Save to a file for the next step
    with open('/workspaces/BioEmm/extracted_data.json', 'w', encoding='utf-8') as f:
        json.dump({
            "protocols": all_protocols,
            "products": list(all_products.values())
        }, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()
