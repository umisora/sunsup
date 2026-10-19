# Drink still rubric

A catalog still is one real product photograph the site can stand on the plinth (`mix-blend-mode: multiply` against white). Judge the pixels. The filename, the slug, and a clean-looking caption are not evidence.

The catalog row supplies `品名`, `容器`, and the opening of `サイズ`. Those are what “the product” means.

## Checks

Each check is `{ "ok": boolean, "reason": string }`. The reason names what is visible. One sentence is enough.

### correct_product

Brand, flavour, and container match the row.

Fail when any of these is visible:

- a different brand
- a different flavour or variety (club soda against tonic, sugar-free against sweetened, apple against grape)
- a different container class from `容器` (can, small can, bottle can, glass bottle, large bottle, PET, carton, cup, pouch)
- a printed volume that contradicts the size in the row (350ml can against a 500ml bottle, 1L against 250ml)

Pass when brand, flavour, and container class match, and no printed size contradicts the row. If the millilitres are not printed, say so, and pass only when the package shape is plausible for that size.

### single_product

Exactly one sellable unit.

Fail a shelf, a second bottle, a multipack, a carton surrounding the bottle, a hand holding it, or a serving suggestion with a glass as a second subject. A soft reflection on the ground does not count as a second product.

### whole_product

Cap (or carton top) through base are inside the frame, with a visible margin. Fail a label close-up, a bottle whose neck or base leaves the frame, or a can whose top or bottom is cut. A margin of a few pixels on every side is enough.

### clean_background

The ground is a cut-out on white, or a plain white / off-white / light-neutral seamless sweep.

Fail a room, wall, table edge, hand, shop shelf, price tag, floor, outdoor scene, or a coloured lifestyle backdrop. A soft contact shadow on an otherwise plain light ground may pass. A grey wall, wood, or perforated retail shelf may not.

### quality

Sharp enough to read the brand at a glance. Fail a tiny source (long edge under 320 pixels, or either edge under 180), a heavy blur, a watermark, a promotional banner that is not part of the package, or a render with waxy highlights and garbled label type. Ordinary JPEG compression on a large photo may pass. Do not fail a 350-pixel square that is otherwise sharp.

### orientation_upright

The package stands the way it does on a shelf. Fail a bottle on its side or upside down. A lean under about 15 degrees may pass.

## Reuse

Byte-identical files (`sha256`) used by two slugs fail both, even when the picture itself would pass. The judge script sets this. A vision pass does not.

## What a pass is

`pass` is true only when every check above is ok and the file is not reused. The script computes `pass`. A vision result must not include it.

## Repair order

1. Right product, whole, single, upright, sharp, dirty ground: cut the product out. White canvas, even padding, no halo. Keep an opaque white ground so multiply still knocks the background out.
2. Wrong product, cropped, several products, or low quality: replace with a real photograph of that exact product (maker site or a retailer product image). Then cut it out the same way. No generated image. No file borrowed from another drink.
3. No acceptable real photograph: clear `静物URL` and delete the unused file. Leave the drink row in place.
