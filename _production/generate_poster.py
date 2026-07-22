from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
source = Image.open(ROOT / "_production/poster-source-final.webp").convert("RGB")
w, h = source.size
side = min(w, h)
left = (w - side) // 2
top = max(0, min((h - side) // 3, h - side))
square = source.crop((left, top, left + side, top + side)).resize((1024, 1024), Image.Resampling.LANCZOS)
square = ImageEnhance.Contrast(square).enhance(1.08)
draw = ImageDraw.Draw(square)
label_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 18)
title_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Black.ttf", 84)
draw.rectangle((58, 48, 62, 202), fill=(220, 240, 238))
draw.text((82, 48), "06 / LINE FIELD STUDY", font=label_font, fill=(178, 190, 190))
draw.text((78, 77), "BREATH LOOM", font=title_font, fill=(246, 249, 248))
poster = ROOT / "public/poster.png"
thumb = ROOT / "_production/poster-thumb.png"
square.quantize(colors=192, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG).save(poster, optimize=True)
square.resize((160, 160), Image.Resampling.LANCZOS).save(thumb, optimize=True)
