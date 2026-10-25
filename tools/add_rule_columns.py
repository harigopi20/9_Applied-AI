#!/usr/bin/env python3
"""Add the rule-engine columns to the team workbook data/product_catalogue.xlsx.

DR-01: the team's workbook is the only product source. The rule engine
(app/rules.js) needs four extra columns in the *Products* sheet that the
team data does not have yet:

  variant_group  products with the same name are variants of each other (RB-03)
  pack_qty       pieces per sales unit; empty = unclear → no total (RB-13)
  pack_unit      "pcs" or "item"
  specs          key=value pairs for compatibility checks, e.g. diameter_mm=8

plus data_note for values added here. The script only adds or refreshes these
columns (and fills P051's empty wall types, flagged in data_note); all other
cells stay as the team wrote them. Afterwards products.csv is re-exported
from the sheet, as described in data/README.md.

Usage:  python3 tools/add_rule_columns.py
"""
import csv
import re
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
WORKBOOK = ROOT / "data" / "product_catalogue.xlsx"
CSV_OUT = ROOT / "data" / "products.csv"

NEW_COLUMNS = ["variant_group", "pack_qty", "pack_unit", "specs", "data_note"]

# Structured specs for the compatibility checks (FR-09, RB-03), from the size text.
SPECS = {
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


def main():
    wb = openpyxl.load_workbook(WORKBOOK)
    ws = wb["Products"]
    header_row = next(r for r in range(1, ws.max_row + 1) if ws.cell(r, 1).value == "product_nr")
    header = [c.value for c in ws[header_row]]
    while header and header[-1] is None:
        header.pop()
    for name in NEW_COLUMNS:
        if name not in header:
            header.append(name)
            ws.cell(header_row, len(header), name)
            src = ws.cell(header_row, 1)
            ws.cell(header_row, len(header))._style = src._style
    col = {name: i + 1 for i, name in enumerate(header)}

    rows = []
    for r in range(header_row + 1, ws.max_row + 1):
        nr = ws.cell(r, col["product_nr"]).value
        if not nr or not re.fullmatch(r"P\d+", str(nr)):
            continue
        get = lambda k: ws.cell(r, col[k]).value
        qty, unit = pack_info(get("size"), get("category"))
        notes = []
        for key, value in FILL_IF_EMPTY.get(nr, {}).items():
            if get(key) in (None, ""):
                ws.cell(r, col[key], value)
                notes.append(f"{key} added for the app – team to verify (SR-10)")
        ws.cell(r, col["variant_group"], slug(get("product_name")))
        ws.cell(r, col["pack_qty"], qty)
        ws.cell(r, col["pack_unit"], unit)
        ws.cell(r, col["specs"], SPECS.get(nr, ""))
        if notes:
            ws.cell(r, col["data_note"], "; ".join(notes))
        rows.append([ws.cell(r, col[h]).value for h in header])

    wb.save(WORKBOOK)

    def fmt(v):
        if v is None:
            return ""
        if isinstance(v, float) and v.is_integer():
            return str(int(v))
        return str(v)

    with CSV_OUT.open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh, lineterminator="\n")
        w.writerow(header)
        w.writerows([[fmt(v) for v in row] for row in rows])
    print(f"updated {WORKBOOK.relative_to(ROOT)} (Products: {len(rows)} products) and {CSV_OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
