/*
 * Baumarkt-Buddy – configuration (values the team still decides).
 * Data paths live here so that data files can be replaced without code
 * changes (NFR-10). Safety limits are NOT here: they belong to the
 * project templates (data/templates/*.json, DR-04) and are reviewed there.
 */
window.BB_CONFIG = Object.freeze({
  version: "R1-MVP",

  // NFR-09: English is the default UI language; German via the toggle.
  // Team decision 2026-10-25: English default (NFR-09 text says German default).
  defaultLanguage: "en",

  // AI adapter (ai-adapter.js): "template" (default, no AI, free),
  // "proxy" (commercial model via proxy/ – team decision: built, not active),
  // "mock" (fixed test answers). Override for a demo with ?ai=mock in the URL.
  aiMode: "template",
  ai: {
    proxyUrl: "",        // e.g. "https://baumarkt-buddy-proxy.<account>.workers.dev/understand"
    timeoutMs: 8000,     // per attempt; max. 2 attempts, then template fallback (NFR-03)
    maxTextLength: 500   // longer descriptions are rejected before anything is sent
  },

  data: {
    // DR-01: the team's single data workbook in the repo's data/ folder
    // (serve the repository root locally, see README).
    workbook: "../data/product_catalogue.xlsx",
    safetyRules: "data/safety-rules.json",
    lexicon: "data/understanding-lexicon.json",
    mockResponses: "data/ai-mock-responses.json",
    plzTable: "../data/plz_coordinates.csv", // DR-08: PLZ → centre (WZB plz_geocoord, Apache-2.0)
    // DR-04: one template per project of data/project_catalogue.xlsx, in catalogue order.
    // Only these projects are offered in the app (smaller start list, team decision 3 Nov 2026).
    templates: [
      "data/templates/hang-shelf.json",
      "data/templates/hang-wall-cabinet.json",
      "data/templates/hang-picture.json",
      "data/templates/anchor-shelf-anti-tip.json",
      "data/templates/paint-wall.json",
      "data/templates/hang-nonwoven-wallpaper.json"
    ],
    // Not offered for now ("Doors & locks"): the files stay and are still tested, so a
    // project comes back by moving its line up into "templates".
    inactiveTemplates: [
      "data/templates/install-glass-door.json",
      "data/templates/change-interior-door-lock.json",
      "data/templates/install-sliding-door.json"
    ],
    // How-to links (project catalogue sheet "How-to links") may only point to these hosts (NFR-07).
    howtoHosts: ["www.youtube.com", "www.obi.de", "www.obi.ch"]
  },

  // FR-29 – confirmed by the team 2026-10-25 (design DD-6); D-8 / D-11 (29 Oct 2026):
  // all sample stores are listed, max. 6 (incl. OBI Schwabach).
  store: {
    maxDistanceKm: 50,   // "no store near you" when the nearest store is farther
    maxStoresShown: 6    // number of stores listed after a valid PLZ
  },

  // R-17 (D-13 / D-14): fixing type per wall (sheet "Fixing chain") → product
  // variant group of the plug and which screw column of the chain to use.
  // No load values here – they all come from sheet "System ratings" (DR-09).
  mounting: {
    fixingTypes: {
      plug_universal: { plugVariant: "wall-plug-universal-d13", screw: "std" },
      plug_long:      { plugVariant: "wall-plug-long-d13",      screw: "long" },
      plug_aerated:   { plugVariant: "wall-plug-aerated-d13",   screw: "long" },
      cavity_anchor:  { plugVariant: "cavity-anchor-d13",       screw: "own" },  // anchor brings its own screw
      screw:          { plugVariant: null,                      screw: "std" }   // wood: screw in a pilot hole
    }
  },

  // Preview of the D-13/D-14 logic: http://localhost:8000/app/?preview=d13 (app/preview-d13.js).
  // Without "?preview=d13" none of this is used. Loads come from sheet "System ratings";
  // rail ratings from the rail products (= the values in sheet Cabinet).
  preview: {
    d13: {
      workbook: "../data/product_catalogue_03_11_26.xlsx",
      pictureTemplate: "hang_picture",       // picture keeps its weight question (D-2) – existing flow
      plugsPerBracket: 2,                    // confirmed by the team 3 Nov 2026 (slide: 3 brackets → 6 plugs)
      maxShelfLengthCm: 200,                 // longer → split into equal shelves or cut (D-13)
      maxCabinetWidthCm: 75,                 // usual wall cabinets are max. 60–75 cm wide (team, 4 Nov 2026)
      minSuggestedSizeCm: 10,                // "use this size" buttons for a too heavy cabinet never go below this
      longLevelFromCm: 120,                  // spirit level P371 (120 cm) above this length (FR-37)
      products: { spiritLevel: "P032", spiritLevelLong: "P371", antiTipKit: "P100", detector: "P034", drillHammer: "P040", drill: "P039" },
      // Template roles with fixed products that the new logic replaces (spirit level P032/P371 by length,
      // the exact drill bit instead of a bit set); all other tools and safety gear stay as in the templates.
      skipTemplateRoles: ["spirit_level", "drill_bit_set"],
      variants: { board: "shelf-board-d13", bracket: "shelf-bracket-d13", rail: "cabinet-rail-d13", hangers: "cabinet-hanger-d13", cavityAnchor: "cavity-anchor-d13" }
    }
  }
});
