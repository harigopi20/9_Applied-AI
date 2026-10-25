# Changelog – Baumarkt-Buddy

All notable changes to this project are documented here.
Entries are collected under "Unreleased" and grouped into a milestone
when they are released to `main`.

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
