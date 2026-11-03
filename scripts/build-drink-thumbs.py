#!/usr/bin/env python3
"""Smaller WebP copies of the drink stills for srcsets.

Output: public/drinks/320/<slug>.webp (cards, shelves) and
        public/drinks/season/<480|800>/<slug>_<season>.webp (1200² seasonal studio stills).
Skips a copy that is newer than its source.
Usage (repo root): python3 scripts/build-drink-thumbs.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "drinks"
DST = SRC / "320"
WIDTH = 320
QUALITY = 78
SEASON_SRC = SRC / "season"
SEASON_WIDTHS = (480, 800)
SEASON_QUALITY = 80


def resize_into(path: Path, out: Path, width: int, quality: int) -> bool:
  if out.exists() and out.stat().st_mtime >= path.stat().st_mtime:
    return False
  image = Image.open(path).convert("RGB")
  w, h = image.size
  if w > width:
    image = image.resize((width, max(1, round(h * width / w))), Image.Resampling.LANCZOS)
  image.save(out, "WEBP", quality=quality, method=6)
  return True


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

  done = skipped = 0
  for width in SEASON_WIDTHS:
    (SEASON_SRC / str(width)).mkdir(exist_ok=True)
    for path in sorted(SEASON_SRC.glob("*.webp")):
      if resize_into(path, SEASON_SRC / str(width) / path.name, width, SEASON_QUALITY):
        done += 1
      else:
        skipped += 1
  print(f"season stills: wrote {done}, up to date {skipped}")


if __name__ == "__main__":
  main()
