/*
 * Baumarkt-Buddy – data loading (data layer).
 *
 * DR-01..DR-03: ONE Excel file (data/baumarkt-buddy-data.xlsx) is the only
 * product source. It is read in the browser with SheetJS (lib/xlsx.mini.min.js).
 * DR-04: project templates and safety word lists are JSON files.
 * NFR-10: no product, store or stock data lives in code.
 * NFR-07: everything read here is DATA. Text fields are never interpreted,
 * evaluated or sent to the AI as instructions.
 */
(function (root) {
  "use strict";

  const REQUIRED_SHEETS = ["Products", "Stores", "Stock"];
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
      plz: str(r.plz),
      city: str(r.city),
      lat: numOrNull(r.lat),
      lon: numOrNull(r.lon),
      data_status: str(r.data_status) || "sample"
    })).filter((s) => s.store_id));
  }

  // DR-02/DR-03: stock and aisle/shelf keyed by store_id + product_nr.
  function buildStock(rows) {
    const index = new Map();
    (rows || []).forEach((r) => {
      const key = str(r.store_id) + "|" + str(r.product_nr).toUpperCase();
      index.set(key, Object.freeze({
        stock_qty: numOrNull(r.stock_qty),
        aisle_nr: numOrNull(r.aisle_nr),
        aisle_name: str(r.aisle_name),
        shelf_nr: numOrNull(r.shelf_nr)
      }));
    });
    return index;
  }

  function parseWorkbook(arrayBuffer, XLSX) {
    const wb = XLSX.read(arrayBuffer, { type: "array" });
    const missing = REQUIRED_SHEETS.filter((s) => !wb.SheetNames.includes(s));
    if (missing.length) throw new Error("Workbook misses sheets: " + missing.join(", "));
    const rows = (name) => XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: null, raw: true });
    return {
      catalogue: buildCatalogue(rows("Products")),
      stores: buildStores(rows("Stores")),
      stock: buildStock(rows("Stock"))
    };
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
    return Object.assign({}, workbook, { safetyRules, templates, lexicon, mockResponses });
  }

  root.BBData = Object.freeze({
    buildCatalogue, buildStores, buildStock, parseWorkbook, fetchJson, fetchWorkbook, loadAll
  });
})(typeof window !== "undefined" ? window : globalThis);
