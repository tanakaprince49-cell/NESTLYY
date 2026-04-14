"""
Recenter the splash-icon card onto the geometric center of the canvas.

The original asset has the app-icon card sitting at (509, 362), roughly
the upper third. Expo's resizeMode: "contain" letterboxes the square
canvas and centers it vertically, so the card ends up in the upper third
of the phone screen instead of the middle.

Strategy: keep the original sky and cloud artwork, erase only the old
card-and-halo rectangle with a locally-sampled sky patch, and overlay a
feathered card-and-halo sprite at (512, 512). This avoids the horizontal
seam at the mid-canvas that a naive top-half/bottom-half rebuild would
introduce, and preserves the diagonal light rays and stars on the sides.

1. Crop the card-and-halo sprite from the original. Give it a
   gaussian-blurred rectangular alpha mask so its edges fade softly into
   whatever lands around it.
2. Erase the old sprite location by stretching a 60-px strip of the
   original top sky (where variance is near-zero) to cover the sky
   portion of the old sprite rectangle. The stretch, rather than a tile,
   avoids visible horizontal banding from repeated sparkle artifacts.
3. Overlay the feathered sprite at (512, 512) center. The lower half of
   the sprite falls into the original cloud region and its feathered
   halo blends naturally with the clouds, so the transition is invisible.

Running this twice shifts the card further off-center, since it rewrites
the asset in place. Use `git checkout -- packages/mobile/assets/splash-icon.png`
before re-running if you want to iterate.

Usage: python3 scripts/recenter-splash.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

REPO_ROOT = Path(__file__).resolve().parent.parent
SRC = REPO_ROOT / "packages/mobile/assets/splash-icon.png"

# Card + halo bounds in the original, measured via a rose-pixel scan
# (card body y=264..460 x=401..618) extended with halo padding.
SPRITE_X0, SPRITE_Y0 = 199, 132
SPRITE_X1, SPRITE_Y1 = 819, 592
SPRITE_CARD_OFFSET = (509 - SPRITE_X0, 362 - SPRITE_Y0)

TARGET_CARD_CENTER = (512, 512)

# Only erase the sky portion of the old sprite rectangle. The cloud
# region below y=500 has natural texture that hides any halo residue,
# and sampling sky over clouds would leave a visible pink patch.
ERASE_Y_END = 500

# Top 60 px of the original is uniform pink sky (row-variance < 15),
# safe to stretch vertically to fill the erased rectangle.
SKY_SAMPLE_HEIGHT = 60

# Feather radius on the sprite alpha mask. Large enough that the halo
# edges blur into the surrounding sky/clouds without a visible rectangle.
FEATHER_RADIUS = 40


def build_sprite_with_alpha(src: Image.Image) -> Image.Image:
    sprite = src.crop((SPRITE_X0, SPRITE_Y0, SPRITE_X1, SPRITE_Y1)).convert("RGBA")
    w, h = sprite.size

    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rectangle(
        [FEATHER_RADIUS, FEATHER_RADIUS, w - FEATHER_RADIUS, h - FEATHER_RADIUS],
        fill=255,
    )
    mask = mask.filter(ImageFilter.GaussianBlur(radius=FEATHER_RADIUS / 2))

    sprite.putalpha(mask)
    return sprite


def erase_old_sprite(out: Image.Image, src: Image.Image) -> None:
    erase_w = SPRITE_X1 - SPRITE_X0
    erase_h = ERASE_Y_END - SPRITE_Y0

    sky = src.crop((SPRITE_X0, 0, SPRITE_X1, SKY_SAMPLE_HEIGHT))
    sky_stretched = sky.resize((erase_w, erase_h), Image.LANCZOS)
    sky_stretched = sky_stretched.filter(ImageFilter.GaussianBlur(radius=1))

    # Feather the erased patch so its edges blend with the surrounding
    # sky and the transition into the clouds below.
    patch = sky_stretched.convert("RGBA")
    mask = Image.new("L", (erase_w, erase_h), 0)
    ImageDraw.Draw(mask).rectangle(
        [20, 20, erase_w - 20, erase_h - 20],
        fill=255,
    )
    mask = mask.filter(ImageFilter.GaussianBlur(radius=20))
    patch.putalpha(mask)

    out.paste(patch, (SPRITE_X0, SPRITE_Y0), patch)


def main() -> None:
    src = Image.open(SRC).convert("RGB")
    W, H = src.size
    if (W, H) != (1024, 1024):
        raise SystemExit(f"expected 1024x1024, got {W}x{H}")

    out = src.copy()

    erase_old_sprite(out, src)

    sprite = build_sprite_with_alpha(src)
    paste_x = TARGET_CARD_CENTER[0] - SPRITE_CARD_OFFSET[0]
    paste_y = TARGET_CARD_CENTER[1] - SPRITE_CARD_OFFSET[1]
    out.paste(sprite, (paste_x, paste_y), sprite)

    out.save(SRC, "PNG", optimize=True)
    print(f"wrote {SRC} ({W}x{H}, card centered at {TARGET_CARD_CENTER})")


if __name__ == "__main__":
    main()
