from pathlib import Path
from remove_background import process_image

source_root = Path('images')
output_root = Path('images_transparent')

png_files = sorted([p for p in source_root.glob('*A13*') if p.is_file() and p.suffix.lower() == '.png'])
print(f'Processing {len(png_files)} A13 PNG files...')
for idx, p in enumerate(png_files, start=1):
    print(f'[{idx}/{len(png_files)}] {p.name}')
    process_image(p, output_root, source_root, tolerance=32, border=10, overwrite=False, dry_run=False)
print('Done.')
