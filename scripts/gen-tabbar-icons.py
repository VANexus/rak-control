from PIL import Image, ImageDraw
from pathlib import Path

# 仓内相对路径（跨平台：以脚本位置定位仓库根）
out = Path(__file__).resolve().parent.parent / "src" / "assets" / "tabbar"
out.mkdir(parents=True, exist_ok=True)


def icon(name, draw_fn, selected=False):
    size = 81
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    color = (94, 106, 210, 255) if selected else (115, 115, 115, 255)
    draw_fn(d, size, color)
    suffix = "-active" if selected else ""
    img.save(out / f"{name}{suffix}.png")


def home(d, s, c):
    d.polygon([(s // 2, 10), (12, s // 2 - 4), (s - 12, s // 2 - 4)], outline=c, width=3)
    d.rectangle([20, s // 2 - 4, s - 20, s - 14], outline=c, width=3)
    d.rectangle([s // 2 - 5, s - 24, s // 2 + 5, s - 14], outline=c, width=2)


def club(d, s, c):
    d.ellipse([14, 18, s - 14, s - 18], outline=c, width=3)
    d.ellipse([s // 2 - 8, 28, s // 2 + 8, 44], outline=c, width=2)
    d.arc([22, 48, s - 22, s - 28], 200, 340, fill=c, width=3)


def roi(d, s, c):
    d.rectangle([16, s - 36, 28, s - 20], outline=c, width=2)
    d.rectangle([s // 2 - 6, s - 48, s // 2 + 6, s - 20], outline=c, width=2)
    d.rectangle([s - 28, s - 32, s - 16, s - 20], outline=c, width=2)
    d.line([14, s - 14, s - 14, s - 14], fill=c, width=2)


def me(d, s, c):
    d.ellipse([s // 2 - 12, 16, s // 2 + 12, 40], outline=c, width=3)
    d.arc([20, 44, s - 20, s - 8], 200, 340, fill=c, width=3)


def task(d, s, c):
    # 清单板：外框 + 三行勾选项
    d.rounded_rectangle([18, 12, s - 18, s - 12], radius=8, outline=c, width=3)
    for i, y in enumerate((28, 42, 56)):
        d.line([28, y, 38, y], fill=c, width=3)
        if i < 2:
            d.line([26, y, 30, y + 4], fill=c, width=2)
            d.line([30, y + 4, 36, y - 4], fill=c, width=2)


for name, fn in [("home", home), ("task", task), ("roi", roi), ("club", club), ("me", me)]:
    icon(name, fn, False)
    icon(name, fn, True)
print("ok", sorted(p.name for p in out.iterdir()))
