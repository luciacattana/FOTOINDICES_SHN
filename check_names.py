import json
import os

with open('polygons.geojson', encoding='utf-8') as f:
    data = json.load(f)

images_dir = 'images'
files = set(os.listdir(images_dir))

# Obtener nombres esperados
expected = {}
for feature in data['features']:
    img = feature['properties'].get('IMAGEN')
    if img:
        expected[img.strip()] = True

print("=== PRIMEROS 10 NOMBRES ESPERADOS ===")
for i, name in enumerate(list(expected.keys())[:10]):
    exists = name in files
    print(f"{i+1}. {name} {'✓' if exists else '✗ NO EXISTE'}")

print(f"\nTotal esperados: {len(expected)}")
print(f"Total en carpeta: {len(files)}")

# Verificar cuáles existen
found = 0
for exp_name in expected.keys():
    if exp_name in files:
        found += 1

print(f"Coincidencias exactas: {found}")
