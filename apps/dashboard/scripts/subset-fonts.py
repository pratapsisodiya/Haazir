"""
Cuts Anek Devanagari down to what the design uses (spec §14.3).

The upstream variable font carries two axes (width 75–125%, weight 100–800)
and weighs ~726 KB for Devanagari alone: too much for a ₹12,000 phone on 4G.
Haazir only sets headings and big numbers in it, always semi-condensed and at
weight 600–650, so we pin width to 87.5% and keep weight 600–650 variable.

Run after upgrading @fontsource-variable/anek-devanagari:
    pip install fonttools brotli
    python3 scripts/subset-fonts.py
"""
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "node_modules/@fontsource-variable/anek-devanagari/files"
OUT = ROOT / "src/assets/fonts"

for subset in ("devanagari", "latin", "latin-ext"):
    source = SRC / f"anek-devanagari-{subset}-wdth-normal.woff2"
    font = TTFont(source)
    instantiateVariableFont(font, {"wdth": 87.5, "wght": (600, 650)}, inplace=True)
    font.flavor = "woff2"
    target = OUT / f"anek-devanagari-{subset}-display.woff2"
    font.save(target)
    print(f"{target.name}: {source.stat().st_size // 1024} KB -> {target.stat().st_size // 1024} KB")
