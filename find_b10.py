import os
root = r'c:/PHOTOINDEX_SHN/VISUAL ESTUDIO/MAPA - Copy'
for dirpath, dirs, files in os.walk(root):
    for f in files:
        if 'B10' in f.upper():
            print(os.path.relpath(os.path.join(dirpath, f), root))
