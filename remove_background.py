from pathlib import Path
from collections import Counter
from PIL import Image
import argparse

SUPPORTED_EXTENSIONS = {'.png', '.tif', '.tiff'}


def parse_args():
    parser = argparse.ArgumentParser(
        description='Remove solid background from images and optionally convert TIFF to PNG.'
    )
    parser.add_argument(
        '--dirs',
        nargs='+',
        default=['images', '1/images'],
        help='Source directories to scan for PNG/TIFF images.'
    )
    parser.add_argument(
        '--output',
        default='images_transparent',
        help='Output root directory for processed images.'
    )
    parser.add_argument(
        '--tolerance',
        type=int,
        default=32,
        help='Color distance tolerance for background removal (0-255).'
    )
    parser.add_argument(
        '--border',
        type=int,
        default=10,
        help='Border width in pixels used to estimate the background color.'
    )
    parser.add_argument(
        '--overwrite',
        action='store_true',
        help='Overwrite PNG files in place instead of writing to the output directory.'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Print the files that would be processed without writing output.'
    )
    return parser.parse_args()


def pick_background_color(img, border=10):
    img = img.convert('RGBA')
    width, height = img.size
    samples = []
    pixels = img.load()

    # Take samples from the image border (top, bottom, left, right)
    for x in range(width):
        for y in range(min(border, height)):
            rgba = pixels[x, y]
            if rgba[3] > 0:
                samples.append(rgba[:3])
        for y in range(max(0, height - border), height):
            rgba = pixels[x, y]
            if rgba[3] > 0:
                samples.append(rgba[:3])

    for y in range(height):
        for x in range(min(border, width)):
            rgba = pixels[x, y]
            if rgba[3] > 0:
                samples.append(rgba[:3])
        for x in range(max(0, width - border), width):
            rgba = pixels[x, y]
            if rgba[3] > 0:
                samples.append(rgba[:3])

    if not samples:
        return (255, 255, 255)

    counter = Counter(samples)
    return counter.most_common(1)[0][0]


def distance_sq(c1, c2):
    return sum((a - b) ** 2 for a, b in zip(c1, c2))


def remove_background(img, bg_color, tolerance=32):
    img = img.convert('RGBA')
    width, height = img.size
    try:
        data = list(img.get_flattened_data())
    except AttributeError:
        data = list(img.getdata())
    threshold = tolerance * tolerance
    new_data = []

    for pixel in data:
        r, g, b, a = pixel
        if a == 0 or distance_sq((r, g, b), bg_color) <= threshold:
            new_data.append((r, g, b, 0))
        else:
            new_data.append(pixel)

    img.putdata(new_data)
    return img


def should_process(path):
    if path.suffix.lower() in {'.tif', '.tiff'}:
        png_equivalent = path.with_suffix('.png')
        if png_equivalent.exists():
            return False
    return True


def process_image(path, output_root, source_root, tolerance, border, overwrite, dry_run):
    relative = path.relative_to(source_root)
    if overwrite and path.suffix.lower() == '.png':
        output_path = path
    else:
        output_path = Path(output_root) / relative
        output_path = output_path.with_suffix('.png')

    output_path.parent.mkdir(parents=True, exist_ok=True)

    if dry_run:
        print('[DRY RUN] would process:', path, '->', output_path)
        return

    with Image.open(path) as im:
        bg_color = pick_background_color(im, border=border)
        result = remove_background(im, bg_color, tolerance=tolerance)
        result.save(output_path, format='PNG')
        print('Saved', output_path)


def main():
    args = parse_args()
    source_dirs = [Path(d) for d in args.dirs]
    output_root = Path(args.output)

    for source_dir in source_dirs:
        if not source_dir.exists():
            print('Source directory not found:', source_dir)
            continue

        for path in sorted(source_dir.rglob('*')):
            if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS and should_process(path):
                process_image(
                    path,
                    output_root,
                    source_dir,
                    tolerance=args.tolerance,
                    border=args.border,
                    overwrite=args.overwrite,
                    dry_run=args.dry_run,
                )


if __name__ == '__main__':
    main()
