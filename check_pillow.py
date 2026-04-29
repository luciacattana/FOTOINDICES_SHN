import os
try:
    from PIL import Image
    print('PIL:', Image.__version__)
except Exception as e:
    print('PIL import failed:', type(e).__name__, e)
root = os.path.abspath('.')
print('cwd:', root)
path = os.path.join(root, 'images', 'B10-FOTOINDICE N°03 - ZONA GOLFO SAN MATIAS - GOLFO NUEVO - PENINSULA VALDES.tif')
print('exists image path:', os.path.exists(path))
print('path:', path)
