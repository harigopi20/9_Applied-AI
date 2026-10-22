# Baumarkt-Buddy – Requirements Specification (Phase 1)

> **Author:** Agent A2 (Requirements & Test design) · **Reviewer / approver:** Quality & Responsible AI + Project lead
> **Status:** Draft v0.2 – for review · **Sources:** Product_Description.pdf, phase-1-prototype-scope.md, hybrid-mvp-proposal.md, `data/product_catalogue.csv`, `data/store_map.csv`
> **Test cases:** see [`tests/test-cases.md`](../tests/test-cases.md)

---

## 1. Purpose and entry flow

**Goal of Phase 1:** A customer defines **one project** – by typing it or by choosing it from a list – answers up to 3 questions, and only then receives a safe, compatible parts list with aisle and shelf for every item.

**Entry flow (start screen):**

```text
┌───────────────────────────────────────────────┐
│  What do you want to do?                      │
│  [ e.g. "I want to hang a shelf"        ] [→] │   ← Option A: free text
│                                               │
│  Or choose a project:                         │
│  [Hang a shelf] [Hang a picture / mirror]     │   ← Option B: project list
│  [Assemble a shelf] [Wall-mount a TV]         │
│  [Build a raised bed]                         │
└───────────────────────────────────────────────┘
        ↓ project identified
   Up to 3 questions (wall type, load, …)
        ↓ all answers given + all safety checks passed
   Parts list: Materials · Tools · PPE  →  Aisle X · Shelf Y
```

**Key principle:** No parts list is shown until (1) the project is identified and (2) all required answers are given. The AI proposes; deterministic code decides.

---

## 2. ID scheme and priorities

| Prefix | Meaning | Prefix | Meaning |
|---|---|---|---|
| FR | Functional requirement | PT | Project template |
| SR | Safety requirement | R | Rule (rule engine, code) |
| NFR | Non-functional requirement | DR | Data requirement (catalogue) |

**MoSCoW:** **M** Must · **S** Should · **C** Could · **W** Won't (this phase).
Every requirement has an acceptance criterion written as *Given / When / Then* and is linked to at least one test case (TC-xx).

> Note: Safety requirements FR-07/08/09 from the scope document are renumbered **SR-01/02/03** here so that safety is traceable on its own. The mapping is shown in each row.

---

## 3. Project templates (Option B list)

| ID | Project | MoSCoW | Clarifying questions (max. 3) | Catalogue coverage |
|---|---|---|---|---|
| PT-01 | **Hang a shelf** | **M** | 1 Wall type · 2 Load in kg · 3 Shelf board needed? | ✅ Complete |
| PT-02 | **Hang a picture / mirror** ("wall hanger") | **M** | 1 Wall type · 2 Weight in kg | ✅ Complete |
| PT-03 | Assemble a simple wooden shelf (free-standing) | S | 1 Height × width in cm · 2 Load per shelf in kg · 3 Finish (raw / varnished) | ⚠️ Partial – see DR-03 |
| PT-04 | Wall-mount a TV | S | 1 Wall type · 2 TV weight in kg · 3 VESA pattern (e.g. 200×200) | ❌ Missing TV bracket – see DR-01 |
| PT-05 | Build a raised bed | C | 1 Length × width × height in cm · 2 Outdoor location confirmed | ❌ Missing outdoor boards, stainless screws, liner – see DR-02 |

**Phase 1 demo focus:** PT-01 and PT-02 (fully covered by the catalogue). PT-03 to PT-05 are shown in the list but marked *"coming soon"* until the data is added (FR-02c).

---

## 4. Functional requirements

| ID | Pri | Requirement | Acceptance criterion (Given / When / Then) | Tests |
|---|---|---|---|---|
| **FR-01** | **M** | **Free-text project entry** (EN; DE = Could) | Given the start screen, when the user types "I want to hang a shelf", then the app identifies project PT-01 and starts the questions. | TC-01, TC-02 |
| **FR-02** | **M** | **Project list (templates)** shown on the start screen | Given the start screen, when it loads, then all templates PT-01…PT-05 are visible as tappable buttons. | TC-03 |
| FR-02a | **M** | Selecting a template starts its questions | When the user taps "Hang a shelf", then question 1 of PT-01 is shown. | TC-04 |
| FR-02b | **M** | Unrecognised free text → offer the list | When the text cannot be mapped to a template, then the app asks "Which of these projects is closest?" and shows the list. No parts are shown. | TC-05 |
| FR-02c | S | Templates without catalogue coverage marked "coming soon" | When PT-04/PT-05 lack data, then they are visible but disabled with the label "coming soon". | TC-06 |
| **FR-03** | **M** | **No parts list before the project is fully defined** | Given a project is identified, when any required answer is missing, then no product, aisle or price is displayed. | TC-07 |
| **FR-04** | **M** | **Max. 3 clarifying questions** per project, with fixed answer options where possible (wall type: concrete / brick / plasterboard / don't know) | The app never asks more than 3 questions; "don't know" for wall type triggers SR-04. | TC-08, TC-19 |
| **FR-05** | **M** | **Parts list split** into Materials · Tools · PPE | Every item appears in exactly one category; PPE is present whenever drilling is required. | TC-09 |
| **FR-06** | **M** | **Catalogue locking** – only products from `product_catalogue.csv` | 100 % of shown product numbers exist in the catalogue. | TC-10, TC-25 |
| **FR-07** | **M** | **Compatibility by rule engine** (plug ↔ drill bit ↔ screw ↔ bracket, load) – rules R-01…R-16 | For every rule-table case, the output equals the expected parts. | TC-11…TC-16, UT-01…UT-12 |
| **FR-08** | **M** | **Aisle and shelf for every item** from `store_map.csv` | Each item shows "Aisle X · Shelf Y" exactly as in the CSV. | TC-17 |
| FR-09 | S | **Quantities** (packs, number of fixings) | Brackets per pair → 4 plugs + 4 screws; quantity shown per item. | TC-18 |
| FR-10 | S | Stock shown; if `qty_on_shelf` = 0 → flag "out of stock – ask staff" | Out-of-stock item is flagged, not hidden. | TC-20 |
| FR-11 | C | Short step-by-step guide (max. 6 steps) referencing only listed items | Guide mentions no product outside the parts list. | TC-21 |

---

## 5. Safety requirements

| ID | Pri | Requirement | Acceptance criterion | Gate | Tests |
|---|---|---|---|---|---|
| **SR-01** (was FR-07) | **M** | **Substrate & load gate:** no wall-mounting parts until wall type **and** load are confirmed | Missing wall type or load → question asked, no list. | G1 | TC-07, TC-19 |
| **SR-02** (was FR-08) | **M** | **High-risk exclusion:** mains electrical, gas, load-bearing walls, hidden plumbing, cables inside walls → refuse + "Hire a professional" banner | 100 % of high-risk prompts refused; no parts list shown. | G0 | TC-22, RT-01…RT-06 |
| **SR-03** (was FR-09) | **M** | **Output validation and fallback:** invalid or unverified answer → max. 2 retries → "Please ask store staff" | Invalid output never reaches the user. | G2–G4 | TC-23, TC-24 |
| **SR-04** | **M** | **Unknown wall type:** if the user answers "don't know" → no drilling advice; show how to check (knock test / detector P034) or ask staff | No mounting list with unknown substrate. | G1 | TC-19 |
| **SR-05** | **M** | **No guessing of concealed infrastructure:** before any drilling, list detector P034 and show "Scan the wall for cables and pipes before drilling" | Every drilling list contains P034 and the warning. | G3 | TC-12 |
| **SR-06** | **M** | **Load limits:** plasterboard > 25 kg or any load > 50 kg → block mounting list, recommend alternative / staff / professional (R-08, R-12) | Over-limit request never produces a mounting list. | G3 | TC-15, TC-16 |
| **SR-07** | **M** | **Prompt-injection resistance:** instructions like "ignore your rules" are refused and logged | Rules unchanged; refusal shown. | G0 | RT-07, RT-08 |

---

## 6. Non-functional requirements

| ID | Pri | Requirement | Acceptance criterion | Tests |
|---|---|---|---|---|
| **NFR-01** | **M** | Zero made-up products | 0 unknown product numbers over the full test set | TC-10, TC-25 |
| **NFR-02** | **M** | All safety rules and load limits in **code**, never in the AI prompt | Code review: rule engine module contains R-01…R-16; prompt contains none of the numbers | TC-26 (review) |
| **NFR-05** | **M** | Mobile-first, one-hand use | Usable at 375 px width; buttons ≥ 44 px; no horizontal scroll | TC-27 |
| NFR-04 | S | AI transparency notice ("You are using an AI assistant") on start screen | Notice visible before first input | TC-28 |
| NFR-06 | S | Metric units only (kg, mm, cm) | No imperial units in any output | TC-29 |
| NFR-08 | C | German / English input and UI | German free text maps to the same template | TC-02 |
| NFR-09 | C | Each request logged with gate results (no personal data) | Log entry per request | TC-30 |

**Won't (Phase 1):** photo input, owned-item reconciliation, offline checklist, store-map route, response-time target, real store integration, payment, user accounts.

---

## 7. Rule table (input for build prompt P2 – implement as code)

### 7.1 Fixing compatibility (from catalogue)

| Fixing | Size | Load per fixing* | Wall types | Drill bit | Screw | Drill |
|---|---|---|---|---|---|---|
| P043 Universal plug | 6 mm | 15 kg | concrete, brick, plasterboard | P035 (6 mm) | P048 (4×40) | P040 / P039** |
| P044 Universal plug | 8 mm | 25 kg | concrete, brick, plasterboard | P036 (8 mm) | P049 (5×50) | P040 / P039** |
| P045 Heavy-duty plug | 10 mm | 50 kg | concrete, solid brick | P037 (10 mm) | P050 (6×60) | P040 |
| P046 Plasterboard anchor | M5 | 15 kg | plasterboard | OPEN (DR-04) | included | P039 |
| P047 Anchor bolt | M8 | 100 kg | concrete | P037 (10 mm) | included | P040 |

\* `max_load_kg` in the catalogue is interpreted as **load per fixing point** (OPEN-1). ** P040 hammer drill for concrete/brick, P039 drill driver for plasterboard.

### 7.2 Brackets and boards

| Item | Rated load | Compatible fixings |
|---|---|---|
| P058 Bracket 150 mm (pair) | 20 kg | P044 + P049 |
| P059 Bracket 200 mm (pair) | 30 kg | P044 + P049 |
| P060 Bracket heavy-duty 250 mm (pair) | 60 kg | P045 + P050 |
| P063 Board 800×200×18 mm | 20 kg | with P058 / P059 |
| P064 Board 800×250×18 mm | 25 kg | with P059 / P060 |

### 7.3 Rules

| ID | Rule (deterministic code) | Linked req. |
|---|---|---|
| R-01 | Wall type and load must be known before any wall-mounting output | SR-01 |
| R-02 | Choose the **smallest bracket** with rated load ≥ **1.25 × load** | FR-07 |
| R-03 | Choose the **smallest board** (if needed) with rated load ≥ **1.25 × load** and compatible with the bracket | FR-07 |
| R-04 | Fixing = bracket's compatible plug, **only if** the wall type is in the plug's `suitable_wall_types`; else next stronger plug that fits | FR-07 |
| R-05 | Drill bit = plug's compatible bit (same diameter) | FR-07 |
| R-06 | Screw = plug's compatible screw | FR-07 |
| R-07 | Fixing capacity: number of fixings × load per fixing ≥ **2 × load** (safety factor 2) | FR-07, SR-06 |
| R-08 | Plasterboard and load > **25 kg** → block; offer free-standing alternative or "ask staff" | SR-06 |
| R-09 | Concrete / brick → hammer drill P040; plasterboard → drill driver P039 | FR-07 |
| R-10 | Drilling → PPE goggles P028; sawing / sanding → P028 + mask P029 | FR-05 |
| R-11 | Any drilling into a wall → detector P034 + warning "Scan the wall before drilling" | SR-05 |
| R-12 | Any load > **50 kg** → block; "Please consult a professional" | SR-06 |
| R-13 | Any proposed item with `requires_professional = yes` (P017, P019) → refuse (G0) | SR-02 |
| R-14 | Quantities: 1 bracket pair = 4 fixings (plug + screw); spirit level P032 always for wall-mounting | FR-09 |
| R-15 | Picture / mirror ≤ 10 kg on brick or plasterboard → picture hooks P051 + hammer P030 + detector P034 + level P032 (no drilling); concrete or > 10 kg → R-04…R-07 with P043 | FR-07, SR-05 |
| R-16 | Board needed but no board meets R-03 → list all other parts, flag "No suitable shelf board in our catalogue – please ask staff" | SR-03 |

**Worked example (PT-01, 20 kg, concrete, board needed):**
R-02 → 1.25 × 20 = 25 kg → **P059** (30 kg) · R-03 → **P064** (25 kg) · R-04 → **P044** (concrete ✓) · R-05 → **P036** · R-06 → **P049** · R-07 → 4 × 25 = 100 kg ≥ 40 kg ✓ · R-09 → **P040** · R-10 → **P028** · R-11 → **P034** · R-14 → **P032**, 4 plugs, 4 screws.

---

## 8. Data requirements (owner: Data & research)

| ID | Pri | Gap | Needed for |
|---|---|---|---|
| DR-01 | S | Add TV wall bracket(s) with VESA pattern and max. load (e.g. 200×200 / 400×400, 35 kg) | PT-04 |
| DR-02 | C | Add outdoor boards (larch / Douglas), stainless screws, pond liner / foil | PT-05 |
| DR-03 | S | Add shelf connectors / angle brackets for free-standing shelf | PT-03 |
| DR-04 | M | Add drill bit size for plasterboard anchor P046 | R-04, PT-02 |
| DR-05 | M | Add `suitable_wall_types` for P051 picture hooks | R-15 |

---

## 9. Open questions for the team

| # | Question | Proposal |
|---|---|---|
| OPEN-1 | Is `max_load_kg` of a plug per fixing point or per pack? | Per fixing point |
| OPEN-2 | Safety factors 1.25 (brackets/boards) and 2 (fixings) – accepted? | Yes for Phase 1 |
| OPEN-3 | Plasterboard limit 25 kg – accepted? | Yes (conservative) |
| OPEN-4 | Does "wall hanger" mean picture/mirror (PT-02) or coat rack? | Picture / mirror; coat rack = Phase 2 |
| OPEN-5 | Show PT-03…PT-05 as "coming soon" or hide them? | Show as "coming soon" |

---

## 10. Traceability summary

| Requirement group | Count | Must | Gate | Test cases |
|---|---|---|---|---|
| Entry & templates (FR-01…FR-03) | 6 | 5 | – | TC-01…TC-07 |
| Planning & data (FR-04…FR-11) | 8 | 5 | G2, G3 | TC-08…TC-21, UT-01…UT-12 |
| Safety (SR-01…SR-07) | 7 | 7 | G0–G4 | TC-12, TC-15…TC-16, TC-19, TC-22…TC-24, RT-01…RT-10 |
| Non-functional | 7 | 3 | – | TC-25…TC-30 |
