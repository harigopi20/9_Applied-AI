# Changelog – Baumarkt-Buddy

All notable changes to this project are documented here.
Entries are collected under "Unreleased" and grouped into a milestone
when they are released to `main`.

## Unreleased

- **2026-10-27 – New 120 cm shelf board P103 in the product catalogue.**
  `data/product_catalogue.xlsx` gets P103 *Shelf board 1200 x 250 x 18 mm* (rated
  25 kg, 19.99 €, compatible with brackets P059/P060, stock in all 5 stores – price,
  rating and stock are sample values, team to verify); CSVs re-exported. Shelves of
  81–120 cm with 25 cm depth now get a list with 3 brackets (project catalogue PRJ-01:
  3 brackets up to 120 cm). 20 cm deep shelves above 80 cm still stop with the size
  message. New test PRJ-01 / P103 (93 passing).
  *Why:* 100–120 cm shelves were impossible with the 80 cm boards only.
  *Prompt:* "Add a 120 cm shelf board with a load rating."

- **2026-10-27 – Stop screen names a size problem instead of blaming the load.**
  A 100 cm shelf with 10 kg was stopped with "no product combination rated for this
  load and wall", although the only reason was the board length (catalogue boards are
  80 cm). If a part fails only on its size checks, the stop now says which part and
  lists the catalogue sizes (EN + DE); real load problems keep the old text. New test
  R-07 (size), 92 passing.
  *Why:* the message was misleading for customers.
  *Prompt:* "A shelf with 10 kg and 20 cm deep is over the limit? That makes no sense."

## Milestone: Product catalogue v2 and project catalogue – 9 projects – 2026-10-27
Summary (same as the pull request):
- Product catalogue v2 (102 products, German names) and project catalogue (draft v1) added to `data/`
- `tools/add_rule_columns.py` only fills empty cells (keeps team values) and exports all three CSVs
- 7 new project templates (wall cabinet, anti-tip, paint, glass door, door lock, sliding door, wallpaper); shelf and picture aligned with the catalogue
- Rule engine: stop rules ST-01…ST-14 and warnings from the templates, conditions, new quantity rules, plasterboard cabinet table, projects without load questions, "I already have this" (C-8, SR-15)
- UI: grouped project buttons with safety level, checklist questions, catalogue stop texts, OBI how-to links, German product names
- Lexicon, AI schema and proxy know the new projects and wall types; 91 tests passing

- **2026-10-27 – Product catalogue v2 and project catalogue added to the repository.**
  `data/product_catalogue.xlsx` replaced by the team's v2 (102 products P001–P102,
  German names `product_name_de`/`category_de`, stock for the new products in all
  5 stores, sheets *Read Me* and *Translations*). New `data/project_catalogue.xlsx`
  (draft v1, 9 projects, team review pending). `tools/add_rule_columns.py` now only
  fills **empty** rule-engine cells (it used to overwrite `specs`/`pack_qty`, which
  would have destroyed v2 values such as `coverage_m2_per_l` and the 2-pc hinge
  set), adds `volume_l` to the wall paints, and exports all three CSVs
  (`products.csv`, `store_stock.csv`, `stores.csv`). The app shows the German product
  name in German mode. Tests: fixture product number moved from P097 (now a real
  product) to P997; DR-01 count raised to ≥ 100; new test for German names (70 passing).
  *Why:* the team delivered updated catalogues that belong in git (DR-01, DR-04).
  *Prompt:* "I have an updated project and product catalogue – push them and update the app."

- **2026-10-27 – App updated to the project catalogue: 9 projects (PRJ-01…PRJ-09).**
  New templates in `app/data/templates/`: wall cabinet (incl. the plasterboard limit
  table), anti-tip kit, paint a wall (litres from coverage, mould checks), glass door
  (hinge rating from the door weight), interior door lock (type and size must match),
  sliding door (rail ≥ 2 × leaf, moving load only on concrete/solid brick) and nonwoven
  wallpaper (roll calculation). Shelf and picture aligned: wall types *solid brick*,
  *brick (type unknown)* (max. 25 kg for shelves) and *aerated concrete* (stop ST-02),
  shelf length > 120 cm stops (ST-04), used-item defect checklist. Rule engine: stop
  rules and warnings from the templates (fail safe if a value is missing), conditions,
  new quantity expressions (add/sub/div/floor/ceil/min/table/"unclear"), projects
  without load or wall questions, "I already have this" for allowed parts (C-8, never
  plugs/screws, refused for defective load-bearing parts – ST-06, SR-15). UI: grouped
  project buttons with icons and safety level, checklist questions, catalogue stop
  texts with hand-off, OBI how-to links (https + allow-listed hosts only, English
  subtitles requested in EN mode). Keyword lexicon, AI schema and proxy prompt know the
  new projects and wall types. 91 tests passing (21 new).
  *Why:* the team's project catalogue defines the 9 Release-1 projects (DR-04).
  *Prompt:* "push them and update the app."

## Milestone: Design update 2 and store availability (FR-31) – 2026-10-25
Summary (same as the pull request):
- Layout and fonts reworked after screenshots of a DIY-store app: orange header band with diagonal edge, condensed headlines, black pill buttons, outlined tiles, flat product rows, black price box, bottom tab bar
- Self-hosted Barlow / Barlow Condensed fonts (OFL)
- Own neutral toolbox mark instead of the "B"; no logo or mascot of a real company
- FR-31: unavailable items stay on the list, marked, with referral to the nearest store with stock or "please ask staff"; no substitutes
- App switched to the team workbook `data/product_catalogue.xlsx` (5 stores) and `data/plz_coordinates.csv`; rule-engine columns added
- TC-38 without store preselection (team decision); FR-29, D-11 and TC-38 in the team documents aligned; 69 tests passing

- **2026-10-25 – FR-31: availability in the chosen store and referral; app switched to the team workbook.**
  The app now reads the team's `data/product_catalogue.xlsx` (5 stores, sheet
  "Store stock") and `data/plz_coordinates.csv` (WZB, Apache-2.0) as required by
  DR-01/DR-08; header rows, legend and note rows are handled. The rule-engine
  columns (`variant_group`, `pack_qty`, `pack_unit`, `specs`, `data_note`) were
  added to the *Products* sheet by the new `tools/add_rule_columns.py` (other cells
  unchanged; P051 wall types filled, flagged). Removed the superseded
  `app/data/baumarkt-buddy-data.xlsx`, `app/data/plz-de.csv` and their build
  scripts. New `availability()` in `rules.js`: an out-of-stock or not-carried item
  stays on the list, marked, with the nearest other store with qty > 0 (from the
  PLZ centre, ≤ 50 km) or "please ask staff"; never a substitute. Store list shows
  address, opening hours and a fictional-partnership/sample-data note. TC-38 is
  implemented **without preselection** (RB-16). Tests updated to the 5 stores and
  extended by TC-34…TC-38, RB-21 (69 passing). README and data/README updated;
  local testing now serves the repository root.
  *Why:* team requirement FR-31 (round 5) and DR-01 data merge.
  *Prompt:* "Yes, implement FR-31, TC-38 without preselection."

- **2026-10-25 – Team documents aligned with "no store preselection":** FR-29 text
  and simple-language column (`requirements/requirements-R1-MVP.md`, plus a round-6
  team comment), design element D-11 (`data/03-design.md`) and TC-38
  (`test/01_test_cases.md`) now say: stores listed nearest first, the customer taps
  one, nothing is preselected (SR-06, RB-16).
  *Why:* the documents still described an automatic preselection that the team
  decided against.
  *Prompt:* "Yes, update the team documents."
- **2026-10-25 – Design update 2: DIY-store app layout and fonts.**
  `app/style.css` rewritten: white page; orange #FF7313 header band with diagonal
  edge, title in a white box, round language button and toolbox mark; Barlow
  Condensed headlines and buttons, Barlow body text (self-hosted, OFL); black
  pill primary buttons and outlined secondary buttons; text field in a pill
  search-field look with a black round microphone button; project buttons as
  outlined tiles with line icons; flat product rows with big prices and small
  cents, availability dot (green = in stock); total in a black price box; bottom
  tab bar Start · Store · List (new `renderNav` in `app.js`). Contrast kept
  (black on orange, darker orange for text). The requested OBI beaver image was
  not used: it is a trademark and mascot of a real company.
  *Why:* the team wants the look of a familiar DIY-store app.
  *Prompt:* "These are screenshots of the OBI app, please adapt fonts / layout /
  design accordingly" and "put the beaver / the photo instead of the B".

## Milestone: Design update – brand orange #FF7313 – 2026-10-25
Summary (same as the pull request):
- Brand orange changed to #FF7313 and app look modernised in a clean DIY-store app style
- Accessible colour use: dark text on orange buttons, darker orange for text
- Compact phone header with the sample-data badge under the title

- **2026-10-25 – Design: brand orange #FF7313, DIY-store app look.**
  New colour tokens in `app/style.css` (brand #FF7313, pressed #E85F00, soft
  #FFF1E6, orange text #B84A00); white header with orange bottom line and
  brand mark; pill-shaped buttons; white cards with soft shadows on a light
  grey page; round icon tiles for the project buttons; orange section markers.
  Dark text on orange (6.4:1) because white on #FF7313 only reaches 2.7:1
  (WCAG needs 4.5:1). Sample-data badge moved under the title so the phone
  header fits from 320 px. Only general style cues of DIY-store apps – no logo,
  name or other brand assets of a real company.
  *Why:* the team wants the app to look like a familiar DIY-store app.
  *Prompt:* "Design changes: please change the orange to hex #FF7313 and take
  the OBI app design as orientation."

## Milestone: Release 1 (MVP) – Baumarkt-Buddy web app – 2026-10-25
Summary (same as the pull request):
- Static web app in `app/` (HTML/CSS/vanilla JS, no build step) for GitHub Pages
- Single Excel data file with products, 3 sample stores and per-store stock/aisles; PLZ table from OpenGeoDB
- Deterministic rule engine with 2 project templates (hang a shelf, hang a picture) and all R1 safety rules
- Free-text entry with exchangeable AI adapter (template default, mock, optional proxy) and template fallback
- Voice input (German/English) with consent, editable transcript and confirmation by tap
- Optional PLZ store selection that never selects a store automatically; full list without a store
- English/German UI, transparency notices, evidence log
- 62 automated tests in `tests.html`, including all 14 release-blocking tests of R1

- **2026-10-25 – R1 stage 1: data model, rule engine, templates, safety rules, tests.**
  Added the static app in `app/` (index.html, style.css, app.js, rules.js,
  data.js, i18n.js, config.js, tests.html), the single sample data file
  `app/data/baumarkt-buddy-data.xlsx` (Products, Stores, Stock; 3 sample stores)
  built by `tools/build_sample_data.py`, the templates "Hang a shelf" and
  "Hang a picture" with rule IDs and review status, safety word lists, vendored
  SheetJS, and 32 automated tests (RB-01, -03, -04, -06, -07, -08, -09, -13,
  -15, -17, SR-11 and more). README documents architecture, data schema and testing.
  *Why:* first stage of Release 1 – deterministic, safety-first core before AI,
  voice and PLZ are added.
  *Prompt:* "Build Release 1 (MVP) of Baumarkt-Buddy in stages; stage 1 = data
  model, Excel loading, rule engine, 2 templates, safety rules and tests (buttons only)."
- **2026-10-25 – Documented language decision:** English stays the default UI
  language, German via the toggle (config.js comment, README).
  *Why:* NFR-09 in the requirements says "German default"; the team confirmed
  English, so the deviation is recorded.
  *Prompt:* "English is still fine."
- **2026-10-25 – R1 stage 2: free text, AI adapter, follow-up questions, fallback.**
  Added `app/ai-adapter.js` with the modes `template` (default, keyword matching,
  no AI), `mock` (fixed test answers) and `proxy`; strict schema validation of
  every answer; G0 high-risk check before the AI; "Did we understand you?" screen
  and pre-filled guesses that must be confirmed; fallback to the templates that
  keeps the text and recognised values; redaction of PLZ/phone/e-mail. Added the
  optional Cloudflare Worker in `proxy/` (API key as secret, CORS allowlist,
  rate limit, logs off, structured JSON output). 10 new tests (42 passing).
  *Why:* stage 2 of Release 1. Team decision: no paid AI for R1 – default mode is
  `template`; the proxy is built but not active (option a).
  *Prompt:* "We thought we'd use option 1: dictation only (free) … a) please, then
  continue with stage 2."
- **2026-10-25 – CODEOWNERS covers `proxy/` and `tools/`:** changes to the AI
  proxy and the data build script need approval by @st854d2gpb-create.
  *Why:* the proxy handles the API key setup and rate limits; it is app code.
  *Prompt:* "Yes, add CODEOWNERS and continue with stage 3."
- **2026-10-25 – R1 stage 3: voice input (German and English).**
  Added `app/speech.js` (browser Web Speech API, `de-DE`/`en-US`, interim
  results) and the microphone button next to the text field: in-app consent
  naming the browser speech service, recording indicator, stop by tap or Esc,
  live editable transcript that is only processed after tapping "Continue",
  spoken values as guesses with read-back, hints for unsupported browsers and
  denied/failed microphones. Privacy notice on the start screen names the
  speech services. 10 new tests with a simulated speech API (52 passing),
  including RB-18, RB-19 and RB-20; manual real-speech checklist in README.
  *Why:* stage 3 of Release 1 (FR-25, FR-27, SR-11, NFR-04).
  *Prompt:* "Yes, add CODEOWNERS and continue with stage 3."
- **2026-10-25 – R1 stage 4: PLZ and store selection, path without a store.**
  Added the PLZ reference table `app/data/plz-de.csv` (8,216 postcodes, OpenGeoDB
  0.2.5a, public domain) built by `tools/build_plz_table.py`; store coordinates
  in the Excel file now come from this table. New optional store screen: PLZ
  checked in code (5 digits + in table), stores within 50 km sorted by distance
  (max. 5), otherwise message + full list; a store is only ever selected by tap.
  Shopping list shows the chosen store with "Change store", or "Add postcode"
  without one. PLZ stays on the device. Missing PLZ table or store sheets → app
  continues without a store. 8 new tests (60 passing, none pending).
  *Why:* stage 4 of Release 1 (FR-29, FR-30, DR-08, RB-16). Team confirmed
  50 km / 5 stores and OpenGeoDB as PLZ source.
  *Prompt:* "Fine as is, use OpenGeoDB and continue with stage 4."
- **2026-10-25 – R1 stage 5: polish, transparency, README, GitHub Pages entry.**
  Responsive audit at 320/390/768/1280 px (header wraps on very small phones,
  two-column list on laptops, no overflow, all touch targets ≥ 44 px); "How this
  list was made" note with the template's review status; root `index.html`
  forwarding to `app/` and `.nojekyll` for GitHub Pages; README rewritten
  (description, architecture, usage, AI modes, voice support, store selection,
  local testing, Pages, proxy, data sources incl. PLZ licence, full table
  requirement → implementation → test). 2 new tests (62 passing).
  *Why:* stage 5 of Release 1 (NFR-01, NFR-05, NFR-09, delivery).
  *Prompt:* "Yes, continue with stage 5."

## Milestone: App code ownership – 2026-10-25
- **2026-10-25 – Added .github/CODEOWNERS:** @st854d2gpb-create owns the
  app code (`app/`, `APP`), deployment and repo config (`.github/`) and
  `CLAUDE.md`.
  *Why:* only the project lead should approve changes to the app; the team
  can keep reviewing requirements, data, docs and pitch among themselves.
  *Prompt:* "Only I want to approve app changes."

## Milestone: Working rules and change log – 2026-10-25
- **2026-10-25 – Completed CLAUDE.md:** added Git, pull request and change
  documentation rules (previously only the merge section was present).
  *Why:* so every vibe-coding change is committed, described and traceable.
  *Prompt:* "Create a complete CLAUDE.md adapted to the Claude Code
  branch/pull-request workflow."
- **2026-10-25 – Added CHANGELOG.md:** this file.
  *Why:* documents the vibe-coding process for the final report.
