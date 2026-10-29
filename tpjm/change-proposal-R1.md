# Baumarkt-Buddy – Change Proposal for Release 1

29 Oct 2026 · Hariram Gopalakrishnan

## Summary

**Most of Release 1 is already built.** The app has 9 projects with limits and stop rules, and 97 of 97 automated tests pass. **The team discussed 12 points (D-1 to D-12)**. Decided on 29 Oct 2026: 9 points; D-10 waits for the vibe coder; D-6 and D-12 are still open.

- **Basis:** the requirements and test cases of 27 Oct 2026, now updated with the decisions of 29 Oct 2026.
- **Our proposals:** where we think the app can do better, the proposal is listed next to what the app does today, together with its risk.
- **After the meeting:** requirements, test cases and the feature plan are updated; the product and project catalogues follow later.

## What is already built

The new parts of Release 1 and their status; feature numbers are from the feature implementation plan v0.8.

| Feature | What the customer gets | Status | Discuss |
| --- | --- | --- | --- |
| F-11 Project catalogue | 9 projects (shelf, wall cabinet, picture, anti-tip, paint, glass door, door lock, sliding door, wallpaper), each with its own limits and stop rules | ✅ Built | D-4, D-5, D-6, D-8, D-10 |
| F-12 OBI how-to links | Checked OBI videos and articles for projects 5–9 | ✅ Built | D-8 |
| F-13 Weight and condition check | Give the weight; used parts are checked for damage | 🟡 Partly built | D-2 |
| F-14 One safety check per project | Easy projects get no wall or weight questions; all safety checks still run | ✅ Built | D-7 |
| F-15 Owned items on the list | "I already have this" for tools and load-bearing parts; the price leaves the total | 🟡 Partly built | D-3, D-7 |
| F-16 Save the project list | Save the complete list on the phone and share it | ❌ Not built | D-1 |

All other Release 1 features (text and speech entry, questions, checked list, safety stops, postcode and stores, data, privacy, mobile use) are built.

## What we decide today

Each point says what the app does today and what we propose. The "Decision" column shows the team decision of 29 Oct 2026. Points D-6, D-8 and D-9 are only a confirmation. Speech input works in Chrome, Edge and Safari and on phones (checked by Hari) – no discussion needed.

| No. | Topic | App today | Our proposal | Risk | Decision |
| --- | --- | --- | --- | --- | --- |
| D-1 | Save the project list (F-16) | Not built. Requirement file says R2 / Could. | **R1 / Must**: save the complete list (products, prices, aisle and shelf, how-to links) on the phone and share it. | None. Already agreed by Hari and the colleague – please confirm. | ✅ **R1 / Must** – FR-17 and DR-06 moved to R1 |
| D-2 | Unknown weight (F-13) | "I don't know" → the app stops. | Add "weigh it" (bathroom-scale tip) and "estimate for me" (shown as estimate, customer confirms); unknown → worst case. | A little less strict; the estimate values need a team review. | ✅ Approved (FR-04, SR-14) |
| D-3 | Owned items and prices (F-15) | Two controls: a **tick box** on every item (shopping checklist – the price does not change) and an **"I already have this"** button for tools and load-bearing parts (the price leaves the total). No subtotal per section. Plugs and screws have no button and no hint. | One clear rule: **(a)** an item the customer already has is ticked off and its price is deducted from the **section subtotal** (Materials, Tools, Safety gear) **and the total**; **(b)** each section shows its subtotal; **(c)** plugs and screws: allow ticking off with the hint "must suit your wall type and the size on the list" – or keep "always new". | (a), (b): none. (c): less strict – keeping "always new" is the safer choice. | ✅ **Changed:** remove the tick box, keep "I already have this"; subtotal per section (new FR-34); hint "Keep the right tool and gear to ensure safety" when a tool or safety gear is marked as owned (new SR-17). Plugs and screws stay "always new". |
| D-4 | Sliding door weight (F-11) | Max. 40 kg (plug 50 kg ÷ 1.25). | 60 kg, but only after a plug or anchor rated at least 75 kg is in the catalogue. | **Unsafe** without the stronger plug. | ✅ Approved – stays 40 kg until a plug rated ≥ 75 kg is in the catalogue (SR-13) |
| D-5 | **Wood and aerated concrete walls in R1** (F-11) | Wood: not offered. Aerated concrete: offered, but the app always stops ("ask staff") – no suitable plugs in the catalogue. | **Full feature in R1** for all mounting projects: (1) product catalogue: add aerated-concrete plugs (generic sample products) and mark the wood screws P048–P050 for wood; (2) project catalogue: limits for both walls (wood max. 50 kg; aerated concrete = rating of the new plug ÷ 1.25), drill and bit per wall, items; (3) app templates and tests. **If this is not ready for R1: do not offer the two wall types at all.** | New limits need a team review. Effort about 1.5–2 person-days. | ✅ Approved – full feature in R1. Aerated-concrete plug: sample value, **team to verify** |
| D-6 | Sliding-door rules (F-11) | In the app only: 3 cm overlap per side and at the top, free wall beside the opening. | Write them into the project catalogue as "assumption". | None – only confirm. | ⏸ Undecided – no change |
| D-7 | Three extra release tests (F-11, F-14, F-15) | The behaviour is tested, but not as release-blocking tests. | Add 3 release-blocking tests (table below). The release only goes out when they pass. | None. | ✅ Approved – RB-22, RB-24, RB-25 added to the test cases §7.1 |
| D-8 | Text updates (F-03, F-06, F-11, F-12) | Some texts in the files no longer match the app. | Update the texts as in the table below. | None – only confirm. | ✅ Approved |
| D-9 | Price and stock without a postcode (F-07) | Built: the price is shown; stock, aisle and shelf show "not available" with the hint to add a postcode. FR-30 still says "TBD". | No new requirement – write the app behaviour into FR-30. | None – only confirm. | ✅ Approved – app behaviour written into FR-30 |
| D-10 | **Show the allowed range at each input field** (F-11) | The limits are checked only after all answers: the customer fills in everything and then sees "we stop here for safety". | Show the permissible range as a clear note beside each dimension or weight field, e.g. "Weight: max. 25 kg on plasterboard" or "Depth: max. 30 cm". The note follows the answers given so far (e.g. the weight limit changes with the wall type). New requirement text below. | None – the stop rules stay as they are. | 🟡 Drop-downs for length and width (30, 50, 60, 75, 90, 100, 120 cm) and for weight (min–max). **To verify with the vibe coder** – requirements not changed yet (also depth and weight). |
| D-11 | **Add OBI Schwabach as 6th store** (F-06) | 5 sample stores (Nürnberg, Erlangen). | Add OBI Markt Schwabach, Nürnberger Str. 86, 91126 Schwabach, Mo–Sa 8:00–20:00 (one of our personas lives there). Update the Stores and Store stock sheets (sample stock for all 105 products), "max. stores shown" from 5 to 6, DR-01 and FR-29 texts, and the tests that count 5 stores. | None for safety; tests must be updated. | ✅ Approved – 6 stores (DR-01, FR-29) |
| D-12 | **Update the design document** (`03-design.md`) | Still v0.4 (25 Oct): 70 products, 5 stores, old CSV files in the architecture picture, rules only for shelf and picture, project templates "to be created"; open decisions DD-6 and DD-8 already built. Not used for the vibe coding. | Bring it to v0.5 **after this meeting**, based on the app and the decisions of today: 9 projects and safety levels, stop rules ST-01…ST-14, owned items, how-to links, range notes (D-10), 6 stores, updated rule table and data sources. Decide **who** updates it and **by when**. | None – documentation only. Without it the V-model design phase is not complete. | ⏸ Undecided – no change |

**D-7 – the three release-blocking tests**

| Test | What it checks | Example | Already tested by | Work |
| --- | --- | --- | --- | --- |
| RB-22 | Every project limit: just below, exactly at and just above | Shelf on plasterboard: 25 kg → list; 25.1 kg → stop | TC-081, TC-082, TC-089, TC-096 | Add as a gate in the test cases §7 |
| RB-24 | A ticked-off item stays visible; subtotals and total = sum of the items not ticked off | Tick off the hammer drill → Tools subtotal and total go down by its price | TC-090 (partly) | Extend TC-090 after D-3 |
| RB-25 | An easy project never skips the safety checks | "Paint the wall and move the socket" → stop (electrics) | TC-095 | Add as a gate in the test cases §7 |

**D-8 – text updates**

| Where | Today | New text |
| --- | --- | --- |
| FR-05 (requirement) | "Ask dependency-aware follow-up questions" | … on at most 3 question screens |
| FR-29 (rationale) | Distance, number of stores shown, number of stores: TBD | 50 km; max. 6 stores shown; 6 sample stores (with D-11) |
| FR-31 (rationale) | "TC-34 to TC-37" | TC-024, TC-079 |
| DR-04 (requirement) | "5–10 reviewed templates" | 9 reviewed project templates from the project catalogue |
| Project catalogue, sheet How-to links | 2 videos "to verify" | All videos verified (Hari, 27 Oct 2026) |
| Test cases §9, items 9 and 12 | Q-1 … Q-4 and new IDs "open" / "proposed" | Resolved by the decisions of this meeting |
| App test names | TC-34 … TC-38 (old numbers) | Matching IDs of test cases v1.1 (developer task) |

**D-10 – proposed requirement (on hold until verified with the vibe coder)**

- EN: *Display the permissible range for each dimension or physical specification as a clear note beside the corresponding input field, so customers know the safety limits before making their selection.*
- DE: *Der zulässige Bereich jeder Abmessung oder physikalischen Angabe wird als deutlicher Hinweis neben dem jeweiligen Eingabefeld angezeigt, damit Kunden die Sicherheitsgrenzen vor ihrer Auswahl kennen.*

## Basis documents

- [`requirements-R1-MVP_2026-10-27.md`](https://github.com/st854d2gpb-create/9_Applied-AI/blob/main/requirements/requirements-R1-MVP_2026-10-27.md) – 53 requirements for Release 1
- [`requirements-R2-R4_2026-10-27.md`](https://github.com/st854d2gpb-create/9_Applied-AI/blob/main/requirements/requirements-R2-R4_2026-10-27.md) – 18 requirements for later releases
- [`01_test_cases_2026-10-27.md`](https://github.com/st854d2gpb-create/9_Applied-AI/blob/main/test/01_test_cases_2026-10-27.md) – test cases v1.2 (97 automated tests PASS; TC-100…TC-107 new)
- [`03-design.md`](https://github.com/st854d2gpb-create/9_Applied-AI/blob/main/data/03-design.md) – design v0.4 (25 Oct 2026), not yet updated (D-12)
- `data/product_catalogue.xlsx` (105 products) and `data/project_catalogue.xlsx` (9 projects)
- `Feature_Implementation_Plan.xlsx` v0.9 – features, status, traceability and the discussion list with the decisions
- [OBI Markt Schwabach](https://www.obi.de/markt/schwabach) – address and opening hours (D-11)
