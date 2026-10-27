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
    // DR-04: one template per project of data/project_catalogue.xlsx (PRJ-01 … PRJ-09), in catalogue order.
    templates: [
      "data/templates/hang-shelf.json",
      "data/templates/hang-wall-cabinet.json",
      "data/templates/hang-picture.json",
      "data/templates/anchor-shelf-anti-tip.json",
      "data/templates/paint-wall.json",
      "data/templates/install-glass-door.json",
      "data/templates/change-interior-door-lock.json",
      "data/templates/install-sliding-door.json",
      "data/templates/hang-nonwoven-wallpaper.json"
    ],
    // How-to links (project catalogue sheet "How-to links") may only point to these hosts (NFR-07).
    howtoHosts: ["www.youtube.com", "www.obi.de", "www.obi.ch"]
  },

  // FR-29 – confirmed by the team 2026-10-25 (design DD-6).
  store: {
    maxDistanceKm: 50,   // "no store near you" when the nearest store is farther
    maxStoresShown: 5    // number of stores listed after a valid PLZ
  }
});
