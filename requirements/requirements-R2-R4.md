# Baumarkt-Buddy – Release 2 to 4 Requirements (proposal)

| | |
|---|---|
| **Source** | `Requirements_R1_2.xlsx` (after team review, round 3 incl. PLZ feature) |
| **Date** | 25 October 2026 |
| **Scope** | Releases 2, 3 and 4 (Beyond) – proposal, not built in the 2-week sprint |
| **Items** | 30 – Functional: 19 · Safety: 2 · Non-functional: 2 · Data: 1 · Release-blocking test: 6 |
| **MoSCoW** | Must: 7 · Should: 15 · Could: 5 · Won't: 3 |

**Legend:** MoSCoW = priority within the release (Must / Should / Could / Won't) · Release no. = 1 (R1) … 4 (Beyond) · Design components = IDs from `docs/03-design.md`.

| Release | Items |
|---|---|
| Release 2 – Extended MVP | 13 |
| Release 3 – Pilot-ready | 14 |
| Release 4 – Beyond (not planned) | 3 |

## Release 2 – Extended MVP – 13

### Functional requirements (FR) – 8

| ID | Type | Category | Requirement | Simple language | Proposed release | MoSCoW (in that release) | Rationale | Design components (for the part in the proposed release) | Release no. | Team decision | Team comment |
|---|---|---|---|---|---|---|---|---|---|---|---|
| FR-25 | Functional | Project entry | Describe the project using speech (speech-to-text, German/English); the transcript is shown as editable text and confirmed before use | Customers can say what they want to do; the app shows the text so they can check it first. | R2 | Should | Split from FR-02 (team review). Speech becomes text, then the same pipeline as typed input. Spoken load, size and wall type must be confirmed (SR-01, FR-04). Microphone only with permission; typing always available. | DC-10, DC-17, DC-02 | 2 |  | New requirement from team review of FR-02 |
| FR-27 | Functional | Project entry | Classify project intent from speech input and extract candidate project description | The app understands which project the customer means. | R2 | Should | Intent from speech via FR-25 (R2) | DC-17, DC-02 | 2 |  | New requirement from team review of FR-03 |
| FR-07 | Functional | Planning | Reconcile suitable owned items against the BOM | If you already own a tool or part, the app takes it off your shopping list. | R2 | Should | Valuable (problem P2) but not needed for a safe first flow | DC-29, DC-02 | 2 |  |  |
| FR-10 | Functional | Validation | Explain recommendations and unresolved facts | The app explains why each item fits and what is still unclear. | R2 | Must | R1 shows the quantity basis/rule ID; full explanations in R2 | DC-20, DC-04, DC-34 | 2 |  |  |
| FR-12 | Functional | Shopping | Offer feasible basket options and alternatives | Offer a cheaper or a better option for an item, and update the total price. | R2 | Should | Needs the core rule engine first | DC-28, DC-24, DC-04 | 2 |  |  |
| FR-14 | Functional | Shopping | Provide an offline project checklist | The shopping list still works in the store without internet. | R2 | Should | R1 has simple tick-off; offline PWA in R2 | DC-06, DC-15 | 2 |  |  |
| FR-16 | Functional | Assembly | Link assembly steps to reviewed sources | Give step-by-step building instructions based on the manufacturer's manual. | R2 | Should | Needs reviewed manufacturer sources | DC-08, DC-33, DC-32 | 2 |  |  |
| FR-17 | Functional | Shopping | Export and share a project summary | Save or share a project summary, for example as a link or PDF. | R2 | Could | Nice for sharing, low risk | DC-07 | 2 |  |  |

### Safety requirements (SR) – 1

| ID | Type | Category | Requirement | Simple language | Proposed release | MoSCoW (in that release) | Rationale | Design components (for the part in the proposed release) | Release no. | Team decision | Team comment |
|---|---|---|---|---|---|---|---|---|---|---|---|
| SR-11 | Safety | Evidence | Separate speech guesses from user-confirmed facts and manufacturer-supported specifications. | Keep guesses apart from confirmed facts. | R2 | Should | Speech-based guesses are covered when photo entry arrives with FR-25 (R2). | DC-02, DC-14, DC-23 | 2 |  | New requirement from team review of SR-01 |

### Non-functional requirements (NFR) – 1

| ID | Type | Category | Requirement | Simple language | Proposed release | MoSCoW (in that release) | Rationale | Design components (for the part in the proposed release) | Release no. | Team decision | Team comment |
|---|---|---|---|---|---|---|---|---|---|---|---|
| NFR-08 | Non-functional | Accessibility | Accessible contrast, scalable text, screen-reader labels and a non-map shopping route. | Easy for everyone to use: good contrast, bigger text, works with screen readers. | R2 | Should | Basic contrast in R1; full accessibility in R2 \| PLZ feature (R1): PLZ field and store list have screen-reader labels. | DC-39 | 2 |  |  |

### Data requirements (DR) – 1

| ID | Type | Category | Requirement | Simple language | Proposed release | MoSCoW (in that release) | Rationale | Design components (for the part in the proposed release) | Release no. | Team decision | Team comment |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DR-06 | Data | Sharing | Sharing: link or PDF export; later retailer hand-off. | Share the project as a link or PDF. | R2 | Could | Follows FR-17 | DC-07 | 2 |  |  |

### Release-blocking test cases (RB) – 2

| ID | Type | Category | Requirement | Simple language | Proposed release | MoSCoW (in that release) | Rationale | Design components (for the part in the proposed release) | Release no. | Team decision | Team comment |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RB-05 | Release-blocking test | Data | Stale stock is labelled stale and offers a verification path. | Test: old stock information is marked as old, with a way to check it. | R2 | Must | Stock freshness logic in R2 | DC-35, DC-04 | 2 |  |  |
| RB-12 | Release-blocking test | Offline | Network loss leaves saved checklist readable and removes live-stock certainty. | Test: without internet, the saved list stays readable and stock is marked as uncertain. | R2 | Must | Offline checklist arrives in R2 | DC-06 | 2 |  |  |

## Release 3 – Pilot-ready – 14

### Functional requirements (FR) – 9

| ID | Type | Category | Requirement | Simple language | Proposed release | MoSCoW (in that release) | Rationale | Design components (for the part in the proposed release) | Release no. | Team decision | Team comment |
|---|---|---|---|---|---|---|---|---|---|---|---|
| FR-01 | Functional | Project lifecycle | Create, save, resume and delete a project | The app remembers your project while the page is open. | R3 | Should | Team review: moved to R3 (focus). R1 and R2 run without saved projects. | DC-13, DC-14, DC-15 | 3 | Change | Focus for R3 |
| FR-26 | Functional | Project entry | Describe the project using photo upload; each photo has an explicit role (reference, room/installation area, owned item) and its content is only a candidate until confirmed | Customers can upload a photo of their project or part; the app treats what it sees as a guess to confirm. | R3 | Must | Split from FR-02 (team review). Also covers the photo parts of FR-03, SR-01, SR-02, NFR-06 (upload scanning) and NFR-07. Verified by RB-02. | DC-09, DC-21, DC-23, DC-02 | 3 |  | New requirement from team review of FR-02 |
| FR-28 | Functional | Project entry | Classify project intent from photo input and extract candidate project description | The app understands which project the customer means. | R3 | Should | Intent from photos via FR-26 (R3). | DC-17, DC-02 | 3 |  | New requirement from team review of FR-03 |
| FR-13 | Functional | Shopping | Support store search and retailer hand-off | Find your store by postcode and pass the list on to the store's website. | R3 | Should | Needs real store data / partner \| PLZ feature (R1): PLZ store search moved to FR-29 (R1). FR-13 keeps retailer hand-off and optional device location / QR code (R3). | DC-12, DC-40 | 3 |  |  |
| FR-18 | Functional | Shopping | Show verified aisle/zone/rack locations | Show the exact, checked aisle and shelf in a real store. | R3 | Should | Needs verified branch map; R1 uses mock aisle via FR-11 | DC-31, DC-35, DC-04 | 3 |  |  |
| FR-19 | Functional | Shopping | Scan products during shopping | Scan a product in the store to check it is the right one. | R3 | Could | Needs scanner and live product data | DC-11, DC-16, DC-24 | 3 |  |  |
| FR-20 | Functional | Assembly | Track assembly and deviations | Follow your progress while building, and adjust the steps if a part changes. | R3 | Could | Depends on assembly guide (FR-16) | DC-08, DC-16, DC-14 | 3 |  |  |
| FR-22 | Functional | Integration | Share a summary with a store associate | Share your project with a store employee so they can help you. | R3 | Should | Pilot feature with store associates | DC-07, DC-40 | 3 |  |  |
| FR-24 | Functional | Project entry | Add voice interaction or room visualisation | Talk to the app by voice, or see a picture of the finished project. | R3 | Could | Voice as optional entry; visualisation beyond R3 | DC-10, DC-17 | 3 |  |  |

### Safety requirements (SR) – 1

| ID | Type | Category | Requirement | Simple language | Proposed release | MoSCoW (in that release) | Rationale | Design components (for the part in the proposed release) | Release no. | Team decision | Team comment |
|---|---|---|---|---|---|---|---|---|---|---|---|
| SR-12 | Safety | Evidence | Separate pictural guesses from user-confirmed facts and manufacturer-supported specifications. | Keep guesses apart from confirmed facts. | R3 | Should | Photo-based guesses are covered when photo entry arrives with FR-26 (R3). | DC-02, DC-14, DC-23 | 3 |  | New requirement from team review of SR-01 |

### Non-functional requirements (NFR) – 1

| ID | Type | Category | Requirement | Simple language | Proposed release | MoSCoW (in that release) | Rationale | Design components (for the part in the proposed release) | Release no. | Team decision | Team comment |
|---|---|---|---|---|---|---|---|---|---|---|---|
| NFR-11 | Non-functional | Observability | Track unsupported requests, escalations, incidents, source failures, latency and cost per completed project. | Keep track of problems, waiting times and costs to improve the app. | R3 | Should | Needed for the pilot, not for the demo | DC-38, DC-34 | 3 |  |  |

### Release-blocking test cases (RB) – 3

| ID | Type | Category | Requirement | Simple language | Proposed release | MoSCoW (in that release) | Rationale | Design components (for the part in the proposed release) | Release no. | Team decision | Team comment |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RB-02 | Release-blocking test | Safety | Photo without scale does not produce exact dimensions. | Test: a photo without a size reference never gives exact measurements. | R3 | Must | Photo arrives in R3 | DC-09, DC-21, DC-23 | 3 |  |  |
| RB-11 | Release-blocking test | Shopping | Denied location permission leaves postcode search available. | Test: if location access is denied, searching by postcode still works. | R3 | Must | Store search arrives in R3 | DC-12 | 3 |  |  |
| RB-14 | Release-blocking test | Revalidation | A changed product during shopping triggers revalidation of affected assembly steps. | Test: swapping a product while shopping re-checks the building steps. | R3 | Must | Scanner arrives in R3 | DC-11, DC-16 | 3 |  |  |

## Release 4 – Beyond (not planned) – 3

### Functional requirements (FR) – 2

| ID | Type | Category | Requirement | Simple language | Proposed release | MoSCoW (in that release) | Rationale | Design components (for the part in the proposed release) | Release no. | Team decision | Team comment |
|---|---|---|---|---|---|---|---|---|---|---|---|
| FR-21 | Functional | Integration | Support an approved reservation integration | Reserve products in the store, only with an approved retailer. | Beyond | Won't | Requires retailer contract and API | DC-40 | 4 |  |  |
| FR-23 | Functional | Integration | Optimise baskets across retailers | Compare and combine shopping baskets across several stores. | Beyond | Won't | Multi-retailer data not available | DC-28, DC-40, DC-24 | 4 |  |  |

### Release-blocking test cases (RB) – 1

| ID | Type | Category | Requirement | Simple language | Proposed release | MoSCoW (in that release) | Rationale | Design components (for the part in the proposed release) | Release no. | Team decision | Team comment |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RB-10 | Release-blocking test | Integration | Retried checkout/reservation action cannot create duplicates. | Test: pressing "reserve" twice never creates two reservations. | Beyond | Won't | Reservation not in scope | DC-40 | 4 |  |  |
