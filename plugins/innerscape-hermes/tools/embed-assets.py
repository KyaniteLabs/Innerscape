#!/usr/bin/env python3
"""Embed the desktop fonts and cairn mark into desktop/plugin.js between the ASSETS markers.

Desktop plugins may import only the SDK and React, so these ship inline as base64.
Rebuild the font subsets from Chakra Petch (OFL; the licence ships in desktop/fonts/OFL.txt) with:
  pyftsubset ChakraPetch-<W>.ttf --flavor=woff --output-file=desktop/fonts/cp-<W>.woff \
    --unicodes="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2022,U+2026,U+2190-2193,U+00D7,U+2212" \
    --layout-features='kern,liga'
desktop/cairn-64.png is branding/innerscape-512.png downscaled (Lanczos) to 64 px.
"""
import base64
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEIGHTS = {"Medium": 500, "Bold": 700}


def b64(path: Path) -> str:
    return base64.b64encode(path.read_bytes()).decode()


fonts = ",\n".join(f"  {w}: '{b64(ROOT / 'desktop/fonts' / f'cp-{n}.woff')}'" for n, w in WEIGHTS.items())
block = f"const FONTS = {{\n{fonts}\n}}\nconst CAIRN = '{b64(ROOT / 'desktop/cairn-64.png')}'"

js = ROOT / "desktop/plugin.js"
src = js.read_text()
new, n = re.subn(r"(// --- ASSETS \(generated\) -+\n).*?(\n// --- /ASSETS)", lambda m: m.group(1) + block + m.group(2), src, flags=re.S)
if n != 1:
    raise SystemExit("ASSETS markers not found")
js.write_text(new)
print(f"embedded {len(WEIGHTS)} weights and the cairn, plugin.js is {len(new) // 1024} KB")
