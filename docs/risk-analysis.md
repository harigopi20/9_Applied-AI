# Risk analysis: Baumarkt Buddy

*MBA Applied AI group project · as of 2 November 2026*

> **What this is:** a list of what could go wrong with Baumarkt Buddy, how likely and how serious each risk is, and what we do about it. It covers the prototype as built (Release 1) and a possible real pilot with a DIY retailer.
> **Not legal advice:** the legal points are a summary of public sources and would need a lawyer's review before a real launch.

## 1. Method

1. **Identify** risks in five categories: safety, AI, data quality, legal, business.
2. **Rate** each risk:
   - **Likelihood:** Low (unlikely) · Medium (could happen) · High (expected to happen)
   - **Impact:** Low (annoying) · Medium (wrong result, customer loses time or money) · High (injury, legal claim or project failure)
3. **Place** each risk in the risk matrix (section 3). Top right = most urgent.
4. **Respond** with a countermeasure and its status:
   ✅ built and tested · ⚠️ partly done · 📋 planned · ❓ open decision

Ratings are the **remaining risk with the countermeasures that exist today**. Requirement IDs (SR-, NFR-) refer to `requirements/requirements-R1-MVP.md`; the README links each one to its code and tests.

## 2. Risk register

### Safety

| # | Risk | Likelihood | Impact | Countermeasure | Status |
|---|---|---|---|---|---|
| S1 | The app recommends a fixing that cannot hold the load → shelf or cabinet falls, someone is injured | Low | High | Only catalogue products with a load rating; every load-bearing part must carry the whole load × safety factor (e.g. 1.25); ratings are never added up (SR-04); stop if no part fits | ✅ |
| S2 | The customer drills into a hidden cable or pipe | Medium | High | Notice on every wall list that detectors have limits and "nothing found" is not clearance to drill (SR-05); advice to plan holes away from sockets and switches | ✅ |
| S3 | The customer gives a wrong answer (e.g. wrong wall type or weight) | Medium | High | Every value must be confirmed; "I don't know" stops instead of guessing (SR-01, SR-06); unknown weight = worst case; help on how to find out | ✅ |
| S4 | The app plans dangerous work (electrics, gas, load-bearing walls, hidden pipes) | Low | High | High-risk filter runs first and refuses with a hand-off to a professional, also for voice input (SR-09) | ✅ |
| S5 | A stop screen gives a wrong or confusing reason, so the customer works around it | Medium | Medium | Found in our own test: wrong reason for an 80 × 20 cm shelf (issue #112), wrong help text for unknown depth (#106) | ⚠️ |

### AI

| # | Risk | Likelihood | Impact | Countermeasure | Status |
|---|---|---|---|---|---|
| A1 | The AI invents a product, price or safety statement ("hallucination") | Low *(High if the AI decided)* | High | The AI may only *understand* the customer's text. Products, quantities and safety decisions come from fixed, tested rules; the output is checked before display (SR-16). The demo uses keyword matching; the AI connection is built but switched off | ✅ |
| A2 | A customer tries to trick the app ("ignore your safety rules") | Medium | High | Safety rules are code, not AI text, so they cannot be talked around; generated text cannot weaken manufacturer warnings (SR-07); input is treated as text only (NFR-07) | ✅ |
| A3 | The app misunderstands the text (e.g. "-5 kg" read as 5 kg) | Medium | Low | Every recognised value is only a guess until the customer confirms it; open issues #104, #105 | ⚠️ |
| A4 | Customers trust the app too much ("the app said it is fine") | Medium | High | Clear notices: sample data, estimates labelled, "we cannot see or test your wall" (SR-02); evidence log "Why these products?" | ✅ |

### Data quality

| # | Risk | Likelihood | Impact | Countermeasure | Status |
|---|---|---|---|---|---|
| D1 | Wrong or missing catalogue data → wrong list or no total | High | Medium | Automated tests against the real data files; our exploratory test found gaps that are tracked: plasterboard drill bit (#113), sliding-door fixings (#102) | ⚠️ |
| D2 | Invented load ratings are mistaken for real manufacturer values | Medium | High | Generic products without brands; "Sample data" labels on prices, stock and stores; real pilot needs manufacturer-checked ratings | ⚠️ |
| D3 | Project templates contain a mistake (limits, questions, quantities) | Medium | High | Every template has a review status (SR-10). All 9 templates are still `pending_team_review`; the label was removed from the project tiles (#111 closed) but the review itself is still open | ⚠️ |

### Legal

| # | Risk | Likelihood | Impact | Countermeasure | Status |
|---|---|---|---|---|---|
| L1 | Product liability if someone is injured after following the app | Low | High | Stops and hand-offs for risky work, notices, no drilling advice when facts are missing. The new EU Product Liability Directive treats **software, including AI**, as a product (to be applied from 9 December 2026), so a real launch needs legal review and insurance | ⚠️ |
| L2 | Privacy (GDPR): personal data or voice recordings | Low | Medium | No login, nothing stored, postcode used only on the device; voice input only after consent, the browser's speech service is named; no audio stored (NFR-04) | ✅ |
| L3 | EU AI Act transparency: users must know they are dealing with AI | Low | Medium | The start screen says how the text is understood (keyword matching or AI) and that rules decide (NFR-05). Article 50 duties apply since 2 August 2026; a shopping assistant is not "high-risk AI" in our assessment | ✅ |
| L4 | Trademark / impersonation: real OBI store names and addresses are used | Medium | Medium | Products are generic; the team must decide: fictional store names, or a clear note "real places used only as sample geography – no connection to OBI" | ❓ |

### Business

| # | Risk | Likelihood | Impact | Countermeasure | Status |
|---|---|---|---|---|---|
| B1 | Large chains build their own AI assistant (as Home Depot and Lowe's did) and do not buy ours | High | High | Target mid-sized chains without a big AI budget; differentiate on safety checks (see [competitor analysis](competitor-analysis.md)) | 📋 |
| B2 | No access to real retailer data (prices, stock, aisles) | High | High | Pilot with one retailer using an official data connection; the catalogue format is already retailer-independent | 📋 |
| B3 | Customers do not use or trust the app | Medium | High | Usability tests (goal: list in under 2 minutes, NFR-12); explanations why each product was chosen | 📋 |
| B4 | Costs of the AI model when switched on | Medium | Medium | Keyword mode is free; AI runs through a proxy with rate limits (NFR-06); AI is optional | ✅ |

## 3. Risk matrix

Remaining risk after the current countermeasures.

| Likelihood ↓ / Impact → | Low | Medium | High |
|---|---|---|---|
| **High** | | D1 | **B1, B2** |
| **Medium** | A3 | S5, L4, B4 | **S2, S3, A2, A4, D2, D3, B3** |
| **Low** | | L2, L3 | S1, S4, A1, L1 |

**How to read it:**
- **Business risks (B1, B2) are the biggest.** The idea works technically, but market access and real data are the hard part.
- **Safety and AI risks have high impact but mostly low or medium likelihood**, because the strongest countermeasures are built in: rules decide, the AI only understands, and the app stops instead of guessing.
- **Data quality (D1) is likely**, but our own testing finds the gaps and turns them into tracked issues.

## 4. Top risks and next steps

| Priority | Risk | Next step | Owner (suggested) |
|---|---|---|---|
| 1 | B1, B2 – market and data access | Define a pilot offer for one mid-sized chain; list the data fields we need | Business & design |
| 2 | D3 – templates not reviewed | Team review of all 9 templates, then set `reviewed_by` and `review_date` | Quality & responsible AI |
| 3 | D1, D2 – catalogue gaps | Fix #113 and #102; keep "Sample data" labels | Data & research |
| 4 | S5 – confusing stop reasons | Fix #112 and #106 | App builder |
| 5 | L4 – OBI names | Team decision: fictional names or a clear note | Project lead |

## 5. Sources

- [EU AI Act Article 50 transparency obligations go live (Baker Botts, Sept 2026)](https://www.bakerbotts.com/thought-leadership/publications/2026/september/eu-ai-act-article-50-transparency-obligations-go-live)
- [What will change with the new EU Product Liability Directive 2024/2853 (BUSE)](https://buse.de/en/blog-en/commercial-en/what-will-change-with-the-new-eu-product-liability-directive-eu-2024-2853/)
- Project requirements: `requirements/requirements-R1-MVP.md`; requirement → code → test table in `README.md`
- Exploratory app test, 31 Oct 2026 – GitHub issues #101–#113
- [Competitor analysis](competitor-analysis.md)
