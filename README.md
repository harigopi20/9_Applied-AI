# Baumarkt-Buddy 🛠️
*AI shopping and project assistant for DIY stores – MBA Applied AI group project*

## What is it?
Baumarkt-Buddy is a mobile web app that helps DIY-store customers plan small home projects.
A customer types a project (e.g. "hang a 20 kg shelf") or takes a photo of a part, and gets:
- a **shopping list** of the right products
- a **store map** with the route to each aisle and shelf
- a **step-by-step guide** for the job

For risky work (electrics, gas, load-bearing walls) the app shows a **"hire a professional"** warning.

## Why this idea?
Real customer problem, our own sample data, low GDPR risk, buildable in 2 weeks, and a clear B2B customer (the DIY store).

## How it works
The AI only recommends products from our own catalogue. Every answer is checked
(product exists, sizes match, safety rules) before the customer sees it.
See [diagrams](diagrams/baumarkt-buddy-diagrams.md) for details.

## Repository structure
| Folder | Content |
|---|---|
| `requirements/` | Requirements |
| `data/` | Product catalogue (CSV) and store map |
| `diagrams/` | Architecture and planning diagrams |
| `app/` | App code and AI prompts |
| `tests/` | Test cases and results |
| `pitch/` | Pitch deck and demo video link |

## App (Release 1 MVP – in progress)
The app lives in [`app/`](app/): a static web app (HTML, CSS, vanilla JavaScript,
no build step) for GitHub Pages. **Status: stage 2 of 5** – free-text entry and
project buttons, follow-up questions, rule engine, safety stops and shopping
list. Voice input (stage 3) and PLZ/store selection (stage 4) follow.

### Architecture
| Layer | File | Responsibility |
|---|---|---|
| Input | `app/app.js` | Free text and project buttons; dictated text (stage 3) uses the same `submitText` path |
| AI (understanding only) | `app/ai-adapter.js` | Classify intent, extract candidate values as schema-validated JSON – never decides |
| AI proxy (optional) | `proxy/` | Cloudflare Worker that holds the API key and rate-limits (see `proxy/README.md`) |
| Rule engine (all decisions) | `app/rules.js` | Fact gate, product choice, quantities, compatibility, load limits, notices, evidence log |
| Data | `app/data.js`, `app/data/` | Loads the Excel file (SheetJS) and the JSON templates / safety word lists |
| Texts | `app/i18n.js` | All UI texts in English (default, team decision 2026-10-25 – deviates from "German default" in NFR-09) and German |
| Config | `app/config.js` | Data paths, AI mode, store distance / number (TBD by the team) |

Safety principles in code: only values **confirmed by tap** or **manufacturer data**
drive decisions (SR-01, SR-11); no wall plugs without confirmed wall type and load
(SR-03); every load-bearing part must carry the whole load × 1.25 on its own –
ratings are never added up (SR-04); unknown or missing → stop (SR-06); the
product `safety_note` is shown unchanged (SR-07); every list that goes into the
wall shows the detector-limits notice (SR-05); aisle/shelf/stock only from the
selected store, never invented (RB-06, RB-15).

### AI adapter modes (`aiMode` in `app/config.js`)
| Mode | What it does | Cost |
|---|---|---|
| `template` **(default, team decision)** | Keyword matching with `data/understanding-lexicon.json` (intents, wall types, units, number words DE/EN such as "zwölf Kilo", "twelve kilos") | free |
| `proxy` | Commercial model via `proxy/` (built, not active). Set `ai.proxyUrl` | API usage |
| `mock` | Fixed answers from `data/ai-mock-responses.json` for tests and demos; also via `index.html?ai=mock` | free |

All modes return the same JSON schema (`intent`, `high_risk`, `facts`), validated
in code; invalid answers are discarded. Flow for free text:
1. G0 high-risk check in code (`checkScope`) – before and independent of the AI (SR-09).
2. Adapter → project + recognised values, all with status `observed` (“guess”).
3. "Did we understand you correctly?" screen, then at most 3 questions with the
   guesses pre-filled; only tapped answers become `user-confirmed` (SR-01, FR-04, FR-05).
4. Unsupported/unclear text → hint + the two project buttons. AI failure, timeout
   or invalid answer → project buttons; the text and keyword guesses are kept (NFR-03).

Before anything is sent to the proxy, postcodes (5 digits), phone numbers and
e-mail addresses are removed from the text (NFR-04). Only `text` and `lang` are sent.

### Data file `app/data/baumarkt-buddy-data.xlsx` (DR-01 … DR-03)
Built from `data/product_catalogue.csv` and `data/store_map.csv` with
`python3 tools/build_sample_data.py`. **All values are sample data.**

| Sheet | Columns |
|---|---|
| `Products` | `product_nr`, `product_name`, `variant_group`, `category`, `size`, `pack_qty` (pieces per sales unit; empty = unclear), `pack_unit`, `specs` (`key=value;…`, e.g. `diameter_mm=8`), `description`, `material`, `colour`, `price_eur`, `max_load_kg`, `suitable_wall_types`, `compatible_with`, `use_cases`, `requires_professional`, `safety_note`, `data_status`, `data_note` |
| `Stores` | `store_id`, `store_name`, `plz`, `city`, `lat`, `lon`, `data_status` |
| `Stock` | `store_id`, `product_nr`, `stock_qty`, `aisle_nr`, `aisle_name`, `shelf_nr`, `data_status` (empty aisle = unknown, shown as "not available") |
| `Info` | Sample-data notice and build date |

3 sample stores: S01 Berlin (= original `store_map.csv`), S02 München (other
aisles and stock; no aisle for P036/P049), S03 Hamburg (other layout; P060/P061
not stocked). Added for the sample: `suitable_wall_types` of P051 (picture hooks)
= brick, plasterboard – **team to verify**.

Further data files: `understanding-lexicon.json` (keyword mode), `ai-mock-responses.json` (mock mode).

Project templates (DR-04): `app/data/templates/hang-shelf.json` and
`hang-picture.json` with rule IDs, quantity rules and review status
(`pending_team_review` – set `status`, `reviewed_by`, `review_date` after the team
review, SR-10). Safety word lists: `app/data/safety-rules.json`.

### Run and test locally
The app loads data files with `fetch`, so it needs a local web server:
```bash
cd app
python3 -m http.server 8000
# app:   http://localhost:8000/index.html
# tests: http://localhost:8000/tests.html   (summary at the top)
```

### Publish on GitHub Pages
Settings → Pages → "Deploy from a branch" → `main`, folder `/ (root)`. The app is
then at `https://<user>.github.io/<repo>/app/`. No build step needed.

### Set up the AI proxy (optional)
See [`proxy/README.md`](proxy/README.md): Cloudflare Worker (free plan), API key as
Worker secret, CORS allowlist, 10 requests/minute per IP, logs off. Then set
`aiMode: "proxy"` and `ai.proxyUrl` in `app/config.js`.

### Third-party code
`app/lib/xlsx.mini.min.js` – SheetJS Community Edition 0.18.5 (Apache-2.0,
`app/lib/SHEETJS-LICENSE.txt`), vendored so the app needs no external CDN.
Note: 0.18.5 has known advisories for *untrusted* files; the app only reads its
own data file. Newer versions are published on cdn.sheetjs.com (replace the file).

### Requirement → implementation → test (stage 1)
| Requirement | Implementation | Test (tests.html) |
|---|---|---|
| SR-01, SR-03, SR-11 | `rules.js` G1 fact gate (`trustedValue`) | RB-01, SR-11 / RB-18 |
| SR-04, R-07, R-08, R-12 | `checkCandidate` load check, template limits | SR-04, R-08 / TC-R1-14, R-12 |
| SR-05, SR-02 | notices `detector_limits`, `no_wall_certification` | RB-07 |
| SR-06 | stop states `safety_blocked` | RB-01, RB-04 |
| SR-07 | `safety_note` unchanged, `guardGeneratedText` | RB-08 |
| SR-08 | `afterFactsChanged` → full re-evaluation; variant change | RB-04 |
| SR-09, FR-15 | `checkScope` + stop screen (used by text/voice in stage 2/3) | SR-09 |
| FR-06, FR-08, FR-09 | roles, catalogue-only selection, `compatible_with`, `specs` | UC-1, RB-03, G2 |
| FR-11, FR-30 | `storeInfo` (selected store only) | RB-06, RB-15, RB-17 |
| R-13 | `requires_professional` products excluded | R-13 |
| RB-13 | `pack_qty` validation, no total when unclear | RB-13 |
| NFR-07 / RB-09 | text via `textContent`, data never interpreted | RB-09 |
| DR-07 | evidence log per check and product | DR-07 |
| NFR-02 | – | NFR-02 |
| FR-02, FR-03, DR-05 | free text, `ai-adapter.js` (3 modes), `validateOutput` | FR-03 / DR-05, DR-05, FR-02 |
| NFR-03 | fallback to templates, text and guesses kept | NFR-03 (×2) |
| NFR-04, NFR-06 | `redact`, proxy CORS/rate limit/secret | NFR-04 / NFR-06 |
| NFR-07 | user text treated as data, guesses never confirmed | NFR-07 |
| SR-09 (G0) | `checkScope` before the AI | SR-09 / G0 |
| FR-04, FR-05, SR-01 | recognised screen, pre-filled guesses, ≤ 3 questions | SR-01 / FR-04 / FR-05 |
| NFR-09 | number words and units DE/EN | NFR-09 |

## Team
| Role | Member |
|---|---|
| Project lead & Product Owner | @st854d2gpb-create |
| App builder | tbd |
| Data & research | @shallykwatra19 |
| Quality & responsible AI | @harigopi20 |
| Business & design | @saraschoenhoefer-maker |

## Timeline
2-week MVP sprint starting 19 Oct 2026 → final pitch.

## Limitations
Sample catalogue (70 products), invented prices and aisle positions, no live stock data.
