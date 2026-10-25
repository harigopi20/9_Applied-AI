#!/usr/bin/env python3
"""Build the PLZ reference table app/data/plz-de.csv (DR-08) from OpenGeoDB.

Source: OpenGeoDB release 0.2.5a (dump "opengeodb-02513_2007-10-02.sql"),
https://sourceforge.net/projects/opengeodb/files/Data/0.2.5a/ – licence:
public domain (as stated on the OpenGeoDB SourceForge project page).

Method (documented in README): for every German 5-digit postcode, take the
WGS84 coordinates of all OpenGeoDB locations that carry this postcode and
use their average as the postcode's centre point. No coordinate is
invented: postcodes without OpenGeoDB coordinates are left out.

Usage:
  python3 -I tools/build_plz_table.py /path/to/opengeodb-0.2.5a-UTF8-sql.gz
"""
import csv
import gzip
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "app" / "data" / "plz-de.csv"

TEXT_RE = re.compile(r"^INSERT INTO geodb_textdata VALUES\((\d+),(\d+),'((?:[^'\\]|\\.|'')*)'")
COORD_RE = re.compile(r"^INSERT INTO geodb_coordinates VALUES\((\d+),200100000,([-\d.]+),([-\d.]+),.*'3000-01-01'")

T_NAME, T_PLZ, T_PART_OF = 500100000, 500300000, 400100000


def main(src):
    names, plz_of, parent, coords = {}, defaultdict(set), {}, {}
    with gzip.open(src, "rt", encoding="utf-8", errors="replace") as fh:
        for line in fh:
            m = TEXT_RE.match(line)
            if m:
                loc, typ, val = int(m.group(1)), int(m.group(2)), m.group(3)
                if "'3000-01-01'" not in line:
                    continue  # only currently valid entries
                if typ == T_NAME:
                    names.setdefault(loc, val)
                elif typ == T_PLZ:
                    plz_of[loc].add(val)
                elif typ == T_PART_OF and val.isdigit():
                    parent[loc] = int(val)
                continue
            m = COORD_RE.match(line)
            if m:
                coords[int(m.group(1))] = (float(m.group(3)), float(m.group(2)))  # lat, lon

    germany = [loc for loc, n in names.items() if n == "Bundesrepublik Deutschland"]
    if not germany:
        sys.exit("Germany not found in dump")
    root_ids = set(germany)

    def in_germany(loc):
        seen = 0
        while loc is not None and seen < 20:
            if loc in root_ids:
                return True
            loc = parent.get(loc)
            seen += 1
        return False

    points = defaultdict(list)
    for loc, codes in plz_of.items():
        if loc not in coords or not in_germany(loc):
            continue
        for code in codes:
            if re.fullmatch(r"\d{5}", code):
                points[code].append(coords[loc])

    rows = []
    for code in sorted(points):
        lats = [p[0] for p in points[code]]
        lons = [p[1] for p in points[code]]
        rows.append((code, round(sum(lats) / len(lats), 5), round(sum(lons) / len(lons), 5)))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["plz", "lat", "lon"])
        w.writerows(rows)
    print(f"Germany loc_id(s): {sorted(root_ids)}; written {OUT.relative_to(ROOT)}: {len(rows)} postcodes")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
