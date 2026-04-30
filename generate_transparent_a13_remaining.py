from pathlib import Path
from remove_background import process_image

source_root = Path('images')
output_root = Path('images_transparent')

existing = {p.name for p in output_root.glob('*.png') if p.is_file()}
all_files = sorted([p for p in source_root.glob('*A13*') if p.is_file() and p.suffix.lower() == '.png'])
remaining = [p for p in all_files if p.name not in existing]
print(f'Processing {len(remaining)} remaining A13 PNG files...')
for idx, p in enumerate(remaining, start=1):
    print(f'[{idx}/{len(remaining)}] {p.name}')
    process_image(p, output_root, source_root, tolerance=32, border=10, overwrite=False, dry_run=False)
print('Done remaining files.')
