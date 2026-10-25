# Changelog – Baumarkt-Buddy

All notable changes to this project are documented here.
Entries are collected under "Unreleased" and grouped into a milestone
when they are released to `main`.

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

## Unreleased
