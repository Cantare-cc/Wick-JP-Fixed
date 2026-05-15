from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

root = Path(__file__).resolve().parent.parent
out_dir = root / "src" / "icons"
out_dir.mkdir(parents=True, exist_ok=True)

BG = (20, 24, 31, 255)
FG = (78, 124, 242, 255)
TEXT = (231, 236, 243, 255)

def draw(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), BG)
    d = ImageDraw.Draw(img)
    pad = max(2, size // 12)
    d.rounded_rectangle([pad, pad, size - pad, size - pad], radius=size // 6, fill=FG)
    label = "JP"
    font_size = max(8, int(size * 0.42))
    font = None
    for candidate in (
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ):
        try:
            font = ImageFont.truetype(candidate, font_size)
            break
        except OSError:
            continue
    if font is None:
        font = ImageFont.load_default()
    bbox = d.textbbox((0, 0), label, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((size - tw) / 2 - bbox[0], (size - th) / 2 - bbox[1] - size * 0.02), label, fill=TEXT, font=font)
    return img

for s in (16, 48, 128):
    p = out_dir / f"icon{s}.png"
    img = draw(s)
    img.save(p)
    print("wrote", p, img.size)
