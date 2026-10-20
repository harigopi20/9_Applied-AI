# Baumarkt Buddy Product Requirements

**Purpose:** Consolidated product and delivery specification for the Baumarkt Buddy, based on the supplied requirements specification and product research.  
**Version:** 1.0  
**Date:** 17 October 2026  
**Initial market:** Germany

The original Word document is included alongside this transcription as [`Test.docx`](Test.docx).

## 1. Product decision

Build a mobile-first project-completion assistant that converts a home-improvement goal into a reviewed, compatible shopping plan and supports the user through shopping and assembly. The app combines text and optional photos, user-confirmed measurements, items the user already owns, a structured bill of materials, product matching and store guidance.

The product must be explicit about uncertainty. Photos can suggest candidate objects or labels, but cannot establish exact dimensions, wall substrate, hidden services or safe load capacity. Recommendations must distinguish user-confirmed facts, manufacturer-supported facts, estimates and unresolved questions.

The initial product should focus on bounded indoor shelf and furniture projects. Wall mounting is gated: if required substrate, load, bracket or manufacturer information is missing, the app must withhold actionable fixing recommendations and drilling instructions, while offering general planning, a freestanding alternative or professional/store-associate help.

## 2. Users and needs

| User | Need | Release priority |
|---|---|---|
| DIY beginner or renter | A clear plan, shopping list and guidance without needing product vocabulary; help identifying missing facts and permission constraints | Primary |
| Occasional DIY homeowner | Compatibility checks, quantity checks and reuse of suitable tools/materials already owned | Primary |
| Multilingual shopper | German and English guidance with local product terminology and metric units | Primary |
| Experienced DIYer | Fast product and store discovery, alternatives and project continuity | Secondary |
| Store associate | An explainable project summary to help advise a customer | Later pilot capability |

## 3. MVP scope

### Included

- Responsive mobile web app/PWA, usable in a store aisle without an account.
- One pilot store or a fictional store with clearly labelled mock data.
- Five to ten curated project templates, beginning with freestanding shelf/furniture assembly and explicitly bounded shelf-mounting planning.
- Project entry by free text, separate role-labelled photos, barcode/model number, and manual measurements.
- German UI, with English optional; metric units and EUR price presentation.
- Up to three optional clarifying questions, prioritised by project dependencies and safety relevance.
- Structured material, consumable, tool and PPE list with quantities, calculation basis, dependencies and unresolved requirements.
- Owned-item inventory; only confirmed suitable items reduce purchase quantities.
- Exact catalogue product matching and compatible alternatives from an approved catalogue.
- Store discovery by postcode or optional device location; location denial must not block the app.
- Availability and placement only when a verified, authorised source exists; show source and timestamp.
- Save, resume, delete, export and use the checklist offline; clearly mark stale or unavailable data.
- Retailer hand-off links; no implication that an item was reserved or purchased unless confirmed by the retailer.
- Manufacturer-grounded assembly references and stop conditions for supported projects.

### Excluded from MVP

- Payment, automatic checkout, autonomous reservation or unapproved substitutions.
- Structural engineering or load-bearing building alterations; gas work; mains electrical installation; concealed plumbing repair; roof work; other high-risk trades.
- Automated drilling-site clearance, guaranteed wall identification, exact image-derived measurements or guaranteed product safety.
- General-purpose CAD, precise AR installation or indoor blue-dot navigation.
- Native iOS/Android apps, multiple-store comparison and universal real-time retailer data.

## 4. Functional requirements

Priorities: P0 is mandatory for MVP; P1 is pilot extension; P2 is later. The initial six must-have stories from the source specification are incorporated into the safer, evidence-based requirements below.

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-01 | P0 | Create, save, resume and delete a project | Returning user resumes the last confirmed state; deletion status is reported. |
| FR-02 | P0 | Accept a free-text project description and multiple role-labelled photos | Photo role is explicit (reference, room/installation area, owned item); reference and room photos are not silently treated as the same scene. |
| FR-03 | P0 | Classify project intent and extract candidate objects/visible labels | At least 8 of 10 supported intent prompts are correctly classified in the project benchmark; observations retain source, uncertainty and confirmation status. |
| FR-04 | P0 | Capture measurements, units, constraints and owned items | Critical dimensions and load are user-confirmed; unit conflicts block product matching; uncertain owned items are not treated as suitable. |
| FR-05 | P0 | Ask dependency-aware follow-up questions | Ask no more than three at a time; allow skips; missing safety-critical substrate/load facts block final fixing selection. |
| FR-06 | P0 | Generate a structured bill of materials (BOM) | Separate materials, consumables, tools and PPE; show role, specification, quantity basis and dependencies; derive quantities from confirmed dimensions; target under 5 seconds for a bounded plan. |
| FR-07 | P0 | Reconcile suitable owned items against the BOM | Deduct only confirmed suitable quantities; mark unknown/uncertain items for identification. |
| FR-08 | P0 | Match exact catalogue products and variants | Each recommended item maps to a catalogue record and identifiable variant; the model cannot invent product names, SKUs or prices. |
| FR-09 | P0 | Validate product and component compatibility | Check relevant dimensions, material, system, pack quantity and manufacturer-supported constraints; retain evidence for each check. |
| FR-10 | P0 | Explain recommendations and unresolved facts | User can see why an item fits, which facts support it and what remains unverified. |
| FR-11 | P0 | Show price, availability and store information | Display price, tax/pack basis, stock status, source and retrieval time; unknown, stale and out-of-stock are distinct. Mock values are labelled as mock. |
| FR-12 | P0 | Offer feasible basket options and alternatives | Where supported catalogue alternatives exist, show compatible lower-cost or premium choices; enforce hard constraints and update totals immediately. |
| FR-13 | P0 | Support store search and retailer hand-off | Postcode works if location permission is denied; retailer hand-off does not imply reservation or purchase. |
| FR-14 | P0 | Provide an offline project checklist | A saved list remains readable without network; stock claims are marked stale/unavailable. |
| FR-15 | P0 | Present safety stops and escalation | Model wording cannot dismiss a safety block; offer a store-associate or professional hand-off where appropriate. |
| FR-16 | P0 | Link assembly steps to reviewed sources | Applicable product/manual revision is identifiable; manufacturer warnings and stop conditions are preserved. |
| FR-17 | P0 | Export and share a project summary | User receives a readable export; sharing includes only selected information. |
| FR-18 | P1 | Show verified aisle/zone/rack locations | Location matches selected branch and map revision; otherwise show an honest fallback. |
| FR-19 | P1 | Scan products during shopping | A different size or variant triggers mismatch detection and revalidation. |
| FR-20 | P1 | Track assembly and deviations | A changed component invalidates affected downstream steps. |
| FR-21 | P1 | Support an approved reservation integration | Exact action is approved; retries cannot create duplicate external actions. |
| FR-22 | P1 | Share a summary with a store associate | Only user-selected project information is shared. |
| FR-23 | P2 | Optimise baskets across retailers | Hard compatibility constraints remain enforced across split baskets. |
| FR-24 | P2 | Add voice interaction or room visualisation | Visualisation is labelled conceptual and cannot override measured dimensions. |

## 5. User workflow and project states

1. Create a project with text, photos, constraints and budget.
2. Review candidate observations and confirm measurements and owned items.
3. Answer the most relevant questions; stop or escalate if critical facts are missing.
4. Review the dependency-linked BOM and quantity basis.
5. Validate owned items, exact catalogue variants and compatible combinations.
6. Compare feasible basket options and select a store/fulfilment path.
7. Review timestamped availability and verified store placement, where available.
8. Shop using a saved checklist; scan/revalidate substitutions when supported.
9. Follow manufacturer-grounded assembly steps with checkpoints; record completion or an unresolved issue.

**Project states:** Draft → Needs clarification → Specification confirmed → BOM reviewed → Products validated → Shopping plan approved → Acquiring → Items verified → Ready for assembly → In progress → Completed.

Additional states: Safety blocked, Data unavailable, Professional review required and Cancelled. A failed service call cannot advance a project to “verified.” Material changes invalidate affected decisions.

## 6. Safety requirements

| ID | Control |
|---|---|
| SR-01 | Separate visual guesses from user-confirmed facts and manufacturer-supported specifications. |
| SR-02 | Never certify wall type, allowable load, concealed services or safe drilling locations from photos. A detector’s negative result is not clearance to drill. |
| SR-03 | Require confirmed substrate, fixing system, bracket geometry, intended loading and applicable installation conditions before a final mounting recommendation. |
| SR-04 | Do not calculate shelf capacity by adding nominal anchor ratings; rely on applicable system evidence or refer to a qualified person. |
| SR-05 | Describe detector capabilities and limitations for relevant hazards; do not imply every detector finds every pipe, especially plastic pipes. |
| SR-06 | Inconclusive or missing evidence triggers a stop, not permission to proceed. |
| SR-07 | Preserve manufacturer warnings, installation conditions and approved combinations; generated text cannot weaken them. |
| SR-08 | Re-run safety and compatibility checks after changes to material, dimensions, load or product. |
| SR-09 | Exclude high-risk work from the supported flow and provide an appropriate professional hand-off. |
| SR-10 | Qualified reviewers approve project templates and release-blocking test cases before public mounting guidance. |

## 7. Non-functional requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Usability | Mobile-first; core flow completable in under two minutes in usability testing without instructions. |
| NFR-02 | Performance | Catalogue lookup under one second; bounded MVP list generation under five seconds as an initial target. For a multi-step pilot plan, show progress and target under 60 seconds at p95 when dependencies respond. |
| NFR-03 | Reliability | If the model fails, offer predefined project templates; recover partial state. Do not proceed when a required validation service fails. |
| NFR-04 | Privacy | GDPR principles; no mandatory login; minimise personal data sent to model providers; document retention, deletion and vendor handling. |
| NFR-05 | Transparency | Label AI-generated guidance; distinguish estimates, confirmed facts and verified specifications. Quantities are estimates unless validated. |
| NFR-06 | Security | Encryption, least privilege, upload scanning, tenant isolation, rate limits and redacted logs; restrict tools and outbound domains. |
| NFR-07 | Untrusted input | Treat retailer pages, uploaded images, OCR text and manuals as data, never as instructions to the system. |
| NFR-08 | Accessibility | Accessible contrast, scalable text, screen-reader labels and a non-map shopping route. |
| NFR-09 | Language | German and English; metric consistency and dimensional calculations tested in both. |
| NFR-10 | Maintainability | Catalogue and project-template data separate from code and replaceable by authorised APIs/feeds. |
| NFR-11 | Observability | Track unsupported requests, escalations, incidents, source failures, latency and cost per completed project. |

## 8. Data and integration requirements

| Data/interface | Prototype | Production direction |
|---|---|---|
| Product catalogue | Curated mock JSON/CSV, approximately 150–300 products across 5–10 project types | Authorised retailer PIM/product API or licensed feed |
| Stock and price | Static, clearly labelled mock values | Timestamped merchandising/inventory source; agree freshness policy per source |
| Store layout | One store with aisle/zone values only if verified | Authorised branch-specific planogram/placement source |
| Project templates | 5–10 reviewed templates with explicit quantity rules | Curated library maintained with category and qualified safety reviewers |
| Model | Commercial multimodal model for bounded intent/extraction and clarification | Retrieval over approved catalogue/manual sources; schema-validated outputs |
| Sharing | Link or PDF export | Retailer hand-off; reservation/cart only after authorised integration and explicit approval |
| Evidence registry | Source and retrieval time for curated records | Version, retrieval time, licence/access terms and derived-claim lineage |

**Core data entities:** Project, Observation, Measurement, OwnedItem, Requirement, BOMLine, ProductVariant, Offer, StockObservation, StoreLocation, ProductPlacement, Basket, AssemblyStep, Approval and EvidenceRecord. Unknown is a valid value. Store placement must include branch, map revision and verification time. Stock freshness limits must be agreed with each source; there is no universal interval that guarantees inventory accuracy.

**Key design rule:** The model may propose intent and candidate requirements, but deterministic code and approved evidence govern quantities, compatibility, totals, safety gates and external actions. It only selects products that exist in the catalogue.

## 9. Market and competitor research implications

The research finds an active market rather than an uncontested idea. Official retailer apps already advertise product finding, shopping lists, availability and aisle/location capabilities; photo-to-project services also advertise project plans and material lists. Home Depot’s 2026 announcement describes a broad image/text/voice and store-location experience in the US. These are public capability descriptions, not independent performance tests.

Therefore, do not position the app as the first AI DIY assistant or claim that store navigation alone is differentiated. The proposed differentiation to validate is a traceable compatibility graph, reconciliation of items already owned, explicit uncertainty, branch-specific data provenance, substitution revalidation and continuity from planning through assembly. German localisation and retailer portability are hypotheses, not proven advantages.

The research cites BHB’s 2025 German DIY market figures but cautions that hardware turnover is not software TAM and that market size does not prove willingness to pay. Potential business models include a retailer-backed pilot, per-project fee, subscription, disclosed affiliate revenue or associate-assistance licence. All require validation. Retailer data access, commercial agreements, API access and map licences have not been established.

## 10. Success measures and release gates

### MVP and pilot metrics

| Metric | Measurement |
|---|---|
| BOM completeness | Share of expert-defined needed items suggested on supported projects; proposed pilot target ≥90%. |
| Exact variant precision | Correct exact product/variant retrieval on curated benchmark; proposed target ≥95%. |
| Provenance | 100% of displayed exact variants, prices, availability and placements have a source and retrieval time. |
| Safety regression | Zero severe unsafe recommendations in the release-blocking safety suite; passing tests is not proof of real-world safety. |
| Task completion | Time from project idea to usable list; prototype target under two minutes for the basic flow. |
| User satisfaction | SUS or 1–5 usefulness rating; initial target to be set before user testing. |
| Business outcomes | Separately measure completed project baskets, avoidable extra trips, returns, associate time and satisfaction; do not infer outcomes from market size. |
| Operations | Latency, abandonment, clarification burden, substitutions, source accuracy, incident reports, model/tool cost and expert-review time. |

Compare supported-project users with a baseline of shopping independently using existing retailer tools. Report sample size and confidence intervals, especially for rare safety events. Track the components of the primary outcome separately; no reported safety incident is not proof of safety.

### Release-blocking cases

- Unknown wall substrate blocks final anchor selection.
- Photo without scale does not produce exact dimensions.
- Similar-looking but wrong screw/variant is detected or remains unresolved.
- Increased intended load invalidates affected fixing decisions.
- Stale stock is labelled stale and offers a verification path.
- Missing map data never produces a fabricated aisle.
- Detector limits do not create false clearance for drilling.
- Manufacturer manual wins if it conflicts with generated text.
- Malicious instructions embedded in product data are ignored as instructions.
- Retried checkout/reservation action cannot create duplicates.
- Denied location permission leaves postcode search available.
- Network loss leaves saved checklist readable and removes live-stock certainty.
- Ambiguous pack quantity prevents a misleading basket total.
- A changed product during shopping triggers revalidation of affected assembly steps.

## 11. Roadmap and immediate decisions

| Phase | Indicative timing | Deliverables and exit gate |
|---|---|---|
| 0. Problem and data access | Weeks 1–3 | 15–20 user interviews, 3–5 retailer/associate interviews, observed shopping journeys, hazard inventory and a credible legal data path. |
| 1. Concierge prototype | Weeks 4–6 | Clickable app, manually reviewed shelf plans, curated products and benchmark cases; users understand uncertainty and no unsafe flow remains unresolved. |
| 2. Bounded MVP | Weeks 7–12 | Project state, photo intake, clarification, inventory, BOM, evidence-backed matching, store discovery and export; end-to-end tests pass. |
| 3. Controlled pilot | Weeks 13–18 | One region/store, approximately 50–100 consented projects, associate fallback and supported-store data; demonstrate useful outcomes and acceptable cost. |
| 4. Operational hardening | Months 5–6 | Barcode verification, approved aisle data, caching, monitoring and privacy review; show stable source updates and advantage over baseline. |
| 5. Expansion | Months 7–12 | Additional categories/retailers, richer basket planning and optional native app/voice, subject to evidence of viable economics. |

Request sample catalogue, stock and placement data during phase 0; do not promise navigation before access is proven. If no partner is available, retain planning and retailer hand-off and describe navigation as a future dependency.

### Decisions to resolve

- Is the deliverable an academic prototype, founder MVP or retailer proposal?
- Which city/region and initial language(s) will the pilot serve?
- Which 5–10 project types are supported, and is a freestanding shelf/furniture launch acceptable before broader mounting guidance?
- Is there an existing retailer or independent-store contact and a lawful data-access path?
- What team, budget and demonstration date are available?
- Is retailer hand-off sufficient, or is approved reservation integration required?
- What KPI targets, test-user count and test dates will be committed to?
- Which team members own product stories, research and business case?

## 12. Delivery approach

Use the specification as shared context for each implementation iteration. Build one requirement at a time, link code changes to requirement IDs, and turn acceptance criteria into manual or automated checks. Maintain an iteration log of prompt, result, problems and fixes. Human reviewers check security, data handling, catalogue accuracy and safety-sensitive content before each demo. Use deterministic functions for calculations, compatibility and policy gates; do not add agent components unless they solve a tested need.

## 13. Research qualifications

The accompanying research is a public-source review, not a hands-on competitor benchmark. Vendor capabilities are described as advertised unless independently verified. Proposed targets, costs, timelines and commercial scenarios are planning assumptions. No retailer API, inventory feed, commercial agreement or map licence is established. Confirm the intended retailer if “Tool” in the original brief meant a business other than toom. Legal applicability, data protection roles, product-advice liability, licensing, insurance and retailer terms require review for the final deployment.
