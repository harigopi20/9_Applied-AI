# Baumarkt Buddy diagrams

These diagrams summarize the product workflow, validation boundaries and release scope in the [product requirements](../requirements/baumarkt-buddy-product-requirements.md). The MVP is a mobile-first prototype using mock data where authorised live sources are not available; mock values must be labelled, and unverified availability or store placement must not be presented as fact.

## Customer journey and project lifecycle

```mermaid
flowchart TD
  Start([Start or resume project]) --> Input[Enter project text, constraints and budget]
  Input --> Evidence[Add role-labelled photos, barcode or model number, and manual measurements]
  Evidence --> Review[Review candidate observations and confirm critical facts]
  Review --> Owned[Identify owned items; confirm suitability and quantity]
  Owned --> Questions{Are required facts missing?}
  Questions -->|Yes, up to 3 optional questions at a time| Ask[Answer or skip focused questions]
  Ask --> Gate{Are safety-critical facts still missing?}
  Gate -->|Yes| Block[Keep fixing selection blocked; offer safe planning or professional help]
  Gate -->|No| Spec[Specification confirmed]
  Questions -->|No| Spec
  Block -->|Provide facts or continue without fixing advice| Review
  Spec --> BOM[Generate dependency-linked BOM with quantity basis]
  BOM --> Match[Reconcile confirmed suitable owned items]
  Match --> Validate[Match exact catalogue variants and validate compatibility]
  Validate --> Data{Required evidence and services available?}
  Data -->|No| Unavailable[Mark data unavailable; do not claim verification]
  Data -->|Yes| Store[Select store and fulfilment path]
  Store --> Plan[Review feasible basket, sourced price and availability]
  Plan --> Shopping[Save checklist; shop, check off or export/share selected details]
  Shopping --> Change{Product, material, dimensions or load changed?}
  Change -->|Yes| Recheck[Revalidate affected compatibility and safety decisions]
  Recheck --> Validate
  Change -->|No| Assembly[Follow reviewed manufacturer instructions and stop conditions]
  Assembly --> Done([Complete or record unresolved issue])
  Unavailable -->|Retry after source recovers| Validate
```

The project can also be saved, resumed or deleted. Saved checklists remain readable offline; stock and other time-sensitive claims must be marked stale or unavailable when they cannot be verified.

## Prototype architecture and evidence boundary

```mermaid
flowchart LR
  Customer([Customer]) --> UI[Responsive mobile web app / PWA<br/>No account required]
  UI -->|Text, constraints, budget| Intake[Project intake and state]
  UI -->|Role-labelled photos, barcode/model number| Intake
  UI -->|User-confirmed measurements and owned items| Intake

  Intake --> Observation[Observations with source,<br/>uncertainty and confirmation status]
  Observation -->|Minimum necessary context| Model[AI model<br/>bounded intent, extraction and suggestions]
  Untrusted[Photos, OCR, manuals and retailer content<br/>are data, never system instructions] -.-> Observation
  Model -->|Candidate requirements and product IDs only| Gate[Deterministic validation]

  Templates[(Reviewed project templates<br/>and quantity rules)] --> Gate
  Catalogue[(Approved product catalogue<br/>and exact variants)] --> Gate
  Evidence[(Manufacturer sources and<br/>evidence records)] --> Gate
  StoreData[(Authorised store, price, stock<br/>and placement sources)] --> Gate

  Gate --> Quantities[Calculate quantities and dependencies]
  Gate --> Compatibility[Check exact variants,<br/>constraints and approved combinations]
  Gate --> Safety[Apply safety gates and stop conditions]
  Quantities --> Result{Validation result}
  Compatibility --> Result
  Safety --> Result

  Result -->|Valid and evidence-backed| Plan[Explainable BOM and shopping plan<br/>with source and retrieval time]
  Result -->|Clarification needed| Ask[Ask focused question<br/>or retain unresolved requirement]
  Result -->|Safety block| Escalate[Stop actionable advice;<br/>offer safe alternative or qualified help]
  Result -->|Source or validation failure| Fail[Show unavailable state;<br/>do not mark plan verified]

  Plan --> UI
  Ask --> UI
  Escalate --> UI
  Fail --> UI
  Plan --> Saved[Saved project and offline checklist]
  Plan -->|Selected information only| Share[Export or retailer hand-off]
```

The model can suggest intent, requirements and catalogue identifiers, but cannot invent product names, variants, SKUs, prices or evidence. Deterministic code and approved sources govern quantities, compatibility, totals, safety gates and external actions. Every displayed exact variant, price, availability claim or store placement needs its applicable source and retrieval time; mock data must be identified as mock.

## Safety and validation decisions

```mermaid
flowchart TD
  Request[Project request or changed input] --> Scope{Supported, bounded project?}
  Scope -->|No: high-risk or excluded trade| Referral[Do not provide actionable instructions;<br/>refer to qualified professional]
  Scope -->|Yes| Facts{Critical facts confirmed?}
  Facts -->|No| Clarify[Ask up to 3 relevant questions;<br/>allow skip and retain unknowns]
  Clarify --> Facts
  Facts -->|Mounting facts still unknown| MountBlock[No final fixing selection or drilling instructions;<br/>offer general planning or freestanding option]
  Facts -->|Yes| Sources{Required catalogue and manufacturer evidence available?}
  Sources -->|No or service failed| DataBlock[Show unavailable; do not advance to verified]
  Sources -->|Yes| Check[Validate dimensions, material, system,<br/>pack quantity and approved combinations]
  Check --> Compatible{Compatible and constraints satisfied?}
  Compatible -->|No or inconclusive| Stop[Block affected recommendation;<br/>show unresolved fact or safe alternative]
  Compatible -->|Yes| Guidance{Manufacturer warnings and stop conditions preserved?}
  Guidance -->|No| Stop
  Guidance -->|Yes| Approved[Show sourced plan and applicable guidance]

  Change[Material, dimensions, load or product changes] --> Invalidate[Invalidate affected decisions]
  Invalidate --> Request
  Photo[Photo or detector observation] -. Cannot certify wall type,<br/>load capacity, hidden services<br/>or drilling clearance .-> Facts
```

Unknown or inconclusive evidence is a stop, not permission to proceed. A detector's negative result is not clearance to drill; shelf capacity must not be derived by adding nominal anchor ratings. Manufacturer warnings cannot be weakened by generated text, and qualified reviewers must approve mounting templates and release-blocking safety tests.

## MVP boundary and release priorities

```mermaid
flowchart LR
  subgraph MVP["MVP — P0"]
    Core[Responsive web app; no account;<br/>one pilot or clearly fictional store]
    Projects[Create, save, resume and delete projects;<br/>5–10 reviewed templates, starting with freestanding furniture]
    Locale[German UI, English optional;<br/>metric units and EUR]
    Inputs[Text, role-labelled photos, barcode/model number,<br/>manual measurements and owned items]
    Questions[Dependency-aware clarification;<br/>up to 3 optional questions at a time]
    BOM[Materials, consumables, tools and PPE;<br/>quantities, basis, dependencies and unresolved facts]
    Products[Exact catalogue variants;<br/>compatibility checks and feasible alternatives]
    Sourcing[Postcode or optional device location;<br/>only sourced, timestamped price/availability]
    Safety[Safety stops, professional hand-off<br/>and reviewed assembly references]
    Checklist[Offline checklist, check-off,<br/>export and selected-information sharing]
    Core --> Projects --> Inputs --> Questions --> BOM --> Products
    Core --> Locale
    Products --> Sourcing --> Checklist
    Safety --> Questions
    Safety --> BOM
  end

  subgraph Pilot["Pilot extension — P1"]
    Placement[Verified branch-specific aisle/zone/rack placement]
    Scan[Barcode scan and variant mismatch revalidation]
    Progress[Assembly progress and deviation tracking]
    Reservation[Approved reservation integration;<br/>explicit action and duplicate protection]
    Associate[User-selected summary for store associate]
  end

  subgraph Later["Later — P2 or dependent on access"]
    Multi[Cross-retailer basket optimisation]
    Voice[Voice interaction or conceptual room visualisation]
    Live[Broader live retailer feeds and multiple-store comparison]
    Native[Native iOS/Android applications]
  end

  MVP -. Subject to evidence, review and authorised integrations .-> Pilot
  Pilot -. Future expansion .-> Later
```

Payment, automatic checkout, autonomous reservation, unapproved substitutions, guaranteed real-time retailer data, structural engineering, high-risk trades, precise AR installation and indoor blue-dot navigation are not MVP capabilities. Store placement is shown only when verified for the selected branch and map revision; otherwise use an honest fallback.
