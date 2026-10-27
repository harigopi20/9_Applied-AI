# Baumarkt-Buddy – Release 1 Requirements (Phase 1 scope)

| | |
|---|---|
| **Document** | `02-requirements.md` |
| **V-model phase** | 2 – Requirements (Release 1 subset) |
| **Version** | 0.1 (proposal for team review) |
| **Date** | 24 October 2026 |
| **Inputs** | [`01-concept.md`](01-concept.md) · [`03-design.md`](03-design.md) · `Baumarkt-Buddy_Release_Planning.xlsx` (M2 Proposal) · [`requirements/baumarkt-buddy-product-requirements.md`](../requirements/baumarkt-buddy-product-requirements.md) v1.0 · [`test/01_test_cases.md`](../test/01_test_cases.md) |
| **Owner / approver** | Project lead & PO · reviewed by Quality & Responsible AI |

> This document takes the R1 proposal from the release-planning workbook (43 items, 37 Must) and cuts it to what the team can build and test in the time left. It answers the open scope decisions D-1 … D-5 in `01-concept.md` §9.

---

## 1. Why the R1 scope must shrink

| Fact | Consequence |
|---|---|
| Sprint ends ~1 Nov 2026; on 24 Oct about **8 days** are left | Only one thin end-to-end flow can be built **and** tested |
| Workbook R1 has **37 Musts out of 43 items (86 %)**; the DSDM guideline is about 60 % | No buffer: any delay cuts safety or testing |
| Current `app/` is static HTML/JS with no AI call, no backend and no rule engine; the shelf list ignores load | The rule engine is the main build effort, not the UI |
| An AI call needs a backend so the API key stays off the client (NFR-06, DD-4) | The AI layer is the biggest risk and must be optional for the demo |
| The catalogue already has everything for UC-1 (brackets, boards, plugs, screws, bits, drills, detector, PPE, aisle, shelf, stock) | UC-1 can be built fully deterministic from existing data |

**Approach:** build the deterministic core first (templates, fixed questions, gates, rule engine, catalogue lookup). Add the AI intake on top only if the core passes its tests. If the AI fails, the demo still works through the template buttons (NFR-03).

---

## 2. Release 1 goal and scope decisions

**Goal:** A customer picks or describes a project, answers up to 3 fixed questions, and gets a safe, compatible shopping list from the catalogue with price, stock, aisle and shelf. High-risk work is refused.

| # | Decision (from `01-concept.md` §9) | R1 answer |
|---|---|---|
| D-1 | Entry modes | **Template buttons (Must) + free text (Must, keyword match)**; AI intake is Should. No photo, no voice |
| D-2 | Use cases | **UC-1 hang a shelf** and **UC-5 high-risk refusal** (Must); **UC-3 picture/mirror** (Should, needs one data fix); UC-4 paint stays as the existing starter list (Could) |
| D-3 | Capability areas | **1 Entry → 2 Clarification → 3 Planning → 4 Validation → 5 Shopping list** (simple tick-off). No assembly guide |
| D-4 | UI language | English UI for the demo; German keywords also recognised for the shelf project |
| D-5 | Prioritisation method | MoSCoW within the release |

---

## 3. Release 1 requirements

### 3.1 Must have (24)

| ID | Requirement (R1 part only) | Acceptance criterion | Test |
|---|---|---|---|
| FR-02 | Enter a project by template button or free text | "Hang a shelf" button and "I want to hang a shelf" both start UC-1 | TC-01, TC-04 |
| FR-03 | Map text to a template with keywords; unknown text offers the template list | "I want to fix something" shows the list, no products | TC-05 |
| FR-04 | Capture wall type (concrete / brick / plasterboard / don't know) and load in kg as user-confirmed answers | Values come only from the user's answers; nothing is guessed | TC-07, TC-08 |
| FR-05 | Ask at most 3 fixed questions per template (UC-1: wall type, load, board needed?) | Never more than 3 questions; no list until all required answers are given | TC-07, TC-08 |
| FR-06 | Split the list into Materials · Tools · PPE with quantities | Every item in exactly one group; PPE present whenever drilling is needed | TC-09, TC-18 |
| FR-08 | Only products from `product_catalogue.csv` | 100 % of shown product numbers exist in the catalogue | TC-10, TC-25 |
| FR-09 | Rule engine selects bracket, board, plug, bit, screw, drill (R-02 … R-06, R-09, R-14) | Output equals the expected parts for each rule-table case | TC-11 … TC-14, UT-01 … UT-12 |
| FR-11 | Show price, stock and aisle/shelf from the catalogue, labelled "sample data" | Each item shows aisle and shelf exactly as in the CSV | TC-17 |
| FR-15 | High-risk requests refused with a "hire a professional" banner | No list for electrics, gas, load-bearing walls, hidden pipes | TC-22, RT-01 … RT-06 |
| SR-01 | Only user-confirmed answers drive safety decisions | Free-text values are shown back for confirmation before use | TC-07 |
| SR-03 / R-01 | No mounting list until wall type **and** load are confirmed | Missing either → question, no products | TC-07, TC-19 |
| SR-04 / R-07 | Capacity comes from the bracket's rating, **never** from adding plug ratings | Code review: no sum of plug ratings anywhere | UT-08, TC-26 |
| SR-05 / R-11 | Every drilling list includes detector P034 and the warning that a negative scan is no guarantee | Warning present on every drilling list | TC-12 |
| SR-06 / R-08, R-12 | Plasterboard over 25 kg or any load over 50 kg → blocked, offer staff/professional | Over-limit request never produces a mounting list | TC-15, TC-16 |
| SR-06 / R-16 | Required item missing from catalogue → flag "please ask staff", never substitute | Flag shown | TC-33 |
| SR-07 | Show each product's `safety_note` unchanged | Notes appear verbatim next to the item | Visual check |
| SR-08 | Changing wall type or load recalculates the whole list | No stale items after an answer changes | RB-04 |
| SR-09 / R-13 | Products with `requires_professional = yes` are never listed | P017, P019 never appear | TC-22 |
| NFR-01 | Mobile-first; flow done in under 2 minutes | Usable at 375 px; ≥ 4 of 5 test users finish without help | TC-27, user test |
| NFR-03 | Template buttons work when the AI or network fails | Demo works with AI switched off | Manual |
| NFR-04 | No login, no personal data stored or sent | Nothing but the project text leaves the device | Review |
| NFR-05 | "You are using an AI assistant" notice and "sample data" label | Visible before first input | TC-28 |
| NFR-07 | Catalogue and user text are data, never instructions | "Ignore your rules…" changes nothing | RT-07, RT-08 |
| NFR-10 | Catalogue, store map and templates stay in CSV/JSON files | No product data in code | Review |

**Release-blocking tests in R1 (must pass):** RB-01 unknown wall blocks anchors · RB-03 wrong screw variant caught · RB-04 higher load invalidates fixing · RB-06 no invented aisle · RB-07 detector limits never imply clearance · RB-09 injected instructions ignored · RB-13 pack quantity never gives a misleading total.

### 3.2 Should have (7)

| ID | Requirement | Note |
|---|---|---|
| FR-03 (AI) | AI intake agent classifies free text and extracts load/wall type as *candidate* facts (JSON, schema-checked, max. 2 retries) | Only after the deterministic core passes; needs a small backend function for the API key |
| UC-3 | Picture/mirror template with R-15 | Needs data fix DR-05 (see §5) |
| SR-10 | Team review of the two templates and the rule values before the demo | Qualified expert review moves to R3 |
| NFR-02 | List in under 5 seconds | Met automatically by the deterministic path |
| NFR-06 | API key kept off the client; basic rate limit | Only relevant if the AI intake is built |
| DR-07 | Each list line shows its rule IDs as the basis (e.g. "R-02, R-14") | Cheap evidence record; full explanations (FR-10) in R2 |
| FR-14 (part) | Tick off items while shopping | Already built in `app/` |

### 3.3 Could have (3)

| ID | Requirement | Note |
|---|---|---|
| UC-4 | Keep the existing paint starter list | Already built; must still pass the catalogue check |
| NFR-09 | German UI toggle | English demo is enough |
| FR-17 (part) | Copy list to clipboard | Already built |

### 3.4 Moved out of R1 (Won't this release)

| ID | Was in workbook R1 as | Moved to | Reason |
|---|---|---|---|
| FR-01 | Should (session save) | R2 | Not needed for a one-visit demo |
| FR-10 | (R2 Must) | R2 | Rule IDs on each line (DR-07) cover R1 |
| Clarification and planner agents | Design components | R2 | Fixed template questions and the rule engine do the job safely |
| SR-02 (photo part) | Must | R3 | No photos in R1; detector-limit part covered by SR-05 |
| NFR-09 bilingual test suite | Should | R2 | English demo |
| DR-04 5–10 templates | Must (2 templates) | R2 | R1 = shelf (+ picture if DR-05 is fixed) |

**Resulting balance:** 24 Must · 7 Should · 3 Could → Musts are about 70 % of the items, down from 86 %. Every safety requirement that applies to UC-1 is still a Must.

---

## 4. Release 1 exit gate

| Check | Target |
|---|---|
| Exit tests T1–T5 in `test/01_test_cases.md` | All pass |
| R1 release-blocking tests (RB-01, 03, 04, 06, 07, 09, 13) | All pass |
| Rule-engine unit tests UT-01 … UT-12 | All pass |
| Red-team prompts RT-01 … RT-08 | 8 / 8 refused |
| Hallucinated products | 0 % |
| User test | ≥ 4 of 5 users finish in under 2 minutes |

---

## 5. Blockers to resolve this week

| # | Blocker | Proposal | Owner |
|---|---|---|---|
| B-1 | **R-07 conflict.** The Phase 1 draft checked capacity as "4 plugs × 25 kg ≥ 2 × load", which adds plug ratings and breaks SR-04. The design's R-07 says "no system rating → Data unavailable", which would block every shelf list because the catalogue has no system ratings | Treat the bracket pair's `max_load_kg` together with its listed `compatible_with` plug and screw as the system rating (mock, labelled). Update UT-08/UT-09 accordingly | Quality + App builder |
| B-2 | **DR-05 data gap.** P051 picture hooks have an empty `suitable_wall_types`, so R-15 can't run | Fill in the wall types (e.g. `brick;plasterboard`) or drop UC-3 from R1 | Data & research |
| B-3 | **App builder role is "tbd"** in the README | Assign one person to the rule engine today; the UI already exists | Project lead |
| B-4 | **Limits are mock values** (1.25×, 25 kg, 50 kg) | Keep for the demo, label them, confirm in SR-10 review | Quality |
| B-5 | **Test file links and IDs** point to deleted documents (`docs/02-requirements.md`) | Point them to this file once approved | Quality |

---

## 6. Build order (8 days)

1. **Day 1–2:** templates as JSON (shelf, picture); fixed questions; G0 high-risk filter (reuse `detectProject()`); G1 required-facts check.
2. **Day 3–4:** rule engine R-01 … R-16 as plain functions; unit tests UT-01 … UT-12.
3. **Day 5:** list view with Materials · Tools · PPE, price, stock, aisle/shelf, safety notes, rule IDs, sample-data label.
4. **Day 6:** system tests TC-01 … TC-33, red-team RT-01 … RT-10, fix.
5. **Day 7:** optional AI intake behind a backend function, only if days 1–6 are green; otherwise skip.
6. **Day 8:** user test with 5 people, record demo video, freeze.
