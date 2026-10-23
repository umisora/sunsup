#!/usr/bin/env python3
"""A wide hero for a scene page, made only from the real product stills of drinks on that page.

The drinks stand side by side on the procedural winter studio backdrop of compose-season-stills.py.
Product pixels are never repainted: label, logo, print and cap stay identical to the cutout
(print_maxdiff must be 0 for every drink). Heights are a visual scale by bottle class (see HEROES).

Input:  stills/masters/<slug>.png (transparent cutout; made from public/drinks/<slug>.webp with
        rembg when missing, RGB kept as is, only alpha added)
Output: public/images/scene-<scene>-{768,1152}.webp (4:5) and stills/scene-hero-fidelity.json

Usage (repo root):  python3 scripts/compose-scene-hero.py bonenkai   (or category:citrus)
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
    "bonenkai": dict(season="winter", drinks=[
        ("kimino-yuzu", 0.66),
        ("ringowork-original-720", 1.0),
        ("kimura-wasabi-ginger", 0.66),
        ("maison-perrier-raspberry-330", 0.70),
    ]),
    # Autumn: the season most office parties are planned in right now. Bottles 1.0, 185-190g cans about 0.6.
    "kaisha": dict(season="autumn", drinks=[
        ("kimino-ringo", 1.0),
        ("pom-harehime-190", 0.62),
        ("kimino-mikan", 1.0),
        ("kobe-grape-bitan-185", 0.60),
    ]),
    # Spring: welcome and farewell parties are in March and April.
    "kansougeikai": dict(season="spring", drinks=[
        ("kimino-ume", 1.0),
        ("makubetsu-ichigo-cider", 1.05),
        ("kimino-momo", 1.0),
        ("kimura-momo-cider", 0.95),
    ]),
    # Summer: cold drinks for the office are the classic 差し入れ.
    "sashiire": dict(season="summer", drinks=[
        ("kataura-lemon-cider-330", 1.0),
        ("kobe-lemonade-soda-185", 0.58),
        ("kimura-izu-lemon", 0.85),
        ("pom-kawachi-190", 0.60),
    ]),
    # Winter: year-end greetings and New Year visits are when a bottle is handed over most.
    "nomanai-hito": dict(season="winter", drinks=[
        ("kimura-fukuneko", 1.0),
        ("noda-shio-cider", 0.95),
        ("shodoshima-olive-cider-200", 0.80),
        ("sanpellegrino-sparkling-250", 0.95),
    ]),
}
# Category pages (/category/<id>/) get the same kind of hero: category:<id> on the command line,
# public/images/category-<id>-{768,1152}.webp, results in stills/category-hero-fidelity.json.
CATEGORY_HEROES = {
    # Summer: cold citrus sodas. One drink per container (bottle-can, PET, slim can, can), none from another hero.
    "citrus": dict(season="summer", drinks=[
        ("umaji-yuzu-cider-280", 0.78),
        ("dydo-wano-yuzu", 1.0),
        ("sanpellegrino-aranciata-rossa-330", 0.74),
        ("kimino-yuzu-water", 0.58),
    ]),
    # Autumn: the grape harvest. No dark tall bottle (it reads as wine); no tonic or ginger beer in any hero.
    "grape": dict(season="autumn", drinks=[
        ("kimura-ichigo-cider", 0.72),
        ("pom-grape-800", 1.0),
        ("sanpellegrino-melograno-330", 0.70),
        ("hata-awawa-blueberry-500", 0.95),
    ]),
    # Summer: peaches and cold juice.
    "nectar": dict(season="summer", drinks=[
        ("kimura-mikan100-200", 0.80),
        ("fujiya-kodawari-peach", 0.70),
        ("pom-juice-280", 0.80),
        ("dydo-peach-nectar", 0.62),
    ]),
    # Spring: the new-tea season.
    "tea": dict(season="spring", drinks=[
        ("twining-earl-grey", 1.0),
        ("kobe-chabo-jasmine-500", 0.95),
        ("kimino-sencha", 0.70),
        ("pokka-maroyaka-195", 0.55),
    ]),
    # Autumn: local ciders; only bottles, as the category name says.
    "craft": dict(season="autumn", drinks=[
        ("chichibu-cider-340", 0.95),
        ("swan-cider", 0.95),
        ("ashoro-onneto-cider-240", 0.80),
        ("kodama-ramune-200", 0.85),
    ]),
    # Winter: year-end parties with many people.
    "party": dict(season="winter", drinks=[
        ("craftboss-black-500", 1.0),
        ("hata-soda-ramune", 0.80),
        ("sanpellegrino-limonata", 0.62),
        ("kobe-gatsun-185", 0.50),
    ]),
}
MAX_UPSCALE = 1.6   # a cutout drawn bigger than this over its source pixels looks soft; pick another still
S = 1600          # square backdrop; the hero is its middle 4:5 (1280 x 1600), the PageIntro frame on wide
                  # screens. On phones the frame is about square, so the drinks stay inside the middle 80%.
CROP_W = 1280
OUT_SCALE = 1152 / 1280   # the largest file is 1152 wide
TALLEST = 0.52    # tallest bottle as a share of S
HORIZON = 0.64    # table edge, a little higher than the single stills so the row sits in the middle
BASE_Y = 0.79


def master(slug):
    path = os.path.join(ROOT, "stills", "masters", f"{slug}.png")
    if not os.path.exists(path):
        from rembg import new_session, remove
        src = Image.open(os.path.join(ROOT, "public", "drinks", f"{slug}.webp")).convert("RGB")
        cut = remove(src, session=new_session("u2net"), post_process_mask=True)
        rgba = src.copy(); rgba.putalpha(cut.getchannel("A"))   # keep the original RGB untouched
        rgba.save(path)
    return Image.open(path).convert("RGBA")


UPSCALE = {}


def load(slug, h):
    m = master(slug); prod = m.convert("RGB"); a = m.getchannel("A")
    A0 = np.asarray(a, np.float32) / 255; ys, xs = np.where(A0 > 0.5)
    box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    prod = prod.crop(box); a = a.crop(box)
    UPSCALE[slug] = round(h * OUT_SCALE / prod.height, 2)
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
    season.S = S; season.HORIZON = HORIZON; season.BASE_Y = BASE_Y
    hero = CATEGORY_HEROES[scene[9:]] if scene.startswith("category:") else HEROES[scene]
    p = dict(season.SEASONS[hero["season"]])
    bg, L = season.render_bg(p)
    out = bg.copy()
    items = hero["drinks"]; tallest = max(k for _, k in items)
    gap = int(S * 0.045); room = int(CROP_W * 0.88)
    top = TALLEST
    while True:   # shrink the whole row until it fits the 4:5 frame with a margin
        loaded = [(slug, *load(slug, int(S * top * k / tallest))) for slug, k in items]
        widths = [A.shape[1] for _, _, A, _ in loaded]
        total = sum(widths) + gap * (len(widths) - 1)
        if total <= room:
            break
        top *= 0.96
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
        res[slug] = dict(print_px=int(prot.sum()), print_maxdiff=float(d[prot].max()), upscale=UPSCALE[slug])
    left = (S - CROP_W) // 2
    return out[:, left:left + CROP_W], res


if __name__ == "__main__":
    for scene in sys.argv[1:] or list(HEROES):
        img, res = compose(scene)
        im = Image.fromarray(img)
        kind, key = ("category", scene[9:]) if scene.startswith("category:") else ("scene", scene)
        for width in (768, 1152):
            im.resize((width, width * 5 // 4), Image.Resampling.LANCZOS).save(
                os.path.join(ROOT, "public", "images", f"{kind}-{key}-{width}.webp"), quality=86, method=6)
        path = os.path.join(ROOT, "stills", f"{kind}-hero-fidelity.json")
        allres = json.load(open(path)) if os.path.exists(path) else {}
        allres[key] = res
        json.dump(allres, open(path, "w"), indent=2, ensure_ascii=False)
        print(json.dumps(res, ensure_ascii=False))
        bad = [s for s, r in res.items() if r["print_maxdiff"] != 0]
        if bad:
            sys.exit("print pixels changed: " + ", ".join(bad))
        soft = [f"{s} x{r['upscale']}" for s, r in res.items() if r["upscale"] > MAX_UPSCALE]
        if soft:
            sys.exit("cutout drawn too large for its source: " + ", ".join(soft))
