# Baumarkt-Buddy – Change Proposal CP-D14-W: weighed weight for a wall cabinet

4 Nov 2026 · Hariram Gopalakrishnan · **Status: proposal – needs a team decision**

Built in the preview only (`?preview=d13`, branch `claude/cabinet-live-weight-check`, not pushed).

## Problem

A wall cabinet's weight is estimated from its size (panel area × 11 kg/m², sheet *System ratings*).
The strongest plug must carry 1.5 × that weight ("Min. plug factor"). On weak walls this blocks
most cabinets. Example from testing: 70 × 40 × 90 cm on perforated brick → estimate 32 kg →
the plug must carry 48 kg, but the wall takes max. 35 kg → stop.

The old stop screen also read as if the cabinet weighed 48 kg, and it came only after *Continue*.

## What the preview does now

| Part | Change | Safety rules changed? |
| --- | --- | --- |
| Clear stop text | "Your cabinet weighs about 32 kg. For safety, the wall fixing must hold 1.5 × that = 48 kg, but this wall holds max. 35 kg (strongest plug)." | No |
| Check while typing | The size is checked as soon as all fields are filled; the notice is on the size page | No |
| Sizes that fit | Buttons with the largest height, width or depth (others unchanged) that fits, e.g. *Height 56 cm · Width 45 cm · Depth 21 cm* | No |
| Max. beside the field | "max. 40 cm" to the right of *Depth*, "max. 120 cm" to the right of *Width* | No |
| **Weighed weight** | Only when the estimate blocks: "I'll weigh my cabinet" → the customer enters the weight (bathroom-scale tip). Up to the heaviest cabinet the wall takes (strongest plug ÷ 1.5, here 23 kg) → plug options, contents = plug max. − weighed weight. Above → stop. | **Yes – to decide** |

## What the team decides

| No. | Question | Proposal | Risk |
| --- | --- | --- | --- |
| W-1 | May a weighed weight replace the estimate from the size? | Yes, only when the estimate blocks, and only up to strongest plug ÷ 1.5. | Customer may weigh wrongly or guess. The 1.5 factor and the safety factor 1.25 stay. |
| W-2 | Is the weighed weight recorded? | Yes: on the summary ("weighed by you; estimate 32 kg"), as a note on the list and in the evidence log (fact:customer). | None. |
| W-3 | Number field or tick box? | Number field – it gives the allowed contents and a concrete value for staff. | None. |

If W-1 is rejected, remove the weigh option; the other parts stay.

## Requirements to update after the decision

- D-14 cabinet weight rule (R-20): add the weighed weight as an input when the estimate blocks.
- Test cases: weighed weight at the max. → plugs; above → stop (automated test `D-14 / CP-D14-W` in `app/tests.js`).
