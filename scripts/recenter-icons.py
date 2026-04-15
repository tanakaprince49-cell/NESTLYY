"""
Recenter the rose card inside icon.png and adaptive-icon.png.

Context: splash-off-center bug (#280). Splash-icon.png was fixed first,
then Tanaka reported the Android home-screen icon was still off: the
rose squircle with the NESTLY logo sat up-and-to-the-right on the
background instead of centered. Android 12+ also uses icon.png and
adaptive-icon.png for the system splash (cropped to whatever mask the
launcher applies), so both assets have to be fixed the same way.

Earlier strategy (shift the whole image) moved the surrounding blush
background along with the card and left a discoloured strip on the
opposite edge. Tanaka wants the background left alone and only the
rose card (squircle + halo + shadow) repositioned inside it.

Current strategy -- same technique as scripts/recenter-splash.py:

1. Detect the rose-pixel bounding box and expand it by SPRITE_PADDING
   to include the light halo and drop shadow.
2. Extract that rectangle as an RGBA sprite with a feathered alpha mask
   so the sprite dissolves softly into whatever lands around it.
3. Build a fresh canvas the same size as the source:
     - icon.png is RGB with a solid blush background; fill the new
       canvas with the corner-averaged background colour.
     - adaptive-icon.png is RGBA with a transparent outer area (Android
       composites it over the adaptiveIcon.backgroundColor from
       app.json); fill the new canvas fully transparent.
4. Paste the sprite at the target position = canvas center + offset.

This leaves the outer edge of each asset untouched (for icon.png the
blush corners are reconstructed from the original's corner samples, and
for adaptive-icon.png they stay exactly transparent), and only the
rose card moves.

Running twice is safe because the script reads from the file on disk
each run; to iterate on offsets, restore the originals first:
    git checkout -- packages/mobile/assets/{icon,adaptive-icon}.png

Usage: python3 scripts/recenter-icons.py
"""
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter

REPO_ROOT = Path(__file__).resolve().parent.parent
ASSETS = REPO_ROOT / "packages/mobile/assets"

CANVAS = 1024
CENTER = CANVAS // 2

# Offset of the card center from the geometric canvas center. Negative X
# moves the card left, positive Y moves it down. Tanaka wants the rose
# squircle sitting slightly down-and-left of center so the drop shadow
# in the lower-right reads as the card "resting" on the icon.
EXTRA_OFFSET_X = -50
EXTRA_OFFSET_Y = 50

# Padding around the rose-pixel bounding box when we extract the sprite.
# The rose threshold only catches the saturated-pink squircle body; the
# light-pink halo and drop shadow fall outside it, so we need enough
# margin that the sprite rectangle includes all of the soft glow. 80 px
# is big enough for the shadow under the card on icon.png without
# pulling in any corner background.
SPRITE_PADDING = 80

# Gaussian blur radius on the sprite's rectangular alpha mask. Big
# enough that the sprite edges dissolve into whatever they land on --
# for icon.png that's the solid blush fill (so the halo blends cleanly)
# and for adaptive-icon.png that's transparent (so the halo fades out).
FEATHER_RADIUS = 40


def detect_rose_bbox(im: Image.Image) -> tuple[int, int, int, int]:
    rgb = im.convert("RGB")
    px = rgb.load()
    W, H = rgb.size
    xs, ys = [], []
    for y in range(H):
        for x in range(W):
            r, g, b = px[x, y]
            if r > 200 and g < 180 and b < 200 and (r - g) > 40:
                xs.append(x)
                ys.append(y)
    if not xs:
        raise SystemExit("no rose card pixels detected")
    return min(xs), min(ys), max(xs), max(ys)


def sample_background(rgb: Image.Image) -> tuple[int, int, int]:
    W, H = rgb.size
    patches = [
        rgb.crop((0, 0, 20, 20)),
        rgb.crop((W - 20, 0, W, 20)),
        rgb.crop((0, H - 20, 20, H)),
        rgb.crop((W - 20, H - 20, W, H)),
    ]
    pixels = [p for patch in patches for p in patch.getdata()]
    r = sum(p[0] for p in pixels) // len(pixels)
    g = sum(p[1] for p in pixels) // len(pixels)
    b = sum(p[2] for p in pixels) // len(pixels)
    return r, g, b


def build_feathered_sprite(
    im: Image.Image, sprite_rect: tuple[int, int, int, int]
) -> Image.Image:
    x0, y0, x1, y1 = sprite_rect
    sprite = im.crop((x0, y0, x1, y1)).convert("RGBA")
    w, h = sprite.size

    feather = Image.new("L", (w, h), 0)
    ImageDraw.Draw(feather).rectangle(
        [FEATHER_RADIUS, FEATHER_RADIUS, w - FEATHER_RADIUS, h - FEATHER_RADIUS],
        fill=255,
    )
    feather = feather.filter(ImageFilter.GaussianBlur(radius=FEATHER_RADIUS / 2))

    # Combine with any existing alpha (adaptive-icon.png has a
    # transparent outer area) so already-transparent pixels stay that
    # way. ImageChops.darker is per-pixel min, which is the right
    # operation for "keep whichever mask is more restrictive".
    existing_alpha = sprite.split()[3]
    sprite.putalpha(ImageChops.darker(feather, existing_alpha))
    return sprite


def recenter(path: Path) -> None:
    im = Image.open(path)
    W, H = im.size
    if (W, H) != (CANVAS, CANVAS):
        raise SystemExit(f"{path.name}: expected {CANVAS}x{CANVAS}, got {W}x{H}")

    bbox = detect_rose_bbox(im)
    cx = (bbox[0] + bbox[2]) // 2
    cy = (bbox[1] + bbox[3]) // 2

    x0 = max(0, bbox[0] - SPRITE_PADDING)
    y0 = max(0, bbox[1] - SPRITE_PADDING)
    x1 = min(W, bbox[2] + SPRITE_PADDING)
    y1 = min(H, bbox[3] + SPRITE_PADDING)

    print(
        f"{path.name}: rose bbox=({bbox[0]},{bbox[1]})-({bbox[2]},{bbox[3]}), "
        f"card center=({cx},{cy}), sprite rect=({x0},{y0})-({x1},{y1})"
    )

    sprite = build_feathered_sprite(im, (x0, y0, x1, y1))

    target_x = CENTER + EXTRA_OFFSET_X
    target_y = CENTER + EXTRA_OFFSET_Y
    # Anchor the sprite by the rose-pixel center (cx, cy). Its offset
    # from the sprite's top-left in sprite-local coords is (cx - x0,
    # cy - y0); paste so that that point lands on (target_x, target_y).
    paste_x = target_x - (cx - x0)
    paste_y = target_y - (cy - y0)

    if im.mode == "RGBA":
        out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    else:
        fill = sample_background(im.convert("RGB"))
        out = Image.new("RGB", im.size, fill)

    out.paste(sprite, (paste_x, paste_y), sprite)

    print(f"  card now at ({target_x}, {target_y}), sprite pasted at ({paste_x}, {paste_y})")
    out.save(path, "PNG", optimize=True)


def main() -> None:
    recenter(ASSETS / "icon.png")
    recenter(ASSETS / "adaptive-icon.png")


if __name__ == "__main__":
    main()
