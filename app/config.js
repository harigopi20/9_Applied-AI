/*
 * Baumarkt-Buddy – configuration (values the team still decides).
 * Data paths live here so that data files can be replaced without code
 * changes (NFR-10). Safety limits are NOT here: they belong to the
 * project templates (data/templates/*.json, DR-04) and are reviewed there.
 */
window.BB_CONFIG = Object.freeze({
  version: "R1-MVP stage 1",

  // NFR-09: English is the default UI language; German via the toggle.
  defaultLanguage: "en",

  // AI adapter mode (stage 2): "template" (default, no AI), "proxy", "mock".
  aiMode: "template",

  data: {
    workbook: "data/baumarkt-buddy-data.xlsx", // DR-01..DR-03 single data file
    safetyRules: "data/safety-rules.json",
    templates: [
      "data/templates/hang-shelf.json",
      "data/templates/hang-picture.json"
    ]
  },

  // FR-29 (stage 4) – TBD by the team (design DD-6). Placeholder values.
  store: {
    maxDistanceKm: 50,   // "no store near you" when the nearest store is farther
    maxStoresShown: 5    // number of stores listed after a valid PLZ
  }
});
