import json
import os
import shutil

with open('polygons.geojson', encoding='utf-8') as f:
    data = json.load(f)

images_dir = 'images'
files = os.listdir(images_dir)

# Construir mapeo esperado
expected_names = set()
for feature in data['features']:
    img = feature['properties'].get('IMAGEN')
    if img:
        expected_names.add(img.strip())

print(f"Total de archivos en carpeta: {len(files)}")
print(f"Total de nombres esperados: {len(expected_names)}")

# Encontrar archivos que tienen espacios pero deberían tener guiones
renamed_count = 0
for file in files:
    if file == 'placeholder.txt':
        continue
    
    # Si el archivo con espacios convertidos a guiones está en los esperados
    file_with_dashes = file.replace(' ', '-')
    if file_with_dashes in expected_names and file != file_with_dashes:
        old_path = os.path.join(images_dir, file)
        new_path = os.path.join(images_dir, file_with_dashes)
        shutil.move(old_path, new_path)
        print(f"Renombrado: '{file}' → '{file_with_dashes}'")
        renamed_count += 1

print(f"\nTotal renombrados: {renamed_count}")
