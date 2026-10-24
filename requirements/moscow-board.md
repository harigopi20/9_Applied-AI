# Baumarkt Buddy – MoSCoW Board

Priorities for the Baumarkt Buddy app, sorted from the product requirements in [`baumarkt-buddy-product-requirements.md`](baumarkt-buddy-product-requirements.md) (FR = functional, SR = safety, NFR = non-functional). Release tags R1–R4 match the release roadmap.

| Priority | Items | Meaning |
|---|---:|---|
| **M** – Must have | 27 | The MVP can't ship safely without it |
| **S** – Should have | 10 | Important, but not blocking the MVP |
| **C** – Could have | 6 | If time and data allow |
| **W** – Won't have | 8 | Not this time, or never |

---

## M – Must have (27)

### Features

| ID | Item | Detail | Release |
|---|---|---|---|
| FR-02 | Describe a project in free text | Text entry only; photos come later | R1 |
| FR-03 | Recognise the project type | At least 8 of 10 test prompts mapped to the right template | R1 |
| FR-05 | Ask up to 3 follow-up questions | Skippable, except safety-critical ones like wall type | R1 |
| FR-06 | Materials, tools and PPE list | Quantities based on confirmed dimensions | R1 |
| FR-08 | Only real catalogue products | The model can't invent names, product numbers or prices | R1 |
| FR-11 | Price, stock and aisle per item | Mock values clearly labelled as mock | R1 |
| FR-15 | Safety stop with professional hand-off | Red banner for electrics, gas, structural work | R1 |
| FR-04 | Confirm measurements and load | Unit conflicts block product matching | R2 |
| FR-09 | Check parts fit together | Plug, drill bit, screw and bracket checked as one system | R2 |
| FR-10 | Explain why each item fits | Shows what is confirmed and what is still unverified | R2 |

### Safety

| ID | Item | Detail | Release |
|---|---|---|---|
| SR-01 | Keep AI guesses apart from facts | Visual guesses, user facts and manufacturer specs stay separate | R1 |
| SR-07 | Keep manufacturer warnings | Generated text can't weaken them (e.g. ventilate, wear mask) | R1 |
| SR-09 | Exclude high-risk work | Mains electrics, gas, load-bearing walls, hidden plumbing | R1 |
| SR-02 | Never certify a wall from a photo | A detector result is not clearance to drill | R2 |
| SR-03 | Wall type and load before mounting | No fixing list until both are confirmed | R2 |
| SR-04 | Don't add up anchor ratings | Use system evidence or refer to a qualified person | R2 |
| SR-05 | Explain detector limits | Not every detector finds every pipe, especially plastic | R2 |
| SR-06 | Missing evidence means stop | Over 25 kg on plasterboard or over 50 kg: no mounting list | R2 |
| SR-08 | Re-check after any change | New load, size or product re-runs all checks | R2 |
| SR-10 | Expert sign-off on templates | Before any public mounting guidance | R2 |

### Quality

| ID | Item | Detail | Release |
|---|---|---|---|
| NFR-01 | Mobile-first, under 2 minutes | Core flow without instructions | R1 |
| NFR-03 | Fallback if the model fails | Offer project templates; never skip a failed check | R1 |
| NFR-04 | GDPR, no login needed | Minimal personal data sent to the model provider | R1 |
| NFR-05 | AI guidance labelled | Quantities shown as estimates unless validated | R1 |
| NFR-07 | Product data is never an instruction | Protects against prompt injection in catalogue text | R1 |
| NFR-10 | Catalogue separate from code | CSV now, retailer API later | R1 |
| NFR-02 | List in under 5 seconds | Catalogue lookup under 1 second | R2 |

---

## S – Should have (10)

| ID | Type | Item | Detail | Release |
|---|---|---|---|---|
| FR-12 | Feature | Cheaper or premium alternatives | Totals update instantly; hard constraints still apply | R2 |
| FR-16 | Feature | Assembly steps from reviewed sources | Manufacturer stop conditions kept | R2 |
| FR-01 | Feature | Save, resume and delete a project | Return to the last confirmed state | R3 |
| FR-07 | Feature | Use items you already own | Only confirmed suitable items reduce the list | R3 |
| FR-13 | Feature | Find a store by postcode | Works when location is denied; retailer hand-off | R3 |
| FR-14 | Feature | Offline checklist | Readable without network; stock marked stale | R3 |
| FR-17 | Feature | Export and share a summary | Only selected information is shared | R3 |
| NFR-06 | Quality | Security basics | Encryption, rate limits, redacted logs | R3 |
| NFR-08 | Quality | Accessibility | Contrast, scalable text, a route that works without the map | R3 |
| NFR-09 | Quality | German and English | Metric units tested in both languages | R3 |

---

## C – Could have (6)

| ID | Type | Item | Detail | Release |
|---|---|---|---|---|
| FR-18 | Feature | Verified aisle and shelf location | Needs real branch map data | R3 |
| FR-02 | Feature | Add photos to a project | Role-labelled; never used for exact sizes | R4 |
| FR-19 | Feature | Scan products while shopping | Wrong size or variant triggers a re-check | R4 |
| FR-20 | Feature | Track assembly progress | A changed part invalidates later steps | R4 |
| FR-22 | Feature | Share with a store associate | Only what the customer selects | R4 |
| NFR-11 | Quality | Monitoring | Incidents, escalations, latency, cost per project | R4 |

---

## W – Won't have (8)

| ID | Item | Detail | When |
|---|---|---|---|
| FR-21 | Reservation integration | Needs an approved retailer partner | Later |
| FR-23 | Baskets across retailers | Spec priority P2 | Later |
| FR-24 | Voice and room visualisation | Spec priority P2 | Later |
| – | Native iOS / Android apps | Mobile web app is enough for the MVP | Later |
| – | Indoor blue-dot navigation | Aisle and shelf numbers only | Later |
| – | Payment and automatic checkout | Retailer hand-off only | **Never** |
| – | Mains electrical, gas or structural guidance | Always refused with a professional hand-off | **Never** |
| – | Wall identification from photos | The app never guarantees what is inside a wall | **Never** |

---

## How items were sorted

- **Must:** everything a customer needs to get a safe, catalogue-only list for low-risk and gated wall projects (R1 + R2), plus every safety requirement.
- **Should:** makes the app useful between visits and in the aisle (mostly R3).
- **Could:** pilot extras that need store data or partners (R4).
- **Won't:** later (P2) or deliberately excluded by the spec.

## Where this differs from the spec

- The spec marks FR-01 to FR-17 all as P0. For a 2-week MVP this board moves seven of them to Should and photo input to Could.
- Load limits on the safety items (25 kg on plasterboard, 50 kg overall) come from the team's earlier Phase 1 draft and still need sign-off.
