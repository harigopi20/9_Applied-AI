#!/usr/bin/env python3
"""Add the rule-engine columns to the team workbook data/product_catalogue.xlsx
and export its sheets to CSV.

DR-01: the team's workbook is the only product source. The rule engine
(app/rules.js) needs these columns in the *Products* sheet:

  variant_group  products with the same name are variants of each other (RB-03)
  pack_qty       pieces per sales unit; empty = unclear → no total (RB-13)
  pack_unit      "pcs" or "item"
  specs          key=value pairs for compatibility and quantity rules, e.g. diameter_mm=8

plus data_note for values added here. Since workbook v2 (27 Oct 2026) the team
fills these columns itself, so the script only fills EMPTY cells and adds
missing spec keys from SPECS below – values written by the team are never
overwritten. All other cells stay as the team wrote them.

Afterwards the sheets Products, Store stock and Stores are exported to
products.csv, store_stock.csv and stores.csv, as described in data/README.md.

Usage:  python3 tools/add_rule_columns.py
"""
import csv
import re
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
WORKBOOK = ROOT / "data" / "product_catalogue.xlsx"
EXPORTS = [
    # (sheet, first header cell, CSV file, line ending as in the team's original export)
    ("Products", "product_nr", ROOT / "data" / "products.csv", "\n"),
    ("Store stock", "product_nr", ROOT / "data" / "store_stock.csv", "\r\n"),
    ("Stores", "store_id", ROOT / "data" / "stores.csv", "\r\n"),
]

NEW_COLUMNS = ["variant_group", "pack_qty", "pack_unit", "specs", "data_note"]

# Structured specs for the compatibility and quantity rules (FR-09, RB-03, R-14),
# from the size text. Keys are only added if the product does not have them yet.
SPECS = {
    "P001": "volume_l=10", "P002": "volume_l=5", "P003": "volume_l=2.5", "P004": "volume_l=2.5",
    "P076": "volume_l=2.5",
    "P097": "height_mm=2035",
    "P035": "diameter_mm=6", "P036": "diameter_mm=8", "P037": "diameter_mm=10",
    "P043": "diameter_mm=6", "P044": "diameter_mm=8", "P045": "diameter_mm=10",
    "P046": "thread=M5", "P047": "thread=M8;length_mm=80",
    "P048": "diameter_mm=4;length_mm=40", "P049": "diameter_mm=5;length_mm=50",
    "P050": "diameter_mm=6;length_mm=60",
    "P058": "arm_mm=150", "P059": "arm_mm=200", "P060": "arm_mm=250",
    "P063": "length_mm=800;depth_mm=200;thickness_mm=18",
    "P064": "length_mm=800;depth_mm=250;thickness_mm=18",
}

# Values filled here because the team data leaves them empty – team to verify (SR-10).
FILL_IF_EMPTY = {
    "P051": {"suitable_wall_types": "brick;plasterboard"},
}


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", str(text).lower()).strip("-")


def pack_info(size, category):
    """Pieces per sales unit – only where the size states it ("50 pcs")."""
    m = re.search(r"(\d+)\s*pcs\b", str(size or ""))
    if m and category in ("Fixings", "Shelving", "Safety"):
        return int(m.group(1)), "pcs"
    return 1, "item"


def merge_specs(current, extra):
    """Adds the keys of `extra` that `current` does not have; keeps the order of `current`."""
    pairs = [p for p in str(current or "").split(";") if "=" in p]
    keys = {p.split("=", 1)[0].strip() for p in pairs}
    pairs += [p for p in str(extra or "").split(";") if "=" in p and p.split("=", 1)[0].strip() not in keys]
    return ";".join(pairs)


def empty(v):
    return v is None or str(v).strip() == ""


def fill_products(ws):
    header_row = next(r for r in range(1, ws.max_row + 1) if ws.cell(r, 1).value == "product_nr")
    header = [c.value for c in ws[header_row]]
    while header and header[-1] is None:
        header.pop()
    for name in NEW_COLUMNS:
        if name not in header:
            header.append(name)
            ws.cell(header_row, len(header), name)
            ws.cell(header_row, len(header))._style = ws.cell(header_row, 1)._style
    col = {name: i + 1 for i, name in enumerate(header)}

    count = 0
    for r in range(header_row + 1, ws.max_row + 1):
        nr = ws.cell(r, col["product_nr"]).value
        if not nr or not re.fullmatch(r"P\d+", str(nr)):
            continue
        count += 1
        get = lambda k: ws.cell(r, col[k]).value
        notes = []
        for key, value in FILL_IF_EMPTY.get(nr, {}).items():
            if empty(get(key)):
                ws.cell(r, col[key], value)
                notes.append(f"{key} added for the app – team to verify (SR-10)")
        qty, unit = pack_info(get("size"), get("category"))
        if empty(get("variant_group")):
            ws.cell(r, col["variant_group"], slug(get("product_name")))
        if empty(get("pack_qty")):
            ws.cell(r, col["pack_qty"], qty)
        if empty(get("pack_unit")):
            ws.cell(r, col["pack_unit"], unit)
        specs = merge_specs(get("specs"), SPECS.get(nr, ""))
        if specs != (get("specs") or ""):
            added = [p for p in specs.split(";") if p not in str(get("specs") or "").split(";")]
            ws.cell(r, col["specs"], specs)
            notes.append("specs " + ", ".join(added) + " added for the app from the size")
        if notes:
            old = get("data_note")
            new = "; ".join(notes)
            if empty(old):
                ws.cell(r, col["data_note"], new)
            elif new not in str(old):
                ws.cell(r, col["data_note"], f"{old}; {new}")
    return count


def fmt(v):
    if v is None:
        return ""
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v)


def export(ws, key, path, eol):
    """Writes the table below the header row whose first cell is `key` (title rows above are skipped)."""
    grid = [list(r) for r in ws.iter_rows(values_only=True)]
    h = next(i for i, row in enumerate(grid) if row and row[0] == key)
    header = grid[h]
    while header and header[-1] is None:
        header.pop()
    pattern = r"P\d+" if key == "product_nr" else r"[A-Z0-9-]{1,20}"
    rows = [row[:len(header)] for row in grid[h + 1:] if row and row[0] and re.fullmatch(pattern, str(row[0]))]
    with path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh, lineterminator=eol)
        w.writerow(header)
        w.writerows([[fmt(v) for v in row] for row in rows])
    return len(rows)


def main():
    wb = openpyxl.load_workbook(WORKBOOK)
    n = fill_products(wb["Products"])
    wb.save(WORKBOOK)
    print(f"updated {WORKBOOK.relative_to(ROOT)} (Products: {n} products)")
    for sheet, key, path, eol in EXPORTS:
        if sheet in wb.sheetnames:
            print(f"  {sheet} → {path.relative_to(ROOT)}: {export(wb[sheet], key, path, eol)} rows")


if __name__ == "__main__":
    main()
