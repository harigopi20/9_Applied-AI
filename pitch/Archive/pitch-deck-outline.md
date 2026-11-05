# Baumarkt-Buddy — pitch deck outline

**Working title:** Baumarkt-Buddy  
**One-line pitch:** Turn a home-project idea into a checked shopping list with quantities and store locations.  
**Audience:** Potential DIY-retail partner / course evaluation  
**Status:** Project pitch outline, not a record of validated customer or business results.

## Slide 1 — From project idea to ready-to-shop

**On the slide**

- Baumarkt-Buddy
- AI project and shopping assistant for DIY-store customers
- From “What do I need?” to “Here is what to buy and where to find it.”

**Speaker note:** We are building a mobile-first prototype for people who want to complete a small home or garden project but are unsure which materials and tools they need.

## Slide 2 — The problem in the aisle

**On the slide**

- Project plans do not translate easily into product names and quantities.
- Customers may forget essentials, buy incompatible items or spend time searching.
- Beginners need practical guidance; store staff have limited time for every project.

**Speaker note:** These are the problems our product hypothesis addresses. We will test their priority and frequency with customer and staff interviews rather than present them as measured findings.

## Slide 3 — The solution

**On the slide**

1. Choose a store and describe a project in everyday language.
2. Answer a few short questions about dimensions or materials.
3. Review a categorized shopping list with estimated quantities.
4. Compare alternatives and shop by aisle.

**Speaker note:** The intended core flow is designed for a phone in the store and should take less than two minutes. The prototype uses one fictional store and sample data.

## Slide 4 — How it works, with guardrails

**On the slide**

- A planning assistant uses the project details, catalogue and safety rules.
- The application validates product references and response structure before display.
- Product names and prices come from the catalogue, not model invention.
- Risky work (electrical, gas or load-bearing) gets a professional referral.

**Speaker note:** AI-generated quantities are estimates and must be labeled as such. If required details are missing, the experience asks a follow-up question instead of guessing. See the [architecture diagram](../diagrams/baumarkt-buddy-diagrams.md#prototype-architecture-and-safety-boundary).

## Slide 5 — Value to customers and retailers

**On the slide**

| For customers | Potential value for a retailer |
| --- | --- |
| More confidence before starting | A guided digital service in the aisle |
| Fewer forgotten items and easier product discovery | More complete baskets (hypothesis to measure) |
| Less time spent searching for products | Potentially fewer avoidable questions and returns (hypothesis to measure) |

**Speaker note:** Retailer benefits are hypotheses, not measured outcomes. A pilot would need to compare user behavior and operational results against a baseline.

## Slide 6 — Prototype and proof plan

**On the slide**

- One fictional store, mock prices and aisle positions
- Limited sample catalogue; no live availability
- MVP focuses on project intake, follow-up questions, lists, alternatives and session sharing
- Proposed evaluation: expert-checked list completeness, task time and user feedback

**Speaker note:** The requirements use example targets such as at least 90% list completeness and under two minutes to complete the task. These targets still need team agreement and must not be presented as achieved results.

## Slide 7 — Business model and next step

**On the slide**

- **Business-model hypothesis:** retailer-funded pilot, with a possible per-store or annual software fee if value is demonstrated.
- Start with one store and a small set of project categories.
- Validate customer usefulness, catalogue quality, safety handling and operational fit.
- **Ask:** a retail partner to review the concept and explore a limited pilot using approved catalogue and store-layout data.

**Speaker note:** Pricing, willingness to pay and integration costs are unknown. The immediate ask is discovery and pilot scoping—not a claim that a commercial contract or partnership exists.

## Slide 8 — What success would look like

**On the slide**

- Customers can create a project list quickly and understand it.
- Suggested products and quantities pass expert review.
- Safety guardrails reliably redirect high-risk work.
- A retailer can see evidence to decide whether a broader pilot is worthwhile.

**Speaker note:** Measure list completeness against an expert reference list, task completion time and participant feedback. Treat sales lift, staff-time savings and returns reduction as future pilot measures.

## Short demo script (about 3 minutes)

1. **Set the context (20 sec):** “Imagine you want to hang a shelf but are unsure which fixings suit your wall.”
2. **Start a project (30 sec):** Enter a plain-language project request and choose the mock store.
3. **Clarify (30 sec):** Show how the app asks for a missing detail such as wall type rather than silently assuming it.
4. **Review the plan (50 sec):** Walk through materials, tools, estimated quantities, product locations and any available alternatives.
5. **Shop the list (25 sec):** Demonstrate checking off an item and sharing or exporting the list, if implemented.
6. **Show the safety boundary (25 sec):** Explain that hazardous or structural work should be referred to a qualified professional.
7. **Close (20 sec):** Be explicit that prices, stock and locations are mock data and invite feedback on a real pilot.

Only demonstrate screens and features that are implemented in the current build. If a step is not functional, describe it as planned rather than implying it is live.

## Facts to confirm before presenting

- The agreed final product name (the README uses Baumarkt-Buddy; the requirements use DIY Project Finder).
- Which project type and app flow are actually implemented for the demo.
- The agreed user-test sample, KPI targets and measured results, if any.
- Whether a retailer partner exists; do not imply one without confirmation.
- The prototype catalogue count and the accuracy of the current data.
