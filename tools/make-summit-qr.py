"""Builds the Executive Summit QR code: assets/summit/executive-summit-qr.png and .svg.

A static QR code: the URL is encoded directly in the pattern, so it has no
expiry and no redirect service behind it. The TD SYNNEX wave mark (the circle
from tdsynnex-logo.svg) sits in the center; error correction level H lets a
scanner rebuild the modules the mark covers.

    python tools/make-summit-qr.py            (from the repo root)

Verification (decodes the files and checks the result) is tools/verify-summit-qr.py.
"""
import io, os, re
import segno
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
URL = 'https://copilotplaybook.com/executive-summit.html'
INK = '#004A54'          # deep TD SYNNEX teal, 9:1 against white
LOGO_FRACTION = 0.21     # mark width as a share of the code width (about 4% of the area)
PAD = 0.012              # white margin around the mark, same share
OUT = os.path.join(ROOT, 'assets', 'summit')
os.makedirs(OUT, exist_ok=True)

svg_src = open(os.path.join(ROOT, 'tdsynnex-logo.svg'), encoding='utf-8').read()
mark_path = re.search(r'<path class="st0" d="([^"]+)"', svg_src).group(1)   # 178 x 178 circle mark

qr = segno.make(URL, error='h', micro=False, boost_error=False)
border = 4
modules = qr.symbol_size(scale=1, border=border)[0]   # modules incl. quiet zone

# ---- PNG ----
scale = 2000 // modules + 1
buf = io.BytesIO()
qr.save(buf, kind='png', scale=scale, border=border, dark=INK, light='white')
img = Image.open(buf).convert('RGBA')
W = img.size[0]
mark = int(W * LOGO_FRACTION)
pad = int(W * PAD)
disc = mark + 2 * pad
cx = cy = W // 2
ss = 4                                              # supersample the white disc for a smooth edge
d = Image.new('L', (disc * ss, disc * ss), 0)
ImageDraw.Draw(d).ellipse((0, 0, disc * ss - 1, disc * ss - 1), fill=255)
d = d.resize((disc, disc), Image.LANCZOS)
img.paste(Image.new('RGBA', (disc, disc), 'white'), (cx - disc // 2, cy - disc // 2), d)

from playwright.sync_api import sync_playwright
mark_svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 178 178" width="{mark * 2}" height="{mark * 2}"><path fill="#24B9D5" fill-rule="evenodd" d="{mark_path}"/></svg>'
with sync_playwright() as p:
    chrome = next(c for c in (r'C:\Program Files\Google\Chrome\Application\chrome.exe',
                              r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe') if os.path.exists(c))
    b = p.chromium.launch(executable_path=chrome)
    pg = b.new_page(viewport={'width': mark * 2, 'height': mark * 2})
    pg.set_content('<body style="margin:0;background:transparent">' + mark_svg + '</body>')
    shot = pg.screenshot(omit_background=True)
    b.close()
m = Image.open(io.BytesIO(shot)).convert('RGBA').resize((mark, mark), Image.LANCZOS)
white_in = Image.new('RGBA', (mark, mark), (0, 0, 0, 0))
mdisc = Image.new('L', (mark * ss, mark * ss), 0)
ImageDraw.Draw(mdisc).ellipse((0, 0, mark * ss - 1, mark * ss - 1), fill=255)
mdisc = mdisc.resize((mark, mark), Image.LANCZOS)
white_in.paste(Image.new('RGBA', (mark, mark), 'white'), (0, 0), mdisc)   # white inside the ring
white_in.alpha_composite(m)
img.alpha_composite(white_in, (cx - mark // 2, cy - mark // 2))
img.convert('RGB').save(os.path.join(OUT, 'executive-summit-qr.png'), optimize=True)

# ---- SVG (vector, for print) ----
sbuf = io.BytesIO()
qr.save(sbuf, kind='svg', scale=1, border=border, dark=INK, light='white', xmldecl=False, svgns=True, nl=False)
svg = sbuf.getvalue().decode('utf-8')
unit = modules
svg = re.sub(r'width="\d+" height="\d+"', f'viewBox="0 0 {unit} {unit}" width="1000" height="1000"', svg, count=1)
mk = unit * LOGO_FRACTION
dc = mk + 2 * unit * PAD
c = unit / 2
overlay = (f'<circle cx="{c}" cy="{c}" r="{dc / 2}" fill="#fff"/>'
           f'<circle cx="{c}" cy="{c}" r="{mk / 2}" fill="#fff"/>'
           f'<g transform="translate({c - mk / 2} {c - mk / 2}) scale({mk / 178})"><path fill="#24B9D5" fill-rule="evenodd" d="{mark_path}"/></g>')
svg = svg.replace('</svg>', overlay + '</svg>')
open(os.path.join(OUT, 'executive-summit-qr.svg'), 'w', encoding='utf-8').write(svg)
print('version', qr.version, 'modules', modules - 2 * border, 'png', W, 'px')
