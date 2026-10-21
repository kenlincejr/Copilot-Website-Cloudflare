"""Decodes the Executive Summit QR code the way a phone would and checks the result.

    python tools/verify-summit-qr.py            (from the repo root)

Two independent decoders (OpenCV and ZXing) must both read the exact URL from the
PNG and from a browser render of the SVG, after being shrunk to phone-preview sizes,
blurred, JPEG-compressed, rotated, tilted and printed in grayscale. Exits non-zero
on any miss. Needs: opencv-python, zxing-cpp, pillow, playwright, numpy.
"""
import io, os, sys
import cv2, numpy as np, zxingcpp
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
URL = 'https://copilotplaybook.com/executive-summit.html'
D = os.path.join(ROOT, 'assets', 'summit')
fails, total = [], 0


def decode_cv(im):
    arr = cv2.cvtColor(np.array(im.convert('RGB')), cv2.COLOR_RGB2BGR)
    return cv2.QRCodeDetector().detectAndDecode(arr)[0]


def decode_zx(im):
    r = zxingcpp.read_barcodes(im.convert('RGB'))
    return r[0].text if r else ''


def check(label, im):
    global total
    for name, fn in (('opencv', decode_cv), ('zxing', decode_zx)):
        total += 1
        got = ''
        try:
            got = fn(im)
        except Exception as e:
            got = 'ERR ' + str(e)
        if got != URL:
            fails.append(f'{label} [{name}] -> {got!r}')


def variants(src):
    yield 'full', src
    for px in (800, 500, 360, 280, 220):
        yield f'{px}px', src.resize((px, px), Image.LANCZOS)
    for px in (400, 280):
        s = src.resize((px, px), Image.LANCZOS)
        yield f'{px}px blur', s.filter(ImageFilter.GaussianBlur(1.0))
        buf = io.BytesIO(); s.save(buf, 'JPEG', quality=35); yield f'{px}px jpeg35', Image.open(buf)
        yield f'{px}px gray', s.convert('L')
    for ang in (7, 20, 45, 90, 180):
        yield f'rot{ang}', src.resize((600, 600), Image.LANCZOS).rotate(ang, expand=True, fillcolor='white')
    s = np.array(src.resize((600, 600), Image.LANCZOS).convert('RGB'))
    for k, shift in enumerate((40, 70)):
        pts = np.float32([[0, 0], [599, 0], [599, 599], [0, 599]])
        dst = np.float32([[shift, 0], [599 - shift, 40], [599 - shift, 559], [shift, 599]])
        M = cv2.getPerspectiveTransform(pts, dst)
        w = cv2.warpPerspective(s, M, (600, 600), borderValue=(255, 255, 255))
        yield f'tilt{shift}', Image.fromarray(w)
    # a code on a larger dark-ish table photo: pad with noise background
    big = Image.new('RGB', (1000, 1000), (60, 55, 50))
    big.paste(src.resize((520, 520), Image.LANCZOS), (240, 240))
    yield 'on-dark-background', big


png = Image.open(os.path.join(D, 'executive-summit-qr.png')).convert('RGB')
for label, im in variants(png):
    check('png ' + label, im)

from playwright.sync_api import sync_playwright
svg = open(os.path.join(D, 'executive-summit-qr.svg'), encoding='utf-8').read()
chrome = next(c for c in (r'C:\Program Files\Google\Chrome\Application\chrome.exe',
                          r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe') if os.path.exists(c))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=chrome)
    for px in (1000, 300):
        pg = b.new_page(viewport={'width': px, 'height': px})
        pg.set_content(f'<body style="margin:0;background:#fff"><div style="width:{px}px;height:{px}px">{svg}</div>'
                       f'<style>svg{{width:{px}px;height:{px}px;display:block}}</style></body>')
        im = Image.open(io.BytesIO(pg.screenshot())).convert('RGB')
        for label, v in variants(im.resize((1000, 1000))) if px == 1000 else [(f'svg{px}', im)]:
            check(f'svg@{px} {label}', v)
    b.close()

print(f'{total - len(fails)}/{total} decodes returned exactly {URL}')
for f in fails:
    print('MISS', f)
sys.exit(1 if fails else 0)
