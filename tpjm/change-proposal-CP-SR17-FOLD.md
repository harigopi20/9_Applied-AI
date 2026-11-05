# Baumarkt-Buddy – Change Proposal CP-SR17-FOLD: "Keep the right tool" hint in a folded section

5 Nov 2026 · Product owner request · **Status: built in the released app – needs a team decision on SR-17**

Branch `claude/owned-section-collapse` (follow-up to issue #145).

## Problem

After "Have it all" every tool stayed on the list as its own card with the SR-17 hint
"Keep the right tool and gear to ensure safety." and a "Buy after all" button – the list
stayed almost as long as before.

## What the app does now

| Part | Change | Safety rules changed? |
| --- | --- | --- |
| Folded section | Tools / Safety gear with every part marked "I already have this" (from 2 parts) show one green line "All in hand – n parts, not counted" and "Show items ▾" under the heading | No |
| Items and subtotal | Hidden while folded; "Show items" shows them again with "Buy after all" | No |
| **SR-17 hint** | Shown only when the items are shown, not in the folded line (product owner decision 5 Nov 2026: list as compact as possible) | **Yes – to decide** |

## What the team decides

| No. | Question | Proposal | Risk |
| --- | --- | --- | --- |
| F-1 | May the SR-17 hint be hidden while a fully owned section is folded? | Yes, as built: hint with the items after "Show items". | The customer may not see the reminder to use the right tool and gear. Tools and safety gear carry no load (SR-15 is not touched). |

If F-1 is rejected: add one short line "Use the right tool and gear" under the green line (small change in `viewOwnedSummary`, `app/app.js`).

## Requirements to update after the decision

- SR-17: "… shows the hint – for a fully owned tools / safety-gear section when its items are shown."
- Test case: automated test `#145 fold (UI)` in `app/tests.js`.
