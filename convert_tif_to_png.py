from PIL import Image
import os
root = os.path.abspath('.')
input_path = os.path.join(root, 'images', 'B10-FOTOINDICE N°03 - ZONA GOLFO SAN MATIAS - GOLFO NUEVO - PENINSULA VALDES.tif')
output_path = os.path.splitext(input_path)[0] + '.png'
print('Input exists:', os.path.exists(input_path))
print('Output path:', output_path)
if not os.path.exists(input_path):
    raise FileNotFoundError(input_path)
with Image.open(input_path) as im:
    print('Image mode:', im.mode, 'size:', im.size, 'frames:', getattr(im, 'n_frames', 1))
    im = im.convert('RGBA')
    im.save(output_path, format='PNG')
print('Saved:', os.path.exists(output_path))
