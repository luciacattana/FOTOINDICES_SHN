import os, re
root = r'c:/PHOTOINDEX_SHN/VISUAL ESTUDIO/MAPA - Copy'
for dirname, dirs, files in os.walk(os.path.join(root, 'images')):
    for f in files:
        if re.search(r'B10-FOTOINDICE.*N.*03', f, re.I):
            print(os.path.relpath(os.path.join(dirname, f), root))
