# Changelog – Baumarkt-Buddy

All notable changes to this project are documented here.
Entries are collected under "Unreleased" and grouped into a milestone
when they are released to `main`.

## Unreleased

## Milestone: Mounting logic D-13 / D-14 as the normal flow, used-parts check kept – 2026-11-05
Summary (same as the pull request):
- Shelf, wall cabinet and anti-tip use the new flow by default: wall → size → summary → plug "up to X kg" → confirm
- Preview bar removed; `?logic=old` still shows the previous flow; tests.html keeps the previous flow for its UI tests
- Shelf and cabinet ask the used-parts checklist again (C-7); a defect shows the warning and keeps used load-bearing parts on the list (ST-06)
- Picture, painting, wallpaper and all other app features unchanged; README updated; 131 tests passing, results saved

- **2026-11-05 – Mounting logic D-13 / D-14 is now the normal flow; used-parts checklist kept.**
  `app/preview-d13.js`: the new flow (wall → size → summary → plug "max. X kg" → confirm) is on by default for
  *Hang a shelf*, *Hang a wall cabinet* and *Anchor a shelf to the wall*; the orange preview bar is removed;
  `?logic=old` shows the previous flow; `tests.html` keeps the previous flow for its UI tests. The size screen of
  shelf and cabinet now asks the used-parts checklist from the project template (C-7), like the previous flow;
  a ticked defect shows the template warning (ST-06) and a used load-bearing part with a defect cannot be
  taken off the list. Everything else (store pills, "Have it all", folded sections, safety-notes box, evidence
  log) is unchanged. Comments in `app/app.js` and `app/config.js`, README updated. 131 tests passing.
  *Why:* the team wants the released app to use the new mounting logic, without losing the old-parts question.
  *Prompt (paraphrased):* "Apply the new mounting logic in the released app, but keep the question about using
  old parts; do it first in my fork, then tell me how to bring it to my colleague's repository."

## Milestone: Evidence log with info circle and open/close arrow (issue #151) – 2026-11-05
Summary (same as the pull request):
- "Why these products?" gets an info circle on the left and the arrow ▾/▴ on the right, like the other open/close sections
- "Evidence log" / "Nachweis-Protokoll" moves to a small second line; thin line above the section
- New test #151 (UI); 131 tests passing; test results saved; README updated

- **2026-11-05 – List: evidence log with info circle, two-line title and open/close arrow (issue #151, variant B).**
  `app/app.js` (`viewEvidence`): the title is now two texts – "Why these products?" and a small second line
  "Evidence log" (`evidence_sub`, EN/DE in `app/i18n.js`). `app/style.css`: the browser's hidden marker is
  replaced by "▾" (closed) / "▴" (open) on the right, a black "i" circle on the left and a thin line above;
  still a native `<details>` (keyboard and screen reader unchanged). New test `#151 (UI)` (131 tests, all
  green). Checked in the browser at 390 px, EN/DE. README updated.
  *Why:* without an arrow nobody saw that the section opens. *Prompt (paraphrased):* "Give 'Why these
  products?' an open arrow like the others – variant B with 'Evidence log' much smaller."

## Milestone: Shopping list – fold a fully owned tools / safety-gear section (issue #145 follow-up) – 2026-11-05
Summary (same as the pull request):
- Tools / Safety gear with every part marked "I already have this" fold to one green line "All in hand – n parts, not counted" with "Show items ▾" under the heading
- Items and the section subtotal hidden while folded; "Show items" shows them again; materials never fold
- SR-17 hint ("Keep the right tool …") only with the items – needs a team decision: `tpjm/change-proposal-CP-SR17-FOLD.md`
- New test #145 fold (UI); 130 tests passing; test results saved; README updated

- **2026-11-05 – Shopping list: a tools / safety-gear section you have completely folds to one line.**
  `app/app.js`: new `sectionAllOwned()` and `viewOwnedSummary()`. When every part of *Tools* or *Safety gear*
  is marked "I already have this" (from 2 parts, by "Have it all" or one by one), the section shows one green
  line "All in hand – n parts, not counted" and "Show items ▾" under the heading; items and the section
  subtotal are hidden. "Show items" shows them again (incl. "Buy after all"); the choice stays on re-renders
  and resets for a new project (`state.ownedOpen`). Materials never fold. **SR-17 deviation:** the hint
  "Keep the right tool and gear …" is shown only with the items, not in the folded line – team decision in
  `tpjm/change-proposal-CP-SR17-FOLD.md`. `app/i18n.js`: 3 texts EN/DE; `app/style.css`: summary styles.
  New test `#145 fold (UI)` (130 tests, all green). Checked in the browser at 390 px. README updated.
  *Why:* after "Have it all" the list stayed almost as long. *Prompt (paraphrased):* "When I press 'Have it
  all' for tools & safety gear the list should fold – more compact, without the names and the hint;
  'Show items' under the category" (hint only when opened, chosen by the user).

## Milestone: Shopping list safety notes in a box that closes on the first scroll (issue #144) – 2026-11-05
Summary (same as the pull request):
- All safety notes of the list (incl. the customer's own warnings) in one box "Safety notes (n)" at the top
- Open when the list appears; closes on the customer's first scroll without a jump; title, count and short labels stay visible
- Tap on the title opens/closes it; stays closed on re-renders; a new project shows it open again
- Saved list and shopping route unchanged (notes in full); new test #144 (UI); 129 tests passing; test results saved; README updated

- **2026-11-05 – Shopping list: safety notes in a box that closes on the first scroll (issue #144, variant A).**
  `app/app.js`: new `viewSafetyBox()` puts every safety note of the list (detector limits SR-05, wall not
  checked SR-02, worst-case weight, shelf boards, the customer's own warnings like ST-06 and project
  warnings) into one box "Safety notes (n)". It is open when the list appears; the customer's first scroll
  closes it (`watchFirstScroll`, 24 px threshold, scrolling done by the app does not count) and the content
  under the finger stays in place (no jump). Closed, the title, the count and short labels stay visible
  (e.g. "Detectors do not find everything · Wall not checked"); a tap opens/closes it (`aria-expanded`,
  44 px). It stays closed on re-renders and opens again for a new project (`state.safetyCollapsed`).
  The notes stay in the page; saved list and shopping route unchanged. `app/i18n.js`: title and 9 short
  labels EN/DE. `app/style.css`: box styles. New test `#144 (UI)` (129 tests, all green). Checked in the
  browser at 390 px with real scrolling. README updated.
  *Why:* the notes pushed the products far down the list. *Prompt (paraphrased):* "Implement variant A;
  the box closes on the first scroll, and the customer-specific warnings go inside it as well."

## Milestone: Store bar buttons as small pills ("Change store", "Enter postcode") – 2026-11-05
Summary (same as the pull request):
- "Change store" / "Markt ändern" and "Enter postcode" / "PLZ eingeben" in the store bar of the list are now the same small outline pill as "I already have this", on the right edge
- Touch target stays 44 px (NFR-08); 128 tests passing; test results saved; README updated
- Follow-up to PR #147 (these two commits were pushed after #147 was merged)

- **2026-11-05 – List: "Change store" as the same small pill, on the right.** `app/app.js`: the button
  in the store bar now uses `pillButton()`; `app/style.css`: `.store-bar .store-change { margin-left: auto; }`.
  The touch target stays 44 px. Checked in the browser at 420 and 360 px.
  *Why:* the big button looked out of place next to the new pills. *Prompt (paraphrased):* "Make the
  Change store pill the same size and align it to the right."
- **2026-11-05 – List without a store: "Enter postcode" as the same small pill, on the right.**
  `app/app.js`: the button `#add-plz` in the store bar uses `pillButton()` with the same class as
  "Change store". Checked in the browser at 360 px. *Why:* same look in both store-bar states.
  *Prompt (paraphrased):* "Yes, Enter postcode as a pill too."

## Milestone: Shopping list "Have it all" for Tools and Safety gear (issue #145) – 2026-11-05
Summary (same as the pull request):
- New button "Have it all" / "Hab ich alles" beside the headings Tools and Safety gear (from 2 parts that may be owned); turns into "Buy all after all" / "Doch alles kaufen"
- Same rule as the single "I already have this" (C-8 / SR-15); not for Materials – plugs and screws always stay on the list
- "Have it all" and "I already have this" are now small outline pills; touch target stays 44 px (NFR-08)
- New test #145 (UI); 128 tests passing; test results saved; README updated

- **2026-11-05 – Shopping list: "Have it all" for Tools and Safety gear (issue #145); small pill buttons.**
  `app/app.js`: new `sectionHead()` puts "Have it all" / "Hab ich alles" beside the headings *Tools* and
  *Safety gear* (only from 2 parts that may be owned). It marks every part the single "I already have this"
  button could mark (same rule C-8 / SR-15, refused parts ST-06 stay) and turns into "Buy all after all" /
  "Doch alles kaufen"; the page stays at the section (issue #119). Not for *Materials* – plugs and screws
  always stay on the list. New `pillButton()`: "Have it all" and the single "I already have this" are now
  small outline pills (0.95 rem, thin border) in line with the heading; the button keeps the 44 px touch
  target (NFR-08). `app/i18n.js`: 2 new texts EN/DE. `app/style.css`: pill and section-head styles.
  New test `#145 (UI)` (128 tests, all green). Checked in the browser (DE, 420 px). README updated.
  *Why:* customers who own all tools had to tap every tool separately; the first button looked too big
  next to the heading. *Prompt (paraphrased):* "Implement variant A, but only for Tools and Safety gear,
  and use the same pill for the single selection of materials."

## Milestone: D-13/D-14 mounting logic preview, cabinet size check and 75 cm cabinet limit – 2026-11-05
Summary (same as the pull request):
- Catalogue data v3 with 6 stores (incl. OBI Schwabach): `product_catalogue.xlsx`, `products.csv`, `store_stock.csv`, `stores.csv` replaced; max. 6 stores shown (D-13/D-14 Step 1)
- New rule functions: fixing chain R-17 and capacity R-18 from sheet *System ratings* (D-13/D-14 Step 2)
- Preview mode `?preview=d13`: new mounting logic for shelf, wall cabinet and anti-tip inside the normal app; without `?preview=d13` the app works as before
- Preview size screen checks while typing: max. depth/width beside the field, "too heavy" notice with sizes that fit, "I'll weigh my cabinet" (team decision open: `tpjm/change-proposal-CP-D14-W.md`)
- Wall cabinet max. 75 cm wide (was 120 cm) – in the preview and in the released app; wider → several cabinets side by side (CAB-S1)
- One-file trial build for testers: `node tools/build_trial.js` → `trial/Baumarkt-Buddy-Trial.html` (not in git)
- Open for the team: update 120 → 75 cm in `data/project_catalogue.xlsx`; decide CP-D14-W
- 127 tests passing; test results saved

- **2026-11-04 – Preview: wall cabinet max. 75 cm wide (was 120 cm).** `app/config.js`
  `preview.d13.maxCabinetWidthCm` 120 → 75; too-wide text now "wall cabinets are max. 75 cm wide"
  (EN/DE); test CP-D14-W checks 75 cm allowed, 76 cm too wide. Released flow (template stop rule,
  CAB-S1 split) unchanged. *Why:* 120 cm wall cabinets are not sold; usual widths are 60–75 cm.
  *Prompt (paraphrased):* "Max. width 120 cm is too much – it should be 60 or 75 cm" (chose 75 cm).
- **2026-11-04 – Released app: wall cabinet max. 75 cm wide per cabinet (was 120 cm).**
  `app/data/templates/hang-wall-cabinet.json`: stop rule ST-04 width > 75, CAB-S1 `max_length` 75,
  the "one or several cabinets?" question and its texts from 75 cm (EN/DE). Wider → several cabinets of
  the same width (e.g. 150 cm → 2 × 75 cm), each with its own rail. Tests updated (cabinet sample
  60 cm instead of 80 cm; split 150 → 2 × 75; 110 cm as 2 cabinets → 2 rails). README updated.
  Open: `data/project_catalogue.xlsx` (source of the template, DR-04) still says 120 cm – the team
  updates it. *Prompt (paraphrased):* "Yes, change the released app too."
- **2026-11-04 – One-file trial of the app for testers.** New `tools/build_trial.js` builds
  `trial/Baumarkt-Buddy-Trial.html`: all scripts, styles, fonts and data files embedded, `fetch()` of
  the data answered from the embedded copy, D-13/D-14 preview always on. The file opens with a
  double-click (no server, no git, no `?preview=d13`); checked headless from a separate folder:
  store search, perforated brick 70 × 40 × 90 cm → size notice → weighed 21 kg → 12/14 mm plugs, no
  console errors. `trial/` is in `.gitignore`; README updated. `app/` itself is unchanged.
  *Why:* a colleague could not get the preview running and still saw the old stop.
  *Prompt (paraphrased):* "Make a workaround so my colleague can simply open the app and try some
  values – no tests, no code."

- **2026-11-04 – Preview: size screen checks while typing; clearer "cabinet too heavy"; weigh your
  cabinet (CP-D14-W).** `app/preview-d13.js`: the size is checked as soon as all fields hold a number
  (no need to press Continue). The max. depth (cabinet: also max. width) is shown to the right of the
  field instead of the line "✓ wall: up to X cm deep"; on a phone it moves below the field. A wall
  cabinet too heavy for the wall now gets a notice on the size page: estimated weight, heaviest
  cabinet the wall takes (strongest plug ÷ min. plug factor 1.5), buttons with the largest height,
  width or depth that fits (`cabinetSizeFit`, min. 10 cm, `config.preview.d13.minSuggestedSizeCm`)
  and "I'll weigh my cabinet". A weighed weight up to that max. gives the plug options (contents =
  plug max. − weighed weight), shown on the summary, as a list note and in the evidence log; above it
  the stop screen names the weighed weight. Stop text rewritten: it no longer reads as if the cabinet
  weighed 1.5 × its weight. `calc` is now exported without `?preview=d13` (screens stay inactive) so
  `tests.html` can test it; new test `D-14 / CP-D14-W` (127 tests, all green). Checked in the browser:
  70 × 40 × 90 cm on perforated brick (32 kg, max. 23 kg, sizes 56 / 45 / 21 cm, weighed 30 kg → stop,
  21 kg → 12 and 14 mm plugs with 14 kg contents), EN/DE, phone width. README updated; team decision
  needed on the weighed weight: `tpjm/change-proposal-CP-D14-W.md`.
  *Why:* the stop came only after Continue, misnamed 48 kg as the cabinet weight and gave no way forward.
  *Prompt:* "Check the dimensions in the background as they are entered and say on the page if there is a stop –
  change the size or weigh the cabinet; if the weight is below the max., show the plugs; put the
  permitted depth to the right of the field."

- **2026-11-03 – Preview keeps all features of the app; only the new logic for shelf, wall cabinet
  and anti-tip.** `?preview=d13` now shows the normal project page (free text, voice, all six
  projects, groups) instead of a reduced chooser. Tiles, free text and voice lead shelf, wall
  cabinet and anti-tip into the new flow (a recognised wall type is pre-selected, still confirmed
  by tap); after "Confirm" the normal list screen shows the result, so subtotals, "I already have
  this", availability and referral, shopping by aisle, save/share, the facts summary with "Change",
  the evidence log and the tab-bar Back work as before. Tools and safety gear come from the project
  templates; drill: hammer drill P040 when hammer mode is on, else P039. Picture, painting and
  wallpaper are unchanged. `app/app.js`: hooks in `startTemplate`, `recompute`, `editQuestion`,
  history and render – all inactive without `?preview=d13`. Existing tests unchanged and green;
  checked in the browser (all handover cases, store SCH, EN/DE).
  *Why:* colleagues should try the new logic in the app as they know it.
  *Prompt:* "Keep the project page as it is now, show the other projects with their old logic, provide
  all other features of the previous version except the logic behind the mounting projects; and a way
  to share it with colleagues without committing to the main repository."

- **2026-11-03 – Preview mode for the D-13/D-14 mounting logic (`?preview=d13`).** New
  `app/preview-d13.js` / `app/preview-d13.css`: with `?preview=d13` the app loads
  `data/product_catalogue_03_11_26.xlsx` and offers *Hang a shelf*, *Hang a wall cabinet*,
  *Hang a picture* and *Anti-tip*. Shelf, cabinet and anti-tip follow the new flow wall → size →
  summary (board and brackets / cabinet weight and rail / kits) → plug options with "max. X kg"
  → confirm → shopping list, all loads from sheet *System ratings* via `fixingChain` (R-17) and
  `capacity` (R-18); rail ratings from the rail products (80 / 150 kg as in sheet *Cabinet*);
  2 plugs per bracket; spirit level P032 / P371 above 120 cm; too deep → hint with the max. depth;
  stops only for "I don't know" and a cabinet too heavy for the wall. *Hang a picture* keeps its
  weight question (D-2) and opens the existing flow. Store choice (6 stores incl. Schwabach) with
  aisle and stock; texts in English (default) and German. `app/app.js`: small hooks, active only
  in preview mode; `app/index.html` loads the preview script; `app/config.js` → `preview.d13`.
  Checked in the browser: all six manual cases of the handover give the expected values.
  Existing tests unchanged and green. README updated.
  *Why:* see the new logic in the app before the full rebuild (Steps 3–5).
  *Prompt:* "Build a preview mode at /app/?preview=d13 for shelf, wall cabinet and anti-tip … also add
  Hang a picture, keep the rail ratings as in the Cabinet sheet, 2 plugs per bracket, English and German, 6 stores."

- **2026-11-03 – D-13/D-14 Step 2: engine basics – System ratings, fixing chain (R-17), capacity (R-18).**
  `app/data.js`: new `buildMounting` reads the sheets *System ratings* and *Fixing chain*
  (system rating per wall and plug size, wall cap, max. depths, bracket pairs, boards, safety
  factor, reference depth, cabinet and anti-tip tables, fixing chain rows, plug type and hammer
  mode per wall) into `data.mounting`; a missing table or value gives `data.mountingError`
  instead of guessed values; "n/a" or a blank rating stays `null` (not offered), never 0.
  `app/rules.js`: new `fixingChain` (R-17) and `capacity` (R-18, shelf and cabinet; rounded down
  as in sheet Capacity). `app/config.js`: `mounting.fixingTypes` maps each fixing type to its plug
  product group and screw column (no load values). Tests: DR-09 (sheet loading), TC-108
  (all 224 cells of sheet Capacity), R-18 (factors, caps, too deep, cabinet against sheet Cabinet),
  TC-115 / RB-27 (screw fits hole, plug type and hammer match the wall), NFR-03 (broken sheet →
  clear error). No screen change. README updated.
  *Why:* handover D-13/D-14, Step 2 – the shelf, wall-cabinet and anti-tip steps build on these functions.
  *Prompt:* "Show Step 2 plan" → plan with rounding down and the open rail-rating question → "OK, go ahead."

- **2026-11-03 – D-13/D-14 Step 1: catalogue data v3 with 6 stores (TC-107).** The dated
  workbook `data/product_catalogue_03_11_26.xlsx` is now `data/product_catalogue.xlsx`
  (288 products P001–P105 + P201–P384; store SCH – OBI Schwabach; new sheets Fixing chain,
  System ratings, Capacity, Cabinet, Anti-tip, D-13 mapping). `products.csv`, `store_stock.csv`
  and `stores.csv` re-exported (identical to the dated CSVs). `data/03-design.md` replaced by the
  dated version (R-17 … R-22, §6.1). `app/config.js`: `maxStoresShown` 5 → 6 (FR-29: all sample
  stores, max. 6). Tests: DR-08 expects 6 stores, DR-01 expects 288 products, new TC-107
  (91126 → Schwabach first, 91052 → Schwabach by distance, all 6 shown, none preselected).
  README.md and data/README.md updated. The new sheets are not read by the app yet (Step 2).
  *Note:* Python is not installed on this machine, so `tools/add_rule_columns.py` could not run.
  The workbook's rule-engine columns are already filled, so the script would not change it;
  a read-only Node check with the app's SheetJS, following the script's `export()` logic,
  gave byte-identical CSVs to the dated exports, which were then copied into place.
  *Why:* handover D-13/D-14, Step 1 (data) – D-11 data delivered.
  *Prompt:* "Read the handover and CLAUDE.md; local only; start with Step 1 (Data); show the plan first." → "OK, go ahead."

## Milestone: "Already have" button in the price row – 2026-11-03
Summary (same as the pull request):
- "I already have this" moved from its own row to the right of the price row (variant B)
- Button text shortened: "Hab ich schon" (DE), "Have it already" (EN)
- List about one row (~50 px) shorter per tool or other ownable part
- UI test C-8 checks the new position (120 passing); test result saved

- **2026-11-03 – "Already have" button moved into the price row.** `app/app.js`: the
  "I already have this" button now sits on the right of the price row instead of its own
  row (variant B); `app/style.css` pushes it to the right edge. Texts shortened to
  "Hab ich schon" (DE) and "Have it already" (EN). The UI test C-8 checks the position. README updated.
  *Why:* the list was long on the phone; this saves about one row (~50 px) per tool or other ownable part.
  *Prompt:* "Would the list get shorter if the button moved up next to the product?" → screenshots of A and B → "Implement variant B with 'Hab ich schon'."

## Milestone: "I already have this" keeps the scroll position (issue #119) – 2026-11-03
Summary (same as the pull request):
- "I already have this" / "I need it after all" no longer jumps to the top of the list – the clicked item stays where it was on screen
- The focus stays on the clicked button (keyboard and screen reader users stay in place too)
- All other screen changes still start at the top
- README and CHANGELOG updated; test result saved (120 passing)

- **2026-11-03 – "I already have this" keeps the scroll position (issue #119).** `app/app.js`:
  `render()` takes an optional anchor; the "I already have this" / "I need it after all" button
  redraws the list with the clicked item at the same place on screen and the focus on its button,
  instead of jumping back to the top. All other screen changes still start at the top. README updated.
  *Why:* testers had to scroll down again to the item after every click.
  *Prompt:* "Please check issue #119 – page refreshes when we click 'I already have this'."

## Milestone: Typed input checked and cleaned (issues #104, #105, #108, #109) – 2026-11-03
Summary (same as the pull request):
- #104: a minus before a number in the project text is kept ("-5 kg" is no longer read as 5 kg)
- #105: in keyword mode an impossible value ("-5 kg", "0 kg", "9999 kg") is dropped and asked again – the project is kept; AI answers stay all-or-nothing (DR-05)
- #108: number fields accept only digits with one comma or point ("1e1", "0x10" rejected)
- #109: postcode field removes spaces and other non-digits while typing or pasting (" 91126" works)
- 3 new tests (120 passing); test result saved

- **2026-11-03 – Input checks (issues #104, #105, #108, #109).** `app/ai-adapter.js`:
  `normalise` keeps a minus directly before a number; `validateOutput(…, { dropBadValues })`
  drops single out-of-range values for the template mode only. `app/rules.js`: new
  `parseDecimal` (strict number) and `cleanPlzInput` (digits only, max. 5). `app/app.js`:
  number fields, live hints and the weight estimate use `parseDecimal`; the PLZ field cleans
  its input (`maxlength` 12 so a pasted space no longer cuts the last digit). README updated.
  *Why:* four exploratory-test bugs with the same background – customer input not cleaned or checked strictly enough.
  *Prompt:* "Check issues #104, 105, 108, 109 – same background, same fix?" → "Yes, all four in one PR."

## Milestone: No duplicate back buttons – 2026-11-03
Summary (same as the pull request):
- Question screens: the "Back" / "Cancel" button in the form is removed – only "Confirm"; back goes via "Back" in the tab bar
- Shopping by aisle: "Back to the list" removed for the same reason
- Checked all screens: other buttons are real choices and stay (continue without a store, other project, new project, cancel in the microphone notice)
- Tests updated (117 passing); test result saved

- **2026-11-03 – Duplicate back buttons removed.** `viewQuestion` / `viewShopping` in
  `app/app.js` (`questionBack` and text `shopping_back` removed). README updated.
  *Why:* with "Back" in the tab bar the extra back buttons were confusing (iPhone screenshots).
  *Prompt:* "The Back buttons on the wall question make no sense – check the other pages too, now that the bottom bar has Back."

## Milestone: Back button in the tab bar – 2026-11-03
Summary (same as the pull request):
- "Back" moved from under the progress bar into the bottom tab bar: Back · Start · Store · List (always visible, also on long lists)
- Active on every step including questions; greyed out on the first step (would leave the app)
- Back-button test updated (117 passing); test result saved

- **2026-11-03 – Back button in the tab bar.** `navButtons` / `canGoBack` in `app/app.js`
  (new `back` icon, `renderNav` builds the bar from `navButtons`); the top `#backbar`,
  `renderBack` and its styles are removed. README updated.
  *Why:* on a long list the top button scrolls away; the tab bar is always in reach (iPhone screenshot).
  *Prompt:* "Wouldn't it make more sense to put the back button in the bottom bar with Start, Store, List?" → "Yes, do it."

## Milestone: In-app back button – 2026-11-03
Summary (same as the pull request):
- "‹ Back" button under the progress bar goes back to the previous step (same as the browser back, issue #101)
- Hidden on the first step (would leave the app) and on question screens (they have their own Back button)
- 1 new test (117 passing); test result saved

- **2026-11-03 – In-app back button.** `#backbar` in `app/index.html`, `renderBack` /
  `viewBack` / `backVisible` in `app/app.js` (calls the history back from #101), styles in
  `app/style.css` (44 px tap area). README updated.
  *Why:* customers should get back to the previous page without the browser controls.
  *Prompt:* "Please add a back button to get back to the previous page."

## Milestone: Saved list in the app design (issue #135) – 2026-11-03
Summary (same as the pull request):
- "Save list" / "Share list" now give one HTML file in the app design instead of a plain text file
- Orange header with brand and "Sample data", safety notes first, one row per item (price on the right, aisle/shelf chips, availability dot), manufacturer notes highlighted, subtotals, black total box, "You already have" section, clickable how-to links
- Self-contained: no script, nothing loaded from the internet (own CSP), system fonts; prints to PDF; still no PLZ, nothing sent
- TC-100 test updated (HTML content, no script, escaping); test result saved

- **2026-11-03 – Saved list as HTML (issue #135, option 1).** `buildListHtml` replaces
  `buildListText` in `app/app.js` (styles in `SAVE_CSS`, all text escaped with `escHtml`);
  `saveList` / `shareList` write `baumarkt-buddy_<project>_<date>.html`. Owned items get
  their own section and keep the SR-15 check note. Texts `save_privacy` and new
  `save_owned_title` (EN/DE). Review with options posted on #135. README updated.
  *Why:* the text file looked bad on the phone and did not match the app.
  *Prompt:* "Look at issue 135 – the saved list looks bad, suggest how to match the app design" → "Yes, implement option 1 and comment on #135."

## Milestone: Smaller language flag – 2026-11-03
Summary (same as the pull request):
- The language flag in the header is smaller (32 px instead of 52 px / 46 px on phones); the tap area stays 44 px (NFR-08)
- Test result saved

- **2026-11-03 – Smaller language flag.** `app/style.css`: `#lang-toggle` is a 44 px tap
  area without its own border; the flag sits in a 32 px round `.flag-wrap` (`app/app.js`,
  `renderHeader`). README updated.
  *Why:* on the phone the button looked too big next to the title (iPhone screenshot).
  *Prompt:* "The language button is too big, please change it."

## Milestone: Browser back stays inside the app (issue #101) – 2026-11-03
Summary (same as the pull request):
- Browser back / back swipe goes one step back inside the app (list → question → project; shopping → list); forward re-checks the answers (SR-08)
- Only real steps get a history entry (no entry for re-renders, loading or the start notice); leaving the store search replaces its entry
- Back on the first step while a list exists asks "Leave your list?" (save / stay / leave) instead of closing the app
- History holds only screen and question id – no answers, no postcode (NFR-04); 2 new tests (116 passing); test result saved

- **2026-11-03 – Browser back / back swipe (issue #101, options A + B).** `app/app.js`:
  `initHistory`, `syncHistory` (called from `render`, pushes an entry only when the step
  changes), `onPopState` / `restoreStep` (shows the step again; result and shopping are
  re-computed from the current answers, a missing answer leads to its question), guard entry
  with `viewLeave` ("Leave your list?" – save / stay / leave; leave goes past the guard, opened
  directly → start again). Texts EN/DE in `app/i18n.js`. Tests #101 (A) and #101 (B) with
  real `history.back()` / `forward()`. Review and proposal posted on issue #101; option C
  (keep the project over a reload, `sessionStorage`) is left to the team. README updated.
  *Why:* one back swipe in the store lost the whole list.
  *Prompt:* "Check issue #101, review the proposal, suggest an alternative" → "Yes, implement A & B and post the review on #101."

## Milestone: "Partner store" wording for stores out of range – 2026-11-03
Summary (same as the pull request):
- Notice when no store is within 50 km now says "There is no Baumarkt-Buddy partner store within 50 km of this postcode." (DE: "… keinen Baumarkt-Buddy-Partnermarkt.")
- 1 new test (114 passing); test result saved

- **2026-11-03 – Wording "partner store".** `store_none_in_range` in `app/i18n.js` (EN + DE).
  New test FR-29 (text).
  *Why:* the sample stores are partner stores of the app, not all stores.
  *Prompt:* "Change the first sentence to: There is no baumarkt buddy partner store within 50km of this postcode."

## Milestone: Flags on the language button – 2026-11-03
Summary (same as the pull request):
- The round language button shows a flag instead of "DE" / "EN": German flag on the English screen, UK flag on the German screen
- Flags are own inline SVGs (no image file, no emoji); screen readers still hear "Switch language to German/English"
- 1 new test (113 passing); test result saved

- **2026-11-03 – Flags on the language button.** New `flag(code)` in `app/app.js`
  (inline SVG: Germany black/red/gold, United Kingdom Union Jack), used by
  `renderHeader` instead of the text "DE"/"EN"; hidden text and `aria-label` stay.
  Styles in `app/style.css` (round flag fills the button). New test NFR-09 (flags).
  README updated.
  *Why:* a flag is quicker to recognise than a language code.
  *Prompt:* "Use flags in the button to change language – EN = UK flag, DE = German flag."

## Milestone: Smaller project list – Doors & locks not offered – 2026-11-03
Summary (same as the pull request):
- The app offers 6 projects; glass door, interior door lock and sliding door ("Doors & locks") are no longer shown or recognised
- Their templates stay in the repo (`inactiveTemplates` in `app/config.js`) and are still tested, so they can come back by moving one line
- Tests updated (6 tiles in 2 groups, door words fall back to the project choice); test result saved
- Requirement DR-04 updated to 6 projects (`requirements/requirements-R1-MVP.md`)

- **2026-11-03 – Doors & locks removed from the app.** `app/config.js`: the three door
  templates moved from `templates` to the new `inactiveTemplates` list, so the app does
  not load, show or recognise them (typing "Schiebetür" shows the project choice with a
  notice). `app/tests.js` loads the inactive templates separately, so their rule tests
  (PRJ-06…PRJ-08, size limits) keep running. README updated.
  *Why:* the team wants to start with a smaller project list.
  *Prompt:* "Please remove the projects under Doors & locks – we want to start with a smaller project list."

- **2026-11-03 – Requirement DR-04 updated to 6 projects.** `requirements/requirements-R1-MVP.md`:
  DR-04 now lists the 6 offered projects and notes that PRJ-06 … PRJ-08 are not offered for
  now; new summary section "What changed on 3 Nov 2026"; date in the header.
  *Why:* the requirements must match the smaller project list in the app.
  *Prompt:* "Yes, update DR-04 to 6 projects."

## Milestone: Project tiles without safety level – 2026-11-03
Summary (same as the pull request):
- Project tiles show only icon and title; "Mounting – full / Mounting – light / Basic" removed from the tiles
- The safety level stays at the top of the list; DR-04 UI test updated; test result saved

- **2026-11-03 – Safety level removed from the project tiles.** `viewChoose` in `app/app.js`
  no longer renders `.template-level` (styles removed). The list still shows
  "Safety level: …" (`data-level`). DR-04 UI test checks both. README updated.
  *Why:* calmer tiles; the level is shown where the result is.
  *Prompt:* "Remove MOUNTING – FULL / MOUNTING – LIGHT / BASIC from the project tiles."

## Milestone: No review status in the list – 2026-11-03
Summary (same as the pull request):
- The list's transparency line no longer says "Template not yet reviewed by the team"; it keeps the template version
- Unused texts `template_reviewed` / `template_unreviewed` removed; NFR-05 test updated; test result saved

- **2026-11-03 – Review status removed from the list.** `viewList` in `app/app.js`
  shows only "Project template v1.2.0." after "How this list was made"; the review
  status stays in the template files (`review`, SR-10) for the team. NFR-05 test checks
  the version and that no review text appears on the list or the tiles. README updated.
  *Why:* the hint confused customers; the review is a team task, not customer information.
  *Prompt:* "Remove '… Template not yet reviewed by the team.'"

## Milestone: Save every test run in test/results – 2026-11-03
Summary (same as the pull request):
- Current test result (112 passed) saved as `test/results/2026-11-03_7fde5b4.md` / `.json`
- New working rule in CLAUDE.md: every test run is saved in `test/results/` and committed with its change; README updated

- **2026-11-03 – Test results always saved.** Ran `node tools/run_tests.js` on `main`
  (commit 7fde5b4, 112 passed) and committed the result files. CLAUDE.md gets the rule
  "always save every test run in test/results/", README describes it.
  *Why:* the only saved result was from 27 Oct 2026; the team wants every run on record.
  *Prompt:* "Yes, always put all test results into test/results."

## Milestone: Several wall cabinets side by side – 2026-11-03
Summary (same as the pull request):
- Wall cabinet wider than 120 cm: several cabinets of the same width side by side (new rule CAB-S1), each with its own rail, plugs and screws, checked for the full weight
- Depth, height and plasterboard table checked per cabinet; the stop offers the split as a button
- Split texts moved from i18n.js into the project templates (`segments.texts`) so shelf and cabinet share one mechanism
- Cabinet template v1.1.0; 1 new test, 2 tests updated (112 passing)

- **2026-11-03 – Several wall cabinets (CAB-S1).** `app/data/templates/hang-wall-cabinet.json`
  (v1.1.0): new field `cabinet_layout` (shown above 120 cm) and `segments` block (max. 120 cm
  per cabinet = ST-04 limit, materials × count, weight never divided). The split texts
  (hint, plan, tip, button, notice, weight notes, cut) now live in each template's
  `segments.texts`; `segText` in `app/app.js` reads them, the 9 shelf keys left `app/i18n.js`.
  Tests: PRJ-02 and the limits UI test updated (121 cm first asks for the layout), new
  CAB-S1 test. README updated.
  *Why:* customers with a wide cabinet row should not hit a size stop.
  *Prompt:* "Yes, do the wall cabinet with several cabinets as well."

## Milestone: Size limits before input and several shelf boards – 2026-11-03
Summary (same as the pull request):
- All projects: number fields show the guide limit from the stop rules (ST-04) and the catalogue sizes of size-dependent parts; typing beyond a limit warns at once
- Size stops name the value given and the limit of the guide
- Shelf: above 120 cm several boards side by side (new rule SHELF-S1); each board with its own fixings, checked for the full weight; cut hint; stop offers the split as a button
- Shelf template v1.2.0; 4 new tests (111 passing)

- **2026-11-03 – Size limits before input (proposal A) and several shelf boards (proposal B).**
  `app/rules.js`: `guideLimits` reads plain size limits from the stop rules (no new values),
  `limitCheck`, `catalogueSizes` (sizes of parts with `size_check`), `segmentPlan`; a stop
  rule result carries `limits` (crossed limit, value given). New template block `segments`
  and field `shelf_layout` (with `show_when`) in `app/data/templates/hang-shelf.json`
  (v1.2.0): above 120 cm the customer chooses one board (→ ST-04 as before) or several
  boards; the engine checks one board of length ÷ count, multiplies materials by the count
  and never divides the weight (books estimate SHELF-E1 per board). `app/app.js`: field
  hints, live warning, split choice with plan, limit lines and split button on the stop,
  segment notice on the list, in the saved file and on the shopping route. Texts EN/DE.
  RB-01 test updated (130 cm now first asks for the layout). README updated.
  *Why:* customers should not run into size errors at the end; a long shelf is possible with several boards.
  *Prompt:* "Implement A for all projects and B for the shelf" (show limits before input; several boards side by side).

## Milestone: Risk analysis – 2026-11-02
Summary (same as the pull request):
- New `docs/risk-analysis.md`: 20 risks in five categories (safety, AI, data quality, legal, business), rated by likelihood and impact
- Risk matrix, countermeasures with status (linked to requirements and open GitHub issues), top risks with next steps
- README folder table links the risk analysis

- **2026-11-02 – Risk analysis.** New `docs/risk-analysis.md` with risk register,
  risk matrix and next steps; legal points (EU AI Act Art. 50, Product Liability
  Directive 2024/2853) checked against current sources. README `docs/` row updated.
  *Why:* the professor asked the team for a risk analysis of the project.
  *Prompt:* "What kind of risk analysis can we do? … Please do it!"

## Milestone: Cleaner project tiles – 2026-11-01
Summary (same as the pull request):
- Project tiles no longer show "Template not yet reviewed by the team · vX.Y.Z"
- Review status and template version stay visible in the transparency line of the list (SR-10, NFR-05); test added

- **2026-11-01 – Review status removed from the project tiles.** `viewChoose` in
  `app/app.js` no longer renders the `.template-review` line (styles removed); the list
  still shows the template version and review status. NFR-05 test checks that the tiles
  have no review text. README updated.
  *Why:* the tiles should be calmer; the status is kept where the result is shown.
  *Prompt:* "Remove 'Template not yet reviewed by the team · v1.1.0' from the tiles."

## Milestone: Competitor analysis – 2026-10-31
Summary (same as the pull request):
- New `docs/competitor-analysis.md`: German DIY market figures, direct and indirect competitors and their strategies
- Feature comparison table and what it means for the Baumarkt Buddy pitch, with sources
- README folder table lists `docs/`

- **2026-10-31 – Competitor analysis.** New `docs/competitor-analysis.md`: German
  DIY market figures (BHB 2025), direct competitors (Home Depot, Lowe's, Kingfisher,
  OBI, Hornbach, Bauhaus, toom), indirect competitors, a feature comparison and what
  it means for our pitch, with sources. README folder table lists `docs/`.
  *Why:* the team needs to know the competitors and their strategies for the pitch.
  *Prompt:* "Run market research on our competitors and their strategies; put
  everything in an md file under docs."

## Milestone: Shopping by aisle – 2026-10-31
Summary (same as the pull request):
- Orange button "Start shopping by aisle" under the list opens a new screen: the checked list of the chosen store grouped by aisle (ascending) and shelf
- Owned items left out; unavailable items listed separately with the FR-31 referral or "ask staff"; without a store → postcode prompt
- Progress bar gets a fifth step "Shopping"; 1 new test (107 passing)

- **2026-10-31 – Shopping by aisle.** New `aisleRoute` / `viewShopping` in
  `app/app.js` (screen `shopping`), button `#start-shopping` below the total, styles
  `.btn.brand` (black text on #FF7313 for WCAG contrast) and `.route` in `app/style.css`,
  texts EN/DE in `app/i18n.js`. The route only reorders the checked result (no tick
  boxes, D-3). Progress bar extended to five steps (Shopping). README updated.
  *Why:* in the store the customer wants to walk the aisles in order.
  *Prompt:* "Please add a button 'Shopping by aisle' below our list."

## Milestone: Progress bar over the flow – 2026-10-31
Summary (same as the pull request):
- Progress bar under the header: Store → Project → Questions → List (done = orange, current = bold)
- A safety stop marks its step red; hidden on the start notice; screen-reader labels for each step

- **2026-10-31 – Progress bar.** New `renderProgress` / `viewProgress` in
  `app/app.js` and `#progress` in `app/index.html`: four steps Store, Project,
  Questions, List mapped from the current screen; a safety stop (high-risk work,
  stop screen) is shown red at its step. Texts EN/DE, `aria-current="step"` and
  hidden status words for screen readers. 1 new test (106 passing).
  *Why:* customers should see where they are in the flow, like in other DIY-store apps.
  *Prompt:* "Can you add a status bar like this to our app, following our process?"

## Milestone: Team decisions D-1, D-2, D-3 – save list, weight answers, subtotals – 2026-10-31
Summary (same as the pull request):
- D-1 (FR-17, DR-06): "Save list" downloads the complete list as a text file on the device (optional share sheet); no PLZ, nothing sent
- D-2 (FR-04, SR-14): weight answers "I know it", "Weigh it", "Estimate for me" (shelf) and "I don't know" → worst case = project maximum; above the limit → ST-05 weigh / ask staff
- D-3 (FR-07, FR-34, SR-17): tick box removed; subtotal per section, total = sum of subtotals; hint for own tools and safety gear
- Tests: RB-23 updated to the new expectation; TC-100…TC-104 automated (105 passing)

- **2026-10-31 – Team decisions D-1, D-2 and D-3 implemented.**
  *D-1:* `buildListText` / `saveList` in `app/app.js` – the list (products, quantities,
  prices, subtotals, total, owned items, aisle/shelf/stock of the chosen store, product
  warnings, safety notes, how-to links) is saved as a local `.txt` file; "Share list"
  where the browser supports sharing files. The customer's PLZ is not included (store
  address without postcode); no network request.
  *D-2:* weight question offers "I know it", "Weigh it" (bathroom-scale tip), "Estimate
  for me" (shelf only, books rule SHELF-E1 = 1 kg per 4 cm, from the existing help
  text; labelled, used only after Confirm) and "I don't know". The rule engine then
  uses the project's highest allowed load as worst case (team decision 31 Oct 2026)
  and stops with ST-05 if the wall limit is lower or no part carries it; a list for the
  worst case carries a notice.
  *D-3:* the "in basket" tick box is removed; "I already have this" stays; section
  subtotals (FR-34) and total = sum of subtotals (RB-24); hint "Keep the right tool and
  gear to ensure safety." for own tools and safety gear (SR-17).
  Tests: SR-14 / RB-23 rewritten for D-2; new TC-100/101, TC-102, TC-103, TC-104
  (105 passing). README updated.
  *Why:* team decisions of 29 Oct 2026 (requirements FR-04, FR-07, FR-17, FR-34,
  SR-14, SR-17, DR-06); D-5 and D-11 wait for team data.
  *Prompt:* "Yes, implement D-1, D-2 and D-3" (worst case = project maximum, estimate
  only for the shelf with the books rule).

## Milestone: Dated test case copy moved to the archive – 2026-10-31
Summary (same as the pull request):
- `test/01_test_cases_2026-10-27.md` moved to `test/archive/`
- README now names `test/01_test_cases.md` as the current test cases and test log (§8.1); link in `tpjm/change-proposal-R1.md` updated

- **2026-10-31 – Moved `test/01_test_cases_2026-10-27.md` to `test/archive/`.**
  `git mv` keeps its history. The README points to `test/01_test_cases.md`
  (v1.2, 29 Oct 2026) as the current test cases and test log (§8.1); the link
  in `tpjm/change-proposal-R1.md` points to the archive path. Archived files
  and older CHANGELOG entries are unchanged.
  *Why:* the team wants the dated copy out of the active test folder.
  *Prompt:* "Move 01_test_cases_2026-10-27.md to test/archive."

## Milestone: Dated requirement copies moved to the archive – 2026-10-31
Summary (same as the pull request):
- `requirements-R1-MVP_2026-10-27.md` and `requirements-R2-R4_2026-10-27.md` moved to `requirements/archive/`
- Links in README, `tpjm/change-proposal-R1.md` and `test/01_test_cases_2026-10-27.md` updated

- **2026-10-31 – Moved the dated requirement copies to `requirements/archive/`.**
  `git mv` keeps their history. The README now links the R2–R4 requirements to
  `requirements/requirements-R2-R4.md`; the links in `tpjm/change-proposal-R1.md` and
  the basis references in `test/01_test_cases_2026-10-27.md` point to the archive
  path so they do not break. Older CHANGELOG entries keep their original wording.
  *Why:* the team wants the dated copies out of the active requirements folder.
  *Prompt:* "Move requirements-R2-R4_2026-10-27.md and requirements-R1-MVP_2026-10-27.md
  to requirements/archive."

## Milestone: Typo-tolerant project recognition – 2026-10-28
Summary (same as the pull request):
- Misspelled project and wall words are recognised in keyword mode ("Regla", "Regall", "Bücherregla", "shefl", "Gipskarten") – still only a guess the customer confirms
- Misspelled dangerous jobs are refused like correct ones ("Steckdoze", "Gastherne")
- Exception list for real words that only look like a typo ("Frage" is not "frame")
- "Did we understand you?" screen names each corrected word ("regla" read as "Regal")
- Misspelled phrases recognised word by word, incl. dangerous ones ("tragende Wnad", "load bearnig wall")

- **2026-10-28 – Typo hint on the recognised screen and phrase typos.**
  `templateUnderstand` reports every tolerated spelling mistake (not part of the
  validated AI output); the recognised screen lists them under "Possible spelling
  mistakes" (NFR-05). New `phraseTypoMatch` in `app/rules.js` matches phrases word
  by word (one mistake per word, word forms, two swapped letters in 4-letter words)
  – used for project and wall phrases ("stud wlal") and for the high-risk check
  ("tragende Wnad", "wand entfrenen", "verdeckte Leitnug"). 2 new tests (101 passing).
  *Why:* the customer should see what the app corrected, and dangerous phrases
  must also be caught when misspelled.
  *Prompt:* "Yes, add 1 and 3 to #93" (1 = "Did you mean …?" hint, 3 = phrase typos).

- **2026-10-28 – Typo tolerance for project, wall and high-risk words.**
  New `editDistance` / `typoMatch` in `app/rules.js` (swapped letters count as one
  mistake; keywords of 5+ letters, same first letter, 1 mistake – 2 from 9 letters).
  `app/ai-adapter.js` (template mode) tries exact keywords first, then word forms
  and compounds ("Regale", "Eckregal", "Regalbretter") and spelling mistakes; two
  possible projects → "unclear" (project buttons). The result stays a guess shown on
  "Did we understand you correctly?" and confirmed in the questions (SR-01). The
  G0 high-risk check also catches misspelled single keywords – a false hit only
  makes the app more careful (SR-09). New `typo_exceptions` list in
  `app/data/understanding-lexicon.json`. 2 new tests (99 passing).
  *Why:* a misspelled "Regla" instead of "Regal" was not recognised.
  *Prompt:* "How can I avoid that the project is not found when it is misspelled,
  e.g. 'regla' instead of 'regal'?"

## Milestone: Saved test results and automatic test runs – 2026-10-27
Summary (same as the pull request):
- `tools/run_tests.js` runs `app/tests.html` headless and saves `test/results/<date>_<commit>.md` / `.json`
- GitHub Actions workflow *Tests* on every pull request into `main`, push to `main` and on demand (run summary + artifact)
- First saved result: 97/97 PASS; README and test document §8 explain where results are stored

- **2026-10-27 – Test results are saved as files and run automatically on GitHub.**
  New `tools/run_tests.js` (with `tools/package.json`, Playwright 1.63.0): serves the
  repository itself, runs `app/tests.html` in headless Chromium and writes
  `test/results/<date>_<commit>.md` and `.json` (commit, branch, browser, every test);
  exit code 1 on a failed test. New workflow `.github/workflows/tests.yml` runs it on
  every pull request into `main`, every push to `main` and on demand – result in the
  run summary, files as artifact `test-results` (90 days). `.gitignore` for
  `tools/node_modules/` and `tools/package-lock.json` (otherwise every CI run was
  marked `-dirty`). README and test document §8 explain where results are stored.
  *Why:* results were only visible in the open browser tab and in hand-written logs.
  *Prompt:* "Where are test results stored? – Yes, implement the runner script and CI."

## Milestone: Requirements and test cases updated to the current app – 2026-10-27
Summary (same as the pull request):
- New dated files `requirements-R1-MVP_2026-10-27.md`, `requirements-R2-R4_2026-10-27.md`, `01_test_cases_2026-10-27.md` (originals kept)
- R1: 49 requirements – 9 projects, stop rules and size stops, FR-07 moved from R2, new FR-32, FR-33, SR-13 … SR-16 (proposed, team to confirm)
- R2–R4: FR-07 removed, R1 parts of FR-10/12/14/16 noted, open points of the session listed
- Test cases v1.1: TC-080 … TC-099, automated suite and results documented, traceability 49/49, RB-23 proposed
- 2 new automated tests (unknown load, high-risk filter in Basic projects); 97 passing

- **2026-10-27 – Requirements and test cases updated to the current app (new dated files).**
  New files `requirements/requirements-R1-MVP_2026-10-27.md`,
  `requirements/requirements-R2-R4_2026-10-27.md` and `test/01_test_cases_2026-10-27.md`
  (originals kept). R1: 49 requirements (41 Must / 8 Should) – 9 projects (DR-04), stop
  rules and size stops (FR-15), FR-07 moved from R2, new FR-32 (how-to links), FR-33
  (used-item defects), SR-13 … SR-16 from the project catalogue (all new rows
  *Proposed*, team to confirm). R2–R4: FR-07 removed, R1 parts of FR-10/12/14/16 noted,
  open points of the session listed. Test cases v1.1: new TC-080 … TC-099 for the
  project catalogue, automated suite documented with its results, traceability 49/49,
  RB-21 linked to FR-31, RB-23 added (proposed). Two automated tests added so that
  every "Auto" reference is real: SR-14 / RB-23 (unknown load stops) and SR-16 / SR-09
  (high-risk filter in Basic projects) – 97 passing. Archive data not used.
  *Why:* the documents still described 2 projects and 70 products.
  *Prompt:* "Update the R1, R2–R4 requirements and the test cases to the vibe coding
  session and the current app; save under the same names plus today's date."

## Milestone: Sliding door dimensions and second door leaf – 2026-10-27
Summary (same as the pull request):
- Sliding door leaf must overlap the opening (+3 cm per side and at the top, assumption) and fit the free wall beside the opening; opening height is checked
- New question "free wall beside the opening"; stop ST-04 when there is not enough wall
- New sample door leaf P105 (100 × 213.5 cm); P097 gets its height as a spec
- Size stops show "needed vs. available" in cm (also shelf boards) and hand off to store staff only
- 95 tests passing

- **2026-10-27 – Sliding door: realistic dimensions and a second door leaf.**
  The door leaf now has to be at least opening + 6 cm wide and opening + 3 cm tall
  (3 cm overlap per side and at the top – assumption, team to check); the opening
  height is checked at last; a new question asks for the free wall beside the
  opening (the leaf must fit there, otherwise stop ST-04 with the needed width). New
  sample leaf P105 (1000 x 2135 mm, 30 kg, 179 €, stock in all 5 stores, team to
  verify); P097 got the spec `height_mm=2035` from its size. Size stops now show
  "needed vs. available" in the unit of the question (cm, German number format) –
  also for shelf boards – and hand off to store staff only (no extra
  "qualified professional" line). Engine: `spec_lte`, `size_check` per role.
  4 new/updated tests (95 passing).
  *Why:* the sliding-door stop mixed cm and mm, ignored the height and allowed leaves
  without overlap.
  *Prompt:* "The dimension differences make little sense – implement it, with a second door leaf."

## Milestone: 120 cm shelf boards and clear size stop – 2026-10-27
Summary (same as the pull request):
- Stop screen names a size problem (part and catalogue sizes) instead of blaming the load
- New 120 cm shelf boards P103 (25 cm deep) and P104 (20 cm deep), sample values – shelves up to 120 cm with 3 brackets
- 93 tests passing

- **2026-10-27 – Second 120 cm shelf board P104 (20 cm deep).**
  P104 *Shelf board 1200 x 200 x 18 mm* (rated 20 kg like P063, 17.99 €, brackets
  P058/P059, stock in all 5 stores – sample values, team to verify) added to the
  workbook (stock row inserted above the legend); CSVs re-exported. Shelves of
  81–120 cm now work in both depths. Test R-07 (size) uses a catalogue copy without
  P104, because the real catalogue no longer has a size gap up to 120 cm (93 passing).
  *Why:* 20 cm deep shelves above 80 cm still stopped.
  *Prompt:* "Yes, also add a 120 cm board with 20 cm depth."

- **2026-10-27 – New 120 cm shelf board P103 in the product catalogue.**
  `data/product_catalogue.xlsx` gets P103 *Shelf board 1200 x 250 x 18 mm* (rated
  25 kg, 19.99 €, compatible with brackets P059/P060, stock in all 5 stores – price,
  rating and stock are sample values, team to verify); CSVs re-exported. Shelves of
  81–120 cm with 25 cm depth now get a list with 3 brackets (project catalogue PRJ-01:
  3 brackets up to 120 cm). 20 cm deep shelves above 80 cm still stop with the size
  message. New test PRJ-01 / P103 (93 passing).
  *Why:* 100–120 cm shelves were impossible with the 80 cm boards only.
  *Prompt:* "Add a 120 cm shelf board with a load rating."

- **2026-10-27 – Stop screen names a size problem instead of blaming the load.**
  A 100 cm shelf with 10 kg was stopped with "no product combination rated for this
  load and wall", although the only reason was the board length (catalogue boards are
  80 cm). If a part fails only on its size checks, the stop now says which part and
  lists the catalogue sizes (EN + DE); real load problems keep the old text. New test
  R-07 (size), 92 passing.
  *Why:* the message was misleading for customers.
  *Prompt:* "A shelf with 10 kg and 20 cm deep is over the limit? That makes no sense."

## Milestone: Product catalogue v2 and project catalogue – 9 projects – 2026-10-27
Summary (same as the pull request):
- Product catalogue v2 (102 products, German names) and project catalogue (draft v1) added to `data/`
- `tools/add_rule_columns.py` only fills empty cells (keeps team values) and exports all three CSVs
- 7 new project templates (wall cabinet, anti-tip, paint, glass door, door lock, sliding door, wallpaper); shelf and picture aligned with the catalogue
- Rule engine: stop rules ST-01…ST-14 and warnings from the templates, conditions, new quantity rules, plasterboard cabinet table, projects without load questions, "I already have this" (C-8, SR-15)
- UI: grouped project buttons with safety level, checklist questions, catalogue stop texts, OBI how-to links, German product names
- Lexicon, AI schema and proxy know the new projects and wall types; 91 tests passing

- **2026-10-27 – Product catalogue v2 and project catalogue added to the repository.**
  `data/product_catalogue.xlsx` replaced by the team's v2 (102 products P001–P102,
  German names `product_name_de`/`category_de`, stock for the new products in all
  5 stores, sheets *Read Me* and *Translations*). New `data/project_catalogue.xlsx`
  (draft v1, 9 projects, team review pending). `tools/add_rule_columns.py` now only
  fills **empty** rule-engine cells (it used to overwrite `specs`/`pack_qty`, which
  would have destroyed v2 values such as `coverage_m2_per_l` and the 2-pc hinge
  set), adds `volume_l` to the wall paints, and exports all three CSVs
  (`products.csv`, `store_stock.csv`, `stores.csv`). The app shows the German product
  name in German mode. Tests: fixture product number moved from P097 (now a real
  product) to P997; DR-01 count raised to ≥ 100; new test for German names (70 passing).
  *Why:* the team delivered updated catalogues that belong in git (DR-01, DR-04).
  *Prompt:* "I have an updated project and product catalogue – push them and update the app."

- **2026-10-27 – App updated to the project catalogue: 9 projects (PRJ-01…PRJ-09).**
  New templates in `app/data/templates/`: wall cabinet (incl. the plasterboard limit
  table), anti-tip kit, paint a wall (litres from coverage, mould checks), glass door
  (hinge rating from the door weight), interior door lock (type and size must match),
  sliding door (rail ≥ 2 × leaf, moving load only on concrete/solid brick) and nonwoven
  wallpaper (roll calculation). Shelf and picture aligned: wall types *solid brick*,
  *brick (type unknown)* (max. 25 kg for shelves) and *aerated concrete* (stop ST-02),
  shelf length > 120 cm stops (ST-04), used-item defect checklist. Rule engine: stop
  rules and warnings from the templates (fail safe if a value is missing), conditions,
  new quantity expressions (add/sub/div/floor/ceil/min/table/"unclear"), projects
  without load or wall questions, "I already have this" for allowed parts (C-8, never
  plugs/screws, refused for defective load-bearing parts – ST-06, SR-15). UI: grouped
  project buttons with icons and safety level, checklist questions, catalogue stop
  texts with hand-off, OBI how-to links (https + allow-listed hosts only, English
  subtitles requested in EN mode). Keyword lexicon, AI schema and proxy prompt know the
  new projects and wall types. 91 tests passing (21 new).
  *Why:* the team's project catalogue defines the 9 Release-1 projects (DR-04).
  *Prompt:* "push them and update the app."

## Milestone: Design update 2 and store availability (FR-31) – 2026-10-25
Summary (same as the pull request):
- Layout and fonts reworked after screenshots of a DIY-store app: orange header band with diagonal edge, condensed headlines, black pill buttons, outlined tiles, flat product rows, black price box, bottom tab bar
- Self-hosted Barlow / Barlow Condensed fonts (OFL)
- Own neutral toolbox mark instead of the "B"; no logo or mascot of a real company
- FR-31: unavailable items stay on the list, marked, with referral to the nearest store with stock or "please ask staff"; no substitutes
- App switched to the team workbook `data/product_catalogue.xlsx` (5 stores) and `data/plz_coordinates.csv`; rule-engine columns added
- TC-38 without store preselection (team decision); FR-29, D-11 and TC-38 in the team documents aligned; 69 tests passing

- **2026-10-25 – FR-31: availability in the chosen store and referral; app switched to the team workbook.**
  The app now reads the team's `data/product_catalogue.xlsx` (5 stores, sheet
  "Store stock") and `data/plz_coordinates.csv` (WZB, Apache-2.0) as required by
  DR-01/DR-08; header rows, legend and note rows are handled. The rule-engine
  columns (`variant_group`, `pack_qty`, `pack_unit`, `specs`, `data_note`) were
  added to the *Products* sheet by the new `tools/add_rule_columns.py` (other cells
  unchanged; P051 wall types filled, flagged). Removed the superseded
  `app/data/baumarkt-buddy-data.xlsx`, `app/data/plz-de.csv` and their build
  scripts. New `availability()` in `rules.js`: an out-of-stock or not-carried item
  stays on the list, marked, with the nearest other store with qty > 0 (from the
  PLZ centre, ≤ 50 km) or "please ask staff"; never a substitute. Store list shows
  address, opening hours and a fictional-partnership/sample-data note. TC-38 is
  implemented **without preselection** (RB-16). Tests updated to the 5 stores and
  extended by TC-34…TC-38, RB-21 (69 passing). README and data/README updated;
  local testing now serves the repository root.
  *Why:* team requirement FR-31 (round 5) and DR-01 data merge.
  *Prompt:* "Yes, implement FR-31, TC-38 without preselection."

- **2026-10-25 – Team documents aligned with "no store preselection":** FR-29 text
  and simple-language column (`requirements/requirements-R1-MVP.md`, plus a round-6
  team comment), design element D-11 (`data/03-design.md`) and TC-38
  (`test/01_test_cases.md`) now say: stores listed nearest first, the customer taps
  one, nothing is preselected (SR-06, RB-16).
  *Why:* the documents still described an automatic preselection that the team
  decided against.
  *Prompt:* "Yes, update the team documents."
- **2026-10-25 – Design update 2: DIY-store app layout and fonts.**
  `app/style.css` rewritten: white page; orange #FF7313 header band with diagonal
  edge, title in a white box, round language button and toolbox mark; Barlow
  Condensed headlines and buttons, Barlow body text (self-hosted, OFL); black
  pill primary buttons and outlined secondary buttons; text field in a pill
  search-field look with a black round microphone button; project buttons as
  outlined tiles with line icons; flat product rows with big prices and small
  cents, availability dot (green = in stock); total in a black price box; bottom
  tab bar Start · Store · List (new `renderNav` in `app.js`). Contrast kept
  (black on orange, darker orange for text). The requested OBI beaver image was
  not used: it is a trademark and mascot of a real company.
  *Why:* the team wants the look of a familiar DIY-store app.
  *Prompt:* "These are screenshots of the OBI app, please adapt fonts / layout /
  design accordingly" and "put the beaver / the photo instead of the B".

## Milestone: Design update – brand orange #FF7313 – 2026-10-25
Summary (same as the pull request):
- Brand orange changed to #FF7313 and app look modernised in a clean DIY-store app style
- Accessible colour use: dark text on orange buttons, darker orange for text
- Compact phone header with the sample-data badge under the title

- **2026-10-25 – Design: brand orange #FF7313, DIY-store app look.**
  New colour tokens in `app/style.css` (brand #FF7313, pressed #E85F00, soft
  #FFF1E6, orange text #B84A00); white header with orange bottom line and
  brand mark; pill-shaped buttons; white cards with soft shadows on a light
  grey page; round icon tiles for the project buttons; orange section markers.
  Dark text on orange (6.4:1) because white on #FF7313 only reaches 2.7:1
  (WCAG needs 4.5:1). Sample-data badge moved under the title so the phone
  header fits from 320 px. Only general style cues of DIY-store apps – no logo,
  name or other brand assets of a real company.
  *Why:* the team wants the app to look like a familiar DIY-store app.
  *Prompt:* "Design changes: please change the orange to hex #FF7313 and take
  the OBI app design as orientation."

## Milestone: Release 1 (MVP) – Baumarkt-Buddy web app – 2026-10-25
Summary (same as the pull request):
- Static web app in `app/` (HTML/CSS/vanilla JS, no build step) for GitHub Pages
- Single Excel data file with products, 3 sample stores and per-store stock/aisles; PLZ table from OpenGeoDB
- Deterministic rule engine with 2 project templates (hang a shelf, hang a picture) and all R1 safety rules
- Free-text entry with exchangeable AI adapter (template default, mock, optional proxy) and template fallback
- Voice input (German/English) with consent, editable transcript and confirmation by tap
- Optional PLZ store selection that never selects a store automatically; full list without a store
- English/German UI, transparency notices, evidence log
- 62 automated tests in `tests.html`, including all 14 release-blocking tests of R1

- **2026-10-25 – R1 stage 1: data model, rule engine, templates, safety rules, tests.**
  Added the static app in `app/` (index.html, style.css, app.js, rules.js,
  data.js, i18n.js, config.js, tests.html), the single sample data file
  `app/data/baumarkt-buddy-data.xlsx` (Products, Stores, Stock; 3 sample stores)
  built by `tools/build_sample_data.py`, the templates "Hang a shelf" and
  "Hang a picture" with rule IDs and review status, safety word lists, vendored
  SheetJS, and 32 automated tests (RB-01, -03, -04, -06, -07, -08, -09, -13,
  -15, -17, SR-11 and more). README documents architecture, data schema and testing.
  *Why:* first stage of Release 1 – deterministic, safety-first core before AI,
  voice and PLZ are added.
  *Prompt:* "Build Release 1 (MVP) of Baumarkt-Buddy in stages; stage 1 = data
  model, Excel loading, rule engine, 2 templates, safety rules and tests (buttons only)."
- **2026-10-25 – Documented language decision:** English stays the default UI
  language, German via the toggle (config.js comment, README).
  *Why:* NFR-09 in the requirements says "German default"; the team confirmed
  English, so the deviation is recorded.
  *Prompt:* "English is still fine."
- **2026-10-25 – R1 stage 2: free text, AI adapter, follow-up questions, fallback.**
  Added `app/ai-adapter.js` with the modes `template` (default, keyword matching,
  no AI), `mock` (fixed test answers) and `proxy`; strict schema validation of
  every answer; G0 high-risk check before the AI; "Did we understand you?" screen
  and pre-filled guesses that must be confirmed; fallback to the templates that
  keeps the text and recognised values; redaction of PLZ/phone/e-mail. Added the
  optional Cloudflare Worker in `proxy/` (API key as secret, CORS allowlist,
  rate limit, logs off, structured JSON output). 10 new tests (42 passing).
  *Why:* stage 2 of Release 1. Team decision: no paid AI for R1 – default mode is
  `template`; the proxy is built but not active (option a).
  *Prompt:* "We thought we'd use option 1: dictation only (free) … a) please, then
  continue with stage 2."
- **2026-10-25 – CODEOWNERS covers `proxy/` and `tools/`:** changes to the AI
  proxy and the data build script need approval by @st854d2gpb-create.
  *Why:* the proxy handles the API key setup and rate limits; it is app code.
  *Prompt:* "Yes, add CODEOWNERS and continue with stage 3."
- **2026-10-25 – R1 stage 3: voice input (German and English).**
  Added `app/speech.js` (browser Web Speech API, `de-DE`/`en-US`, interim
  results) and the microphone button next to the text field: in-app consent
  naming the browser speech service, recording indicator, stop by tap or Esc,
  live editable transcript that is only processed after tapping "Continue",
  spoken values as guesses with read-back, hints for unsupported browsers and
  denied/failed microphones. Privacy notice on the start screen names the
  speech services. 10 new tests with a simulated speech API (52 passing),
  including RB-18, RB-19 and RB-20; manual real-speech checklist in README.
  *Why:* stage 3 of Release 1 (FR-25, FR-27, SR-11, NFR-04).
  *Prompt:* "Yes, add CODEOWNERS and continue with stage 3."
- **2026-10-25 – R1 stage 4: PLZ and store selection, path without a store.**
  Added the PLZ reference table `app/data/plz-de.csv` (8,216 postcodes, OpenGeoDB
  0.2.5a, public domain) built by `tools/build_plz_table.py`; store coordinates
  in the Excel file now come from this table. New optional store screen: PLZ
  checked in code (5 digits + in table), stores within 50 km sorted by distance
  (max. 5), otherwise message + full list; a store is only ever selected by tap.
  Shopping list shows the chosen store with "Change store", or "Add postcode"
  without one. PLZ stays on the device. Missing PLZ table or store sheets → app
  continues without a store. 8 new tests (60 passing, none pending).
  *Why:* stage 4 of Release 1 (FR-29, FR-30, DR-08, RB-16). Team confirmed
  50 km / 5 stores and OpenGeoDB as PLZ source.
  *Prompt:* "Fine as is, use OpenGeoDB and continue with stage 4."
- **2026-10-25 – R1 stage 5: polish, transparency, README, GitHub Pages entry.**
  Responsive audit at 320/390/768/1280 px (header wraps on very small phones,
  two-column list on laptops, no overflow, all touch targets ≥ 44 px); "How this
  list was made" note with the template's review status; root `index.html`
  forwarding to `app/` and `.nojekyll` for GitHub Pages; README rewritten
  (description, architecture, usage, AI modes, voice support, store selection,
  local testing, Pages, proxy, data sources incl. PLZ licence, full table
  requirement → implementation → test). 2 new tests (62 passing).
  *Why:* stage 5 of Release 1 (NFR-01, NFR-05, NFR-09, delivery).
  *Prompt:* "Yes, continue with stage 5."

## Milestone: App code ownership – 2026-10-25
- **2026-10-25 – Added .github/CODEOWNERS:** @st854d2gpb-create owns the
  app code (`app/`, `APP`), deployment and repo config (`.github/`) and
  `CLAUDE.md`.
  *Why:* only the project lead should approve changes to the app; the team
  can keep reviewing requirements, data, docs and pitch among themselves.
  *Prompt:* "Only I want to approve app changes."

## Milestone: Working rules and change log – 2026-10-25
- **2026-10-25 – Completed CLAUDE.md:** added Git, pull request and change
  documentation rules (previously only the merge section was present).
  *Why:* so every vibe-coding change is committed, described and traceable.
  *Prompt:* "Create a complete CLAUDE.md adapted to the Claude Code
  branch/pull-request workflow."
- **2026-10-25 – Added CHANGELOG.md:** this file.
  *Why:* documents the vibe-coding process for the final report.
