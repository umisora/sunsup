"""Place a product photo on the white square the site multiplies.

Drink pages use mix-blend-mode: multiply, so the ground is opaque white.
A photo that is already a clean pack shot is only padded. A photo with a
room, table, or shelf is masked with rembg (U2-Net by default; pass
--model birefnet-general for the heavier BiRefNet mask).

    python3 scripts/cutout-still.py public/drinks/cc-lemon-pet.webp
    python3 scripts/cutout-still.py --model birefnet-general --out /tmp/out.webp source.webp
    python3 scripts/cutout-still.py --model birefnet-general --master stills/masters/<slug>.png \
        --out public/drinks/<slug>.webp source.webp

--master also writes the transparent master (RGBA, same canvas and placement) that
scripts/compose-season-stills.py composes the four season stills from. It always masks.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from rembg import new_session, remove

CANVAS = 1200
PADDING = 0.08

_session = None
_model = "u2net"


def session():
    global _session
    if _session is None:
        _session = new_session(_model)
    return _session


def content_box(image: Image.Image, threshold: int = 248) -> tuple[int, int, int, int] | None:
    rgb = np.asarray(image.convert("RGB"))
    mask = np.any(rgb < threshold, axis=2)
    ys, xs = np.where(mask)
    if xs.size == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def corners_clean(image: Image.Image) -> bool:
    rgb = image.convert("RGB")
    width, height = rgb.size
    samples = [
        rgb.getpixel((2, 2)),
        rgb.getpixel((width - 3, 2)),
        rgb.getpixel((2, height - 3)),
        rgb.getpixel((width - 3, height - 3)),
    ]
    return all(pixel[0] >= 248 and pixel[1] >= 248 and pixel[2] >= 248 for pixel in samples)


def place(plate: Image.Image, mode: str = "RGB") -> Image.Image:
    side = max(plate.size)
    fitted = int(round(CANVAS * (1 - PADDING * 2)))
    scale = fitted / side
    resized = plate.resize(
        (max(1, int(round(plate.width * scale))), max(1, int(round(plate.height * scale)))),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new(mode, (CANVAS, CANVAS), (255, 255, 255) if mode == "RGB" else (255, 255, 255, 0))
    canvas.paste(resized, ((CANVAS - resized.width) // 2, (CANVAS - resized.height) // 2))
    return canvas


def master_cutout(source: Image.Image) -> tuple[Image.Image, Image.Image]:
    """Return (white RGB still, transparent RGBA master) with the same placement."""
    rgb = source.convert("RGB")
    masked = remove(rgb, session=session()).convert("RGBA")
    alpha = np.array(masked.getchannel("A"))
    ys, xs = np.where(alpha > 16)
    if xs.size == 0:
        raise RuntimeError("cutout found no product")
    cropped = masked.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    master = place(cropped, "RGBA")
    white = Image.new("RGB", master.size, (255, 255, 255))
    white.paste(master, mask=master.getchannel("A"))
    return white, master


def mask_product(source: Image.Image) -> Image.Image:
    rgb = source.convert("RGB")
    masked = remove(rgb, session=session()).convert("RGBA")
    alpha = np.array(masked.getchannel("A"))
    eroded = alpha.copy()
    eroded[1:, :] = np.minimum(eroded[1:, :], alpha[:-1, :])
    eroded[:-1, :] = np.minimum(eroded[:-1, :], alpha[1:, :])
    eroded[:, 1:] = np.minimum(eroded[:, 1:], alpha[:, :-1])
    eroded[:, :-1] = np.minimum(eroded[:, :-1], alpha[:, 1:])
    ys, xs = np.where(eroded > 16)
    if xs.size == 0:
        raise RuntimeError("cutout found no product")
    cropped = masked.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    plate = Image.new("RGB", cropped.size, (255, 255, 255))
    plate.paste(cropped, mask=cropped.getchannel("A"))
    return plate


def cutout(source: Image.Image, force_mask: bool = False) -> Image.Image:
    """Return an opaque white-square RGB still with the product inside the padding."""
    rgb = source.convert("RGB")
    box = content_box(rgb)
    if box is None:
        raise RuntimeError("image has no product")
    left, top, right, bottom = box
    width, height = rgb.size
    margin = min(left, top, width - 1 - right, height - 1 - bottom)
    if not force_mask and corners_clean(rgb) and margin >= 2:
        plate = rgb.crop((left, top, right + 1, bottom + 1))
        return place(plate)
    return place(mask_product(rgb))


def main() -> None:
    global _model
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("--out", type=Path)
    parser.add_argument("--model", default="u2net")
    parser.add_argument("--mask", action="store_true", help="always remove the background")
    parser.add_argument("--master", type=Path, help="also write the transparent RGBA master here")
    args = parser.parse_args()
    _model = args.model
    destination = args.out or args.source
    if args.master:
        image, master = master_cutout(Image.open(args.source))
        args.master.parent.mkdir(parents=True, exist_ok=True)
        master.save(args.master, optimize=True)
        print(f"wrote {args.master}")
    else:
        image = cutout(Image.open(args.source), force_mask=args.mask)
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "WEBP", quality=86, method=6)
    print(f"wrote {destination} {image.size[0]}x{image.size[1]}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"cutout failed: {error}", file=sys.stderr)
        sys.exit(1)
