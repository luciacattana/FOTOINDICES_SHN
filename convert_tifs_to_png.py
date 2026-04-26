import json
from pathlib import Path
from PIL import Image

try:
    import tifffile
except ImportError:
    tifffile = None

root = Path('c:/PHOTOINDEX_SHN/VISUAL ESTUDIO/MAPA - Copy')
images_dirs = [root / 'images', root / '1' / 'images']
for d in images_dirs:
    if not d.exists():
        print('missing folder', d)

with open(root / 'polygons.geojson', 'r', encoding='utf-8') as f:
    data = json.load(f)

existing_files = {}
for d in images_dirs:
    if d.exists():
        for file in d.iterdir():
            if file.is_file():
                existing_files[file.name] = file


def cand_names(name):
    names = set()
    raw = name.strip()
    if not raw:
        return []
    names.add(raw)
    names.add(raw.replace(' ', '_'))
    names.add(raw.replace('_', ' '))
    names.add(raw.upper())
    names.add(raw.lower())
    names.add(raw.replace(' ', '_').upper())
    names.add(raw.replace(' ', '_').lower())
    names.add(raw.replace('_', ' ').upper())
    names.add(raw.replace('_', ' ').lower())
    results = set()
    for n in names:
        results.add(n)
        if not n.lower().endswith('.tif') and not n.lower().endswith('.png'):
            results.add(n + '.tif')
            results.add(n + '.TIF')
            results.add(n + '.png')
            results.add(n + '.PNG')
        elif n.lower().endswith('.tif'):
            results.add(n[:-4] + '.png')
            results.add(n[:-4] + '.PNG')
        elif n.lower().endswith('.png'):
            results.add(n[:-4] + '.tif')
            results.add(n[:-4] + '.TIF')
    return sorted(results)


def load_tiff_with_fallback(path):
    try:
        with Image.open(path) as img:
            img.load()
            return img.convert('RGBA')
    except Exception:
        if tifffile is None:
            raise

    # fallback to tifffile if Pillow fails
    try:
        arr = tifffile.imread(path)
    except Exception as exc:
        raise RuntimeError(f'fallback tifffile failed: {exc}') from exc

    if arr.ndim == 2:
        mode = 'L'
    elif arr.ndim == 3 and arr.shape[2] == 1:
        mode = 'L'
        arr = arr[:, :, 0]
    elif arr.ndim == 3 and arr.shape[2] == 3:
        mode = 'RGB'
    elif arr.ndim == 3 and arr.shape[2] == 4:
        mode = 'RGBA'
    else:
        raise RuntimeError(f'unsupported TIFF dimensions: {arr.shape}')

    if arr.dtype != 'uint8':
        arr = (arr.astype('float32') / arr.max() * 255).clip(0, 255).astype('uint8')

    return Image.fromarray(arr, mode=mode)

missing = set()
for feat in data.get('features', []):
    props = feat.get('properties', {})
    name = props.get('IMAGEN') or props.get('FOTOINDEX') or props.get('FOTOINDICE') or props.get('Path_Photo')
    if not name:
        continue
    name = str(name).strip()
    if not name:
        continue
    for candidate in cand_names(name):
        if candidate in existing_files:
            if candidate.lower().endswith('.tif') and candidate[:-4] + '.png' not in existing_files:
                missing.add(candidate)
            break

print('TIFF files needing PNG conversion:', len(missing))

converted = 0
errors = 0
for index, tif_name in enumerate(sorted(missing), start=1):
    tif_path = existing_files.get(tif_name)
    if not tif_path:
        continue
    png_path = tif_path.with_suffix('.png')
    if png_path.exists():
        continue
    try:
        img = load_tiff_with_fallback(tif_path)
        img.save(png_path, format='PNG')
        converted += 1
        if index % 10 == 0 or index == len(missing):
            print(f'converted {index}/{len(missing)}: {tif_path.name}')
    except Exception as e:
        errors += 1
        print(f'FAILED {tif_path.name}: {e}')

print('converted total', converted)
print('errors', errors)
