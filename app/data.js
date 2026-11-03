/*
 * Baumarkt-Buddy – data loading (data layer).
 *
 * DR-01: ONE Excel file (data/product_catalogue.xlsx, maintained by the team)
 * is the only product source. It is read in the browser with SheetJS (lib/xlsx.mini.min.js).
 * DR-04: project templates and safety word lists are JSON files.
 * NFR-10: no product, store or stock data lives in code.
 * NFR-07: everything read here is DATA. Text fields are never interpreted,
 * evaluated or sent to the AI as instructions.
 */
(function (root) {
  "use strict";

  // Stores and "Store stock" are optional: without them the app runs without a store (FR-30, NFR-03).
  const REQUIRED_SHEETS = ["Products"];
  const STOCK_SHEET = "Store stock";
  const REQUIRED_PRODUCT_COLUMNS = [
    "product_nr", "product_name", "variant_group", "category", "size",
    "pack_qty", "price_eur", "max_load_kg", "suitable_wall_types",
    "compatible_with", "use_cases", "requires_professional", "safety_note"
  ];

  function str(v) {
    return v === undefined || v === null ? "" : String(v).trim();
  }

  // Empty cell -> null. Never turn an empty cell into 0 (RB-06, RB-13).
  function numOrNull(v) {
    if (v === undefined || v === null || str(v) === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function list(v) {
    return str(v).split(";").map((s) => s.trim().toLowerCase()).filter(Boolean);
  }

  function idList(v) {
    return str(v).split(";").map((s) => s.trim().toUpperCase()).filter(Boolean);
  }

  // "diameter_mm=8;length_mm=50" -> { diameter_mm: 8, length_mm: 50 }
  function parseSpecs(v) {
    const specs = {};
    str(v).split(";").forEach((pair) => {
      const i = pair.indexOf("=");
      if (i <= 0) return;
      const key = pair.slice(0, i).trim();
      const raw = pair.slice(i + 1).trim();
      const n = Number(raw);
      specs[key] = raw !== "" && Number.isFinite(n) ? n : raw;
    });
    return Object.freeze(specs);
  }

  /*
   * Build the catalogue from Products rows (array of plain objects).
   * Used by the app and by tests.html with fixture rows.
   */
  function buildCatalogue(rows) {
    if (!Array.isArray(rows) || rows.length === 0) throw new Error("Products sheet is empty");
    const cols = Object.keys(rows[0]);
    const missing = REQUIRED_PRODUCT_COLUMNS.filter((c) => !cols.includes(c));
    if (missing.length) throw new Error("Products sheet misses columns: " + missing.join(", "));

    const byId = new Map();
    rows.forEach((r, idx) => {
      const nr = str(r.product_nr).toUpperCase();
      if (!nr) throw new Error("Products row " + (idx + 2) + " has no product_nr");
      if (byId.has(nr)) throw new Error("Duplicate product_nr " + nr);
      const packQty = numOrNull(r.pack_qty);
      const price = numOrNull(r.price_eur);
      const product = Object.freeze({
        product_nr: nr,
        name: str(r.product_name),
        name_de: str(r.product_name_de), // v2: German name (display only; empty → English name)
        variant_group: str(r.variant_group).toLowerCase(),
        category: str(r.category),
        size: str(r.size),
        // RB-13: pack size must be a positive whole number, otherwise "unclear".
        pack_qty: packQty !== null && Number.isInteger(packQty) && packQty > 0 ? packQty : null,
        pack_unit: str(r.pack_unit) || "item",
        specs: parseSpecs(r.specs),
        description: str(r.description),
        material: str(r.material),
        colour: str(r.colour),
        price_eur: price !== null && price >= 0 ? price : null,
        max_load_kg: numOrNull(r.max_load_kg),
        suitable_wall_types: Object.freeze(list(r.suitable_wall_types)),
        compatible_with: Object.freeze(idList(r.compatible_with)),
        use_cases: Object.freeze(list(r.use_cases)),
        requires_professional: str(r.requires_professional).toLowerCase() === "yes",
        // SR-07: safety_note is kept exactly as delivered (only trimmed).
        safety_note: str(r.safety_note),
        data_status: str(r.data_status) || "sample"
      });
      byId.set(nr, product);
    });
    return Object.freeze({
      byId,
      all: Object.freeze(Array.from(byId.values())),
      get(nr) { return byId.get(str(nr).toUpperCase()) || null; }
    });
  }

  function buildStores(rows) {
    return Object.freeze((rows || []).map((r) => Object.freeze({
      store_id: str(r.store_id),
      name: str(r.store_name),
      street: str(r.street),
      plz: str(r.plz),
      city: str(r.city),
      opening_hours: str(r.opening_hours),
      lat: numOrNull(r.lat),
      lon: numOrNull(r.lon),
      data_status: str(r.data_status) || "sample"
    })).filter((s) => /^[A-Z0-9-]{1,20}$/.test(s.store_id) && s.name)); // skips note rows below the table
  }

  /**
   * DR-01 "Store stock" sheet, one row per product with columns per store:
   * <store_id>_aisle_nr, _aisle_name, _shelf_nr, _qty.
   * Empty aisle = the store does NOT CARRY the product; qty 0 = OUT OF STOCK.
   * Rows that are not products (e.g. a legend) are skipped.
   */
  function buildStock(rows, stores) {
    const index = new Map();
    (rows || []).forEach((r) => {
      const nr = str(r.product_nr).toUpperCase();
      if (!/^P\d+$/.test(nr)) return;
      (stores || []).forEach((s) => {
        const id = s.store_id;
        const aisle = numOrNull(r[id + "_aisle_nr"]);
        index.set(id + "|" + nr, Object.freeze({
          carried: aisle !== null,
          stock_qty: aisle === null ? null : numOrNull(r[id + "_qty"]),
          aisle_nr: aisle,
          aisle_name: aisle === null ? "" : str(r[id + "_aisle_name"]),
          shelf_nr: aisle === null ? null : numOrNull(r[id + "_shelf_nr"])
        }));
      });
    });
    return index;
  }

  /** Rows of a sheet whose header row starts with `key` (title rows above are skipped). */
  function sheetRows(XLSX, sheet, key) {
    if (!sheet) return [];
    const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true });
    const h = grid.findIndex((row) => row && str(row[0]) === key);
    if (h < 0) return [];
    const header = grid[h].map(str);
    return grid.slice(h + 1)
      .filter((row) => row && str(row[0]) !== "")
      .map((row) => {
        const o = {};
        header.forEach((name, i) => { if (name) o[name] = row[i] === undefined ? null : row[i]; });
        return o;
      });
  }

  // ---------------------------------------------------------------------
  // D-13 / D-14 mounting data (DR-09): sheets "System ratings" and "Fixing chain".
  // EVERY load value comes from these sheets – none is written in code.
  // ---------------------------------------------------------------------
  const RATINGS_SHEET = "System ratings";
  const CHAIN_SHEET = "Fixing chain";

  /** Number from a mounting cell. "n/a", "–", "-" or empty → null (= not offered); never 0 (RB-06). */
  function rating(v) {
    const s = str(v);
    if (s === "" || /^(n\/a|–|-)$/i.test(s)) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  /** Raw grid of a sheet (array of rows). */
  function sheetGrid(XLSX, sheet) {
    return sheet ? XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true }) : [];
  }

  /**
   * Rows of the table whose header row starts with the cells `head`
   * (case-insensitive). The table ends at the first row whose first cell
   * does not match `rowKey` (a title row or a single value below it).
   */
  function gridTable(grid, head, rowKey, where) {
    const h = grid.findIndex((row) => row && head.every((c, i) => str(row[i]).toLowerCase() === c));
    if (h < 0) throw new Error(where + ": table '" + head.join(", ") + "' not found");
    const header = grid[h].map(str);
    const rows = [];
    for (let i = h + 1; i < grid.length; i++) {
      const row = grid[i];
      if (!row || !rowKey.test(str(row[0]))) break;
      rows.push({ header, cells: row });
    }
    if (!rows.length) throw new Error(where + ": table '" + head.join(", ") + "' is empty");
    return rows;
  }

  /** A single value: the row whose first cell is `label`, value in the second cell. */
  function gridValue(grid, label, where) {
    const row = grid.find((r) => r && str(r[0]).toLowerCase() === label.toLowerCase());
    const v = row ? rating(row[1]) : null;
    if (v === null || v <= 0) throw new Error(where + ": value '" + label + "' missing or not a positive number");
    return v;
  }

  function need(v, what) {
    if (v === null) throw new Error(what + " missing or not a number");
    return v;
  }

  /**
   * Builds the mounting data from the raw grids of the two sheets.
   * Throws a clear error if a table or value is missing (NFR-03) –
   * the app then offers no shelf / cabinet / anti-tip options.
   */
  function buildMounting(ratingsGrid, chainGrid) {
    const W = RATINGS_SHEET, C = CHAIN_SHEET;
    const WALL = /^[a-z_]+$/;

    // System rating per wall and plug size, wall cap, max. shelf depth
    const walls = {};
    let plugSizes = null;
    gridTable(ratingsGrid, ["wall", "6 mm"], WALL, W).forEach(({ header, cells }) => {
      const sizes = header.map((h, i) => ({ mm: (/^(\d+) mm$/.exec(h) || [])[1], i })).filter((x) => x.mm);
      plugSizes = sizes.map((x) => Number(x.mm));
      const system = {};
      sizes.forEach((x) => { system[x.mm] = rating(cells[x.i]); });
      const col = (name) => header.findIndex((h) => h.toLowerCase() === name);
      const wall = str(cells[0]);
      walls[wall] = {
        wall,
        system,
        wallCapKg: need(rating(cells[col("wall cap kg")]), W + ": wall cap of " + wall),
        shelfMaxDepthCm: need(rating(cells[col("max. depth cm")]), W + ": max. depth of " + wall),
        capSource: str(cells[col("cap source")])
      };
    });

    // Plug type and drill mode per wall (sheet Fixing chain)
    gridTable(chainGrid, ["wall", "fixing type"], WALL, C).forEach(({ cells }) => {
      const wall = str(cells[0]);
      if (!walls[wall]) throw new Error(C + ": wall '" + wall + "' has no row in " + W);
      const typeText = str(cells[1]);
      walls[wall].fixingTypeText = typeText;
      walls[wall].fixingType = (/^[a-z_]+/.exec(typeText) || [""])[0];
      walls[wall].hammer = str(cells[2]).toLowerCase() === "on";
    });

    // Wall cabinet cap and max. depth per wall (D-14)
    gridTable(ratingsGrid, ["wall", "cabinet cap kg"], WALL, W).forEach(({ cells }) => {
      const wall = str(cells[0]);
      if (!walls[wall]) throw new Error(W + ": cabinet row for unknown wall '" + wall + "'");
      walls[wall].cabinetCapKg = need(rating(cells[1]), W + ": cabinet cap of " + wall);
      walls[wall].cabinetMaxDepthCm = need(rating(cells[2]), W + ": cabinet max. depth of " + wall);
    });
    Object.values(walls).forEach((w) => {
      if (!w.fixingType) throw new Error(C + ": no fixing type for wall '" + w.wall + "'");
    });

    const brackets = gridTable(ratingsGrid, ["class", "hole ø mm"], /^B[\d.]+$/, W).map(({ cells }) => ({
      cls: str(cells[0]),
      holeMm: need(rating(cells[1]), W + ": hole of " + str(cells[0])),
      pairKg: need(rating(cells[2]), W + ": pair kg of " + str(cells[0])),
      maxArmMm: need(rating(cells[3]), W + ": max. arm of " + str(cells[0]))
    })).sort((a, b) => a.holeMm - b.holeMm);

    const boards = gridTable(ratingsGrid, ["thickness mm", "board kg"], /^\d+$/, W).map(({ cells }) => ({
      thicknessMm: Number(cells[0]),
      kg: need(rating(cells[1]), W + ": board kg"),
      maxDepthCm: need(rating(cells[2]), W + ": board max. depth")
    }));

    const antiTip = gridTable(ratingsGrid, ["depth up to cm", "plug mm"], /^\d+$/, W).map(({ cells }) => ({
      maxDepthCm: Number(cells[0]),
      plugMm: need(rating(cells[1]), W + ": anti-tip plug"),
      cavityAnchor: str(cells[2])
    }));

    // Fixing chain: plug size (= drill bit) → screw Ø → bracket class, products
    const chain = {};
    gridTable(chainGrid, ["plug size mm (= drill bit)", "screw ø mm"], /^\d+$/, C).forEach(({ cells }) => {
      const id = (v) => (/^P\d+$/.test(str(v)) ? str(v) : null);
      const mm = Number(cells[0]);
      chain[mm] = {
        plugMm: mm,
        screwMm: need(rating(cells[1]), C + ": screw Ø for " + mm + " mm"),
        bracketClass: (/^B[\d.]+/.exec(str(cells[2])) || [null])[0],
        maxArmMm: rating(cells[3]),
        screwStd: id(cells[4]),
        screwLong: id(cells[5]),
        masonryBit: id(cells[6]),
        woodBit: id(cells[7]),
        use: str(cells[8])
      };
    });

    const deepFreeze = (o) => { Object.values(o).forEach((v) => { if (v && typeof v === "object") deepFreeze(v); }); return Object.freeze(o); };
    return deepFreeze({
      plugSizes,
      walls,
      brackets,
      boards,
      chain,
      safetyFactor: gridValue(ratingsGrid, "Safety factor", W),
      referenceDepthCm: gridValue(ratingsGrid, "Reference depth cm", W),
      bracketSpacingCm: gridValue(ratingsGrid, "Bracket spacing cm", W),
      cabinet: {
        panelKgPerM2: gridValue(ratingsGrid, "Panel weight kg/m²", W),
        minPlugFactor: gridValue(ratingsGrid, "Min. plug factor", W),
        anchorBoltSystemKg: gridValue(ratingsGrid, "Anchor bolt M10 system kg (concrete)", W),
        anchorBoltCapKg: gridValue(ratingsGrid, "Cap with anchor bolts kg", W)
      },
      antiTip: {
        rows: antiTip,
        widthPerKitCm: gridValue(ratingsGrid, "Width per kit cm", W),
        tallFromCm: gridValue(ratingsGrid, "Tall from cm", W)
      }
    });
  }

  function parseWorkbook(arrayBuffer, XLSX) {
    const wb = XLSX.read(arrayBuffer, { type: "array" });
    const missing = REQUIRED_SHEETS.filter((s) => !wb.SheetNames.includes(s));
    if (missing.length) throw new Error("Workbook misses sheets: " + missing.join(", "));
    let stores = [], stock = new Map();
    try {
      stores = buildStores(sheetRows(XLSX, wb.Sheets.Stores, "store_id"));
      stock = buildStock(sheetRows(XLSX, wb.Sheets[STOCK_SHEET], "product_nr"), stores);
    } catch (_) { stores = []; stock = new Map(); }
    // Mounting data is required only for shelf / cabinet / anti-tip options:
    // on an error the rest of the app still works and the error is kept.
    let mounting = null, mountingError = null;
    try {
      if (!wb.Sheets[RATINGS_SHEET]) throw new Error("Workbook misses sheet: " + RATINGS_SHEET);
      if (!wb.Sheets[CHAIN_SHEET]) throw new Error("Workbook misses sheet: " + CHAIN_SHEET);
      mounting = buildMounting(sheetGrid(XLSX, wb.Sheets[RATINGS_SHEET]), sheetGrid(XLSX, wb.Sheets[CHAIN_SHEET]));
    } catch (e) { mounting = null; mountingError = e.message; }
    return { catalogue: buildCatalogue(sheetRows(XLSX, wb.Sheets.Products, "product_nr")), stores, stock, mounting, mountingError };
  }

  /**
   * DR-08: PLZ reference table "plz,lat,lon" → Map. Only exact 5-digit
   * postcodes with valid coordinates are accepted.
   */
  function parsePlzTable(csvText) {
    const map = new Map();
    String(csvText).split(/\r?\n/).slice(1).forEach((line) => {
      const [plz, lat, lon] = line.split(",");
      const la = Number(lat), lo = Number(lon);
      if (/^\d{5}$/.test(plz) && Number.isFinite(la) && Number.isFinite(lo)) map.set(plz, Object.freeze({ lat: la, lon: lo }));
    });
    return map;
  }

  async function fetchText(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(url + ": HTTP " + res.status);
    return res.text();
  }

  async function fetchJson(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(url + ": HTTP " + res.status);
    return res.json();
  }

  async function fetchWorkbook(url, XLSX) {
    if (!XLSX) throw new Error("SheetJS (XLSX) not loaded");
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(url + ": HTTP " + res.status);
    return parseWorkbook(await res.arrayBuffer(), XLSX);
  }

  /*
   * Loads everything. The catalogue, templates and safety rules are required:
   * without them no list can be checked (NFR-03 "do not proceed when a
   * required validation service fails"). Store data is optional for the
   * flow (FR-30); it is part of the same workbook here.
   */
  async function loadAll(config) {
    const XLSX = root.XLSX;
    const [workbook, safetyRules, templates, lexicon, mockResponses] = await Promise.all([
      fetchWorkbook(config.data.workbook, XLSX),
      fetchJson(config.data.safetyRules),
      Promise.all(config.data.templates.map(fetchJson)),
      fetchJson(config.data.lexicon),
      fetchJson(config.data.mockResponses)
    ]);
    // FR-29/NFR-03: the PLZ table is optional – if it fails, the app runs without store search.
    let plzTable = null;
    try { plzTable = parsePlzTable(await fetchText(config.data.plzTable)); } catch (_) { plzTable = null; }
    return Object.assign({}, workbook, { safetyRules, templates, lexicon, mockResponses, plzTable });
  }

  root.BBData = Object.freeze({
    buildCatalogue, buildStores, buildStock, sheetRows, sheetGrid, buildMounting, parseWorkbook, parsePlzTable, fetchJson, fetchText, fetchWorkbook, loadAll
  });
})(typeof window !== "undefined" ? window : globalThis);
