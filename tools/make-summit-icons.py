"""Renders the Executive Summit app icon (assets/summit/summit-icon.svg) to the PNG sizes
the page and its manifest use: 180 (iPhone home screen), 192 and 512 (Android install),
64 (browser tab). The icons are full-bleed squares with no transparency, so iOS and
Android can round or mask them as they like.

    python tools/make-summit-icons.py            (from the repo root)
"""
import os
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
D = os.path.join(ROOT, 'assets', 'summit')
svg = open(os.path.join(D, 'summit-icon.svg'), encoding='utf-8').read()
chrome = next(c for c in (r'C:\Program Files\Google\Chrome\Application\chrome.exe',
                          r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe') if os.path.exists(c))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=chrome)
    for px, name in ((180, 'icon-180.png'), (192, 'icon-192.png'), (512, 'icon-512.png'), (64, 'icon-64.png')):
        pg = b.new_page(viewport={'width': px, 'height': px}, device_scale_factor=1)
        pg.set_content('<body style="margin:0;background:#004A54">' + svg.replace('<svg ', f'<svg width="{px}" height="{px}" ', 1) + '</body>')
        pg.screenshot(path=os.path.join(D, name))
        pg.close()
    b.close()
print('ok')
