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

  function parseWorkbook(arrayBuffer, XLSX) {
    const wb = XLSX.read(arrayBuffer, { type: "array" });
    const missing = REQUIRED_SHEETS.filter((s) => !wb.SheetNames.includes(s));
    if (missing.length) throw new Error("Workbook misses sheets: " + missing.join(", "));
    let stores = [], stock = new Map();
    try {
      stores = buildStores(sheetRows(XLSX, wb.Sheets.Stores, "store_id"));
      stock = buildStock(sheetRows(XLSX, wb.Sheets[STOCK_SHEET], "product_nr"), stores);
    } catch (_) { stores = []; stock = new Map(); }
    return { catalogue: buildCatalogue(sheetRows(XLSX, wb.Sheets.Products, "product_nr")), stores, stock };
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
    buildCatalogue, buildStores, buildStock, sheetRows, parseWorkbook, parsePlzTable, fetchJson, fetchText, fetchWorkbook, loadAll
  });
})(typeof window !== "undefined" ? window : globalThis);
