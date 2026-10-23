#!/usr/bin/env python3
"""A wide hero for a scene page, made only from the real product stills of drinks on that page.

The drinks stand side by side on the procedural winter studio backdrop of compose-season-stills.py.
Product pixels are never repainted: label, logo, print and cap stay identical to the cutout
(print_maxdiff must be 0 for every drink). Heights are a visual scale by bottle class (see HEROES).

Input:  stills/masters/<slug>.png (transparent cutout; made from public/drinks/<slug>.webp with
        rembg when missing, RGB kept as is, only alpha added)
Output: public/images/scene-<scene>-{768,1280}.webp and stills/scene-hero-fidelity.json

Usage (repo root):  python3 scripts/compose-scene-hero.py bonenkai
Needs numpy, scipy, scikit-image, Pillow (and rembg for new cutouts).
"""
import importlib.util, json, os, sys
import numpy as np
from PIL import Image
from scipy.ndimage import binary_erosion, binary_closing, binary_dilation, distance_transform_edt, gaussian_filter, label as cc_label

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("season", os.path.join(ROOT, "scripts", "compose-season-stills.py"))
season = importlib.util.module_from_spec(spec); spec.loader.exec_module(season)

# scene -> drinks left to right, with a relative height. 1.0 is a 720ml bottle; the small 240-330ml
# bottles are drawn at about two thirds of it. This is a visual scale, not a measured height.
# Pick stills whose product is at least ~500px tall in public/drinks, so nothing is upscaled much.
HEROES = {
    "bonenkai": [
        ("kimino-yuzu", 0.66),
        ("ringowork-original-720", 1.0),
        ("kimura-wasabi-ginger", 0.66),
        ("maison-perrier-raspberry-330", 0.70),
    ],
}
S = 1600          # square backdrop; the hero is the lower 16:9 band of it
CROP_TOP = 700    # rows 700..1600
TALLEST = 0.40    # tallest bottle as a share of S


def master(slug):
    path = os.path.join(ROOT, "stills", "masters", f"{slug}.png")
    if not os.path.exists(path):
        from rembg import new_session, remove
        src = Image.open(os.path.join(ROOT, "public", "drinks", f"{slug}.webp")).convert("RGB")
        cut = remove(src, session=new_session("u2net"), post_process_mask=True)
        rgba = src.copy(); rgba.putalpha(cut.getchannel("A"))   # keep the original RGB untouched
        rgba.save(path)
    return Image.open(path).convert("RGBA")


def load(slug, h):
    m = master(slug); prod = m.convert("RGB"); a = m.getchannel("A")
    A0 = np.asarray(a, np.float32) / 255; ys, xs = np.where(A0 > 0.5)
    box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    prod = prod.crop(box); a = a.crop(box)
    w = int(round(prod.width * h / prod.height))
    P = np.asarray(prod.resize((w, h), Image.Resampling.LANCZOS), np.float32)
    A = np.asarray(a.resize((w, h), Image.Resampling.LANCZOS), np.float32) / 255
    A[A < 0.03] = 0
    inner = binary_erosion(A > 0.98, iterations=2); A[inner] = 1.0
    A = np.where(inner, 1.0, np.clip((A - 0.25) / 0.75, 0, 1))
    return P, A, inner


def ground(out, p, P, A, px, py):
    """Shadow and faint reflection on the table. Done for every drink before any drink is drawn,
    so one bottle's shadow never lands on another bottle's print."""
    h, w = A.shape
    out, (bl, br, base_row) = season.shadows(A, px, py, w, h, out, p)
    rh = int(h * 0.16); R = gaussian_filter(P[:base_row + 1][::-1][:rh], (2, 2, 0)); RA = A[:base_row + 1][::-1][:rh]
    fade = np.linspace(0.08, 0, rh)[:, None]
    y0 = py + base_row + 1; rr = min(rh, S - y0); reg = out[y0:y0 + rr, px:px + w]; k = (RA[:rr] * fade[:rr])[..., None]
    out[y0:y0 + rr, px:px + w] = reg * (1 - k) + R[:rr] * k
    return out


def place(out, L, P, A, inner, px, py):
    h, w = A.shape
    region = out[py:py + h, px:px + w].copy()
    mn = P.min(2); mx = P.max(2); sat = (mx - mn) / np.maximum(mx, 1)
    printed = ((sat > 0.14) | (mn < 165)) & (A > 0.5)
    protect = binary_dilation(binary_closing(printed, iterations=10), iterations=4)
    glass = (~protect) & (A > 0.5) & (sat < 0.14) & (mn >= 150)
    lab, n = cc_label(glass); sizes = np.bincount(lab.ravel()); keep = sizes >= 1500; keep[0] = False
    protect = protect | (glass & ~keep[lab]); glass = glass & keep[lab]
    trans = np.clip(distance_transform_edt(glass) / 4.0, 0, 1) * np.clip((mn - 150) / 40, 0, 1)
    trans = gaussian_filter(trans, 1.0) * glass
    behind = gaussian_filter(region, (7, 7, 0))
    Pt = P * (1 - trans[..., None]) + np.clip(P * behind / 246.0, 0, 255) * trans[..., None]
    band = (A > 0) & (~inner)
    Aa = np.maximum(A, 1e-3)[..., None]
    dec = np.clip((P - (1 - A[..., None]) * 248) / Aa, 0, 255)
    Pt = np.where(band[..., None], dec, Pt)
    lw = gaussian_filter(region, (5, 5, 0))
    side = np.linspace(1.0, 0.35, w)[None, :]
    kw = (0.18 + 0.22 * L[py:py + h, px:px + w]) * side
    Pt = np.where(band[..., None], Pt * (1 - kw[..., None]) + lw * kw[..., None], Pt)
    out[py:py + h, px:px + w] = region * (1 - A[..., None]) + Pt * A[..., None]
    return out, inner & protect


def compose(scene):
    season.S = S
    p = dict(season.SEASONS["winter"])
    bg, L = season.render_bg(p)
    out = bg.copy()
    items = HEROES[scene]; tallest = max(cm for _, cm in items)
    loaded = [(slug, *load(slug, int(S * TALLEST * cm / tallest))) for slug, cm in items]
    widths = [A.shape[1] for _, _, A, _ in loaded]
    gap = int(S * 0.045); total = sum(widths) + gap * (len(widths) - 1)
    x = (S - total) // 2; base = int(S * season.BASE_Y)
    spots = []
    for (slug, P, A, inner), w in zip(loaded, widths):
        spots.append((x, base - A.shape[0])); x += w + gap
    for (slug, P, A, inner), (px, py) in zip(loaded, spots):
        out = ground(out, p, P, A, px, py)
    checks = []
    for (slug, P, A, inner), (px, py) in zip(loaded, spots):
        out, prot = place(out, L, P, A, inner, px, py)
        checks.append((slug, P, prot, px, py, A.shape[1], A.shape[0]))
    full_alpha = np.zeros((S, S), bool)
    for slug, P, prot, px, py, w, h in checks:
        full_alpha[py:py + h, px:px + w] |= prot
    g = np.random.default_rng(9).normal(0, 1.5, (S, S))[..., None]
    out = np.clip(out + g * (~full_alpha)[..., None], 0, 255).astype(np.uint8)
    res = {}
    for slug, P, prot, px, py, w, h in checks:
        d = np.abs(out[py:py + h, px:px + w].astype(np.float32) - np.clip(P, 0, 255).astype(np.uint8).astype(np.float32)).max(2)
        res[slug] = dict(print_px=int(prot.sum()), print_maxdiff=float(d[prot].max()))
    return out[CROP_TOP:CROP_TOP + 900], res


if __name__ == "__main__":
    scene = sys.argv[1]
    img, res = compose(scene)
    im = Image.fromarray(img)
    for width in (768, 1280):
        im.resize((width, width * 9 // 16), Image.Resampling.LANCZOS).save(
            os.path.join(ROOT, "public", "images", f"scene-{scene}-{width}.webp"), quality=86, method=6)
    path = os.path.join(ROOT, "stills", "scene-hero-fidelity.json")
    allres = json.load(open(path)) if os.path.exists(path) else {}
    allres[scene] = res
    json.dump(allres, open(path, "w"), indent=2, ensure_ascii=False)
    print(json.dumps(res, ensure_ascii=False))
    bad = [s for s, r in res.items() if r["print_maxdiff"] != 0]
    if bad:
        sys.exit("print pixels changed: " + ", ".join(bad))
