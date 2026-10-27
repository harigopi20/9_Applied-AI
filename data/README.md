# Data – Baumarkt-Buddy (MVP sample data)

> **Fictional partnership with OBI for the exam scenario.** Store names, addresses and opening hours are as provided by the team (25 Oct 2026, please verify before the presentation). **Aisle, shelf, stock and prices are SAMPLE DATA, not real OBI data.**

## Files

| File | Content | Requirement |
|---|---|---|
| `product_catalogue.xlsx` | Master workbook for the team (v2, 27 Oct 2026) – sheets: **Read Me**, **Products**, **Store stock**, **Stores**, **Translations** | DR-01 |
| `products.csv` | Export of sheet *Products*: 103 products (P001–P103; P103 = 120 cm shelf board added 27 Oct 2026, sample values), written once for all stores (name EN/DE, size, load, wall types, compatibility, safety note, price) | DR-01 |
| `store_stock.csv` | Export of sheet *Store stock*: aisle, shelf and quantity per product for each store (`<store_id>_aisle_nr`, `_aisle_name`, `_shelf_nr`, `_qty`) | DR-01 |
| `stores.csv` | Export of sheet *Stores*: 5 OBI stores with address, PLZ, opening hours, coordinates | DR-01, FR-29 |
| `project_catalogue.xlsx` | Project catalogue (draft v1, 27 Oct 2026, team review pending) – 9 projects with questions, limits, items, stop rules, how-to links and sources | DR-04 |
| `plz_coordinates.csv` | German PLZ → centre coordinates (8,298 PLZ), used for distance sorting | DR-08 |
| `product_catalogue.csv`, `store_map.csv` | **Obsolete** – replaced by the files above; the app reads `product_catalogue.xlsx` since 25 Oct 2026 | – |

## Stores

| ID | Store | PLZ |
|---|---|---|
| NUE-LEY | OBI Markt Nürnberg-Leyh | 90431 |
| NUE-REG | OBI Markt Nürnberg Regensburger Straße | 90480 |
| NUE-BAY | OBI Markt Nürnberg Äußere Bayreuther Straße | 90411 |
| ERL-OST | OBI Markt Erlangen-Ost | 91052 |
| ERL-WEST | OBI Markt Erlangen West (Neumühle) | 91056 |

## Rules in the data

- **Empty aisle** in *Store stock* = the store does **not carry** the product.
- **qty 0** = the store carries it but it is **out of stock**.
- In both cases the app keeps the item on the list and names the nearest other store with stock, or says "please ask staff" (FR-31).
- ERL-OST uses the original catalogue layout; the other stores have the same aisle names with different aisle numbers and stock (generated sample data).

**Demo cases:** P044 out of stock in ERL-OST · P059 not carried in NUE-REG · P064 out of stock in NUE-BAY.

## Editing

Edit `product_catalogue.xlsx`, then run `python3 tools/add_rule_columns.py`. The
script fills only **empty** rule-engine cells (`variant_group`, `pack_qty`,
`pack_unit`, missing `specs` keys such as `volume_l` for paint) – values the team
wrote are never overwritten – and exports *Products*, *Store stock* and *Stores* to
`products.csv`, `store_stock.csv` and `stores.csv`. The app reads the workbook
directly (columns by header name, so extra columns such as `product_name_de` are
fine; the app shows `product_name_de` in German mode). Store coordinates are the
centre of the store's PLZ (approximate).

**Project catalogue:** `project_catalogue.xlsx` is the team's reviewed source for
the projects. The app does not read it directly (its rules are written as text);
each project is translated into a JSON template in `app/data/templates/`
(`project_id` PRJ-01 … PRJ-09). When the catalogue changes, update the matching
template and its tests.

## Source and licence – `plz_coordinates.csv`

Derived from **plz_geocoord** by Markus Konrad, Wissenschaftszentrum Berlin für Sozialforschung (WZB), January 2019 – <https://github.com/WZBSocialScienceCenter/plz_geocoord> – licensed under the **Apache License 2.0**. Columns renamed to `plz, lat, lon` and coordinates rounded to 5 decimals.
