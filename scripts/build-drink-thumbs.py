#!/usr/bin/env python3
"""320w WebP thumbs of every public/drinks/*.webp for card and shelf srcsets.

Output: public/drinks/320/<slug>.webp. Skips a thumb that is newer than its source.
Usage (repo root): python3 scripts/build-drink-thumbs.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "drinks"
DST = SRC / "320"
WIDTH = 320
QUALITY = 78


def main() -> None:
  DST.mkdir(exist_ok=True)
  done = skipped = 0
  for path in sorted(SRC.glob("*.webp")):
    out = DST / path.name
    if out.exists() and out.stat().st_mtime >= path.stat().st_mtime:
      skipped += 1
      continue
    image = Image.open(path).convert("RGB")
    width, height = image.size
    if width > WIDTH:
      image = image.resize((WIDTH, max(1, round(height * WIDTH / width))), Image.Resampling.LANCZOS)
    image.save(out, "WEBP", quality=QUALITY, method=6)
    done += 1
  print(f"drink thumbs: wrote {done}, up to date {skipped}")


if __name__ == "__main__":
  main()
