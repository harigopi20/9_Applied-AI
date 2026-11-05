/*
 * Baumarkt-Buddy – D-13 / D-14 mounting logic (released flow since 5 Nov 2026).
 *
 * Active by default. "?logic=old" in the URL shows the previous flow for comparison.
 * tests.html keeps it off (its UI tests drive the previous flow) and loads this file
 * for the pure calculation (calc) only. Off → BBPreviewD13 = { active: false, calc }.
 *
 * Everything of the normal app stays (project page, free text, voice, store
 * search, list, shopping by aisle, save/share, "I already have this", other
 * projects). Only these projects use the new flow
 *   wall → size → summary → plug options "max. X kg" → confirm → list:
 *   hang a shelf (D-13), hang a wall cabinet and anti-tip (D-14).
 * Hang a picture keeps its weight question (D-2) – its normal flow is used.
 *
 * The new flow hands the normal list screen a result in the same shape as
 * BBRules.evaluate, so every list feature works unchanged.
 * Every load value comes from sheet "System ratings" (data.mounting, DR-09) via
 * BBRules.fixingChain (R-17) and BBRules.capacity (R-18); rail ratings from the
 * rail products (same values as sheet Cabinet). NFR-07: text via textContent only.
 */
(function (root) {
  "use strict";

  // On by default (team decision 5 Nov 2026). Off with "?logic=old" and in tests.html: then only the
  // pure calculation is exported (BBPreviewD13.calc) and no screen, hook or style of this file is active.
  const active = !!(root.location && new URLSearchParams(root.location.search).get("logic") !== "old" && !/tests\.html$/.test(root.location.pathname));

  const CFG = root.BB_CONFIG;
  const R = root.BBRules;
  const P = CFG.preview.d13;
  const FT = CFG.mounting.fixingTypes;

  // ---------------------------------------------------------------------
  // Texts (EN default, DE)
  // ---------------------------------------------------------------------
  const TEXT = {
    en: {
      prj_shelf: "Hang a shelf", prj_cabinet: "Hang a wall cabinet", prj_antitip: "Anchor a shelf to the wall",
      step_of: "{p} · {n} of 2",
      wall_q: "What is the wall made of?", wall_label: "Wall",
      wall_concrete: "Concrete", wall_solid_brick: "Solid brick", wall_brick_unknown: "Perforated brick / brick of unknown type",
      wall_aerated_concrete: "Aerated concrete", wall_plasterboard: "Plasterboard", wall_wood: "Wood (solid or stud)", wall_unknown: "I don't know",
      size_q_shelf: "How big is your shelf?", size_q_cabinet: "How big is your cabinet?", size_q_antitip: "How big is the furniture?",
      length: "Length", width: "Width", depth: "Depth", height: "Height",
      limit_max: "max. {max} cm", too_deep: "Too deep for this wall: max. {max} cm. Please adjust the depth.",
      heavy: "This cabinet is estimated at {w} kg. This wall ({wall}) takes a cabinet of max. {max} kg, because the fixing must hold 1.5 × the cabinet weight.",
      heavy_resize: "Change the size:", use_size: "{dim} {v} cm",
      heavy_weigh: "Or weigh your cabinet – our estimate is on the safe side, real cabinets are often lighter.", weigh_btn: "I'll weigh my cabinet",
      weigh_label: "My cabinet weighs", weigh_tip: "Tip: stand on a bathroom scale holding the cabinet, then subtract your own weight.",
      weigh_ok: "✓ {kg} kg is within the limit of {max} kg – Continue shows the plugs.",
      weigh_too_heavy: "{kg} kg is over the limit of {max} kg for this wall.",
      heavy_ask: "Or ask a store associate.", heavy_continue: "Please change the size or enter the weight you weighed.",
      weight_weighed: "Weight: {kg} kg (weighed by you; estimate from the size {est} kg)",
      n_weighed: "Cabinet weight given by the customer: {kg} kg (estimate from the size: {est} kg).",
      use_max: "Use {max} cm", width_max: "Too wide: wall cabinets are max. {max} cm wide.",
      antitip_too_deep: "Deeper than {max} cm: please ask a store associate.",
      enter_number: "Please enter a number greater than 0 for every field.", defect_required: "Please tick at least one box for the used parts.",
      next: "Continue", confirm: "Confirm", start_over: "Start again",
      board_title: "Your board", board: "Board {l} × {d} mm", board_none: "No board in the catalogue for this size – please ask a store associate.",
      cut: "Other length? The board is cut to size in the store.", split: "Over {max} cm: split into {n} equal shelves of {len} cm each (or cut).",
      brackets: "{n} brackets · arm {arm} mm (follow the plug)", brackets_n: "{n} brackets",
      thickness_note: "Board thickness follows the plug you choose (18 mm when the thin board is strong enough, else 25 mm).",
      cabinet_title: "Your cabinet", weight: "Estimated weight: {kg} kg", weight_note: "from the size (panels × {k} kg/m²), safety margin included",
      rail: "Mounting rail {len} mm · {n} fixing points",
      antitip_title: "Your anti-tip set", antitip_plug: "Depth {d} cm → plug {mm} mm", antitip_anchor: "Depth {d} cm → cavity anchor {a}",
      antitip_tall: "Height {h} cm (over {t} cm) → one size bigger and 2 fixings per kit",
      antitip_kits: "Width {w} cm → {n} kit(s) (1 per {per} cm)", antitip_fix_total: "{n} fixing(s) in total",
      plug_title: "Choose your plug", plug_label: "Plug", fixing_label: "Fixing", plug_q_shelf: "How much will you put on it?", plug_q_cabinet: "How much will you put inside?",
      plug_kg: "up to {kg} kg", plug_kg_contents: "up to {kg} kg contents",
      plug_mm: "{mm} mm plug", anchor_mm: "cavity anchor {t} ({mm} mm hole)", wood_mm: "{mm} mm screw size (no plug, pilot hole)",
      plug_follow: "Screws, drill bit and brackets follow automatically.", plug_hidden: "{list} hidden: too small for this cabinet.",
      plug_none_shelf: "No plug carries this shelf on this wall. Try a shallower shelf.",
      plugboard_share: "Plasterboard: {cap} kg is for the whole wall section – shared by all shelves on it.",
      choose_plug: "Please choose a plug.", choose_wall: "Please choose the wall type.",
      fix_title: "How to fix it", fix_wall: "{wall} wall", fix_pieces: "{what} · {n} pieces",
      stud_hint: "Plasterboard: if you find a stud behind it, fix into the stud with a wood screw – that holds better.",
      confirm_title: "Please confirm", confirm_shelf: "I will load max. {kg} kg on the shelf.", confirm_cabinet: "I will put max. {kg} kg inside.",
      confirm_antitip: "I fix it to the top or side panel – never to the thin back panel.",
      safety_incl: "Safety factor {f} already included.",
      glass_hint: "Glass doors or a stone top? Please ask a store associate.",
      stop_title: "Please ask a store associate", stop_unknown_wall: "Without the wall type no plug can be chosen safely.",
      stop_cabinet_heavy: "Your cabinet weighs about {w} kg. For safety, the wall fixing must hold 1.5 × that = {need} kg, but this wall holds max. {best} kg (strongest plug).",
      stop_cabinet_heavy_weighed: "You weighed your cabinet at {w} kg. For safety, the wall fixing must hold 1.5 × that = {need} kg, but this wall holds max. {best} kg (strongest plug).",
      n_confirmed_shelf: "You confirmed: max. {kg} kg on the shelf ({plug}). Safety factor {f} included.",
      n_confirmed_cabinet: "You confirmed: max. {kg} kg inside the cabinet (cabinet ≈ {w} kg, {plug}). Safety factor {f} included.",
      n_hammer: "Drilling: hammer mode {mode} for this wall.", on: "ON", off: "OFF", n_pilot: "Wood: pre-drill a pilot hole, no wall plug.",
      method: "Mounting logic D-13 / D-14: plug options from sheet System ratings",
      l_board: "Shelf board", l_bracket: "Shelf bracket", l_plug: "Wall plug", l_anchor: "Cavity anchor", l_screw: "Screw",
      l_bit: "Drill bit", l_drill: "Drill", l_level: "Spirit level", l_rail: "Mounting rail", l_hanger: "Cabinet hangers", l_kit: "Anti-tip kit"
    },
    de: {
      prj_shelf: "Regal aufhängen", prj_cabinet: "Hängeschrank aufhängen", prj_antitip: "Regal an der Wand sichern",
      step_of: "{p} · {n} von 2",
      wall_q: "Woraus ist die Wand?", wall_label: "Wand",
      wall_concrete: "Beton", wall_solid_brick: "Vollziegel", wall_brick_unknown: "Lochziegel / unbekannter Ziegel",
      wall_aerated_concrete: "Porenbeton", wall_plasterboard: "Gipskarton", wall_wood: "Holz (massiv oder Ständer)", wall_unknown: "Weiß ich nicht",
      size_q_shelf: "Wie groß ist dein Regal?", size_q_cabinet: "Wie groß ist dein Schrank?", size_q_antitip: "Wie groß ist das Möbel?",
      length: "Länge", width: "Breite", depth: "Tiefe", height: "Höhe",
      limit_max: "max. {max} cm", too_deep: "Zu tief für diese Wand: max. {max} cm. Bitte passe die Tiefe an.",
      heavy: "Dieser Schrank wiegt geschätzt {w} kg. Diese Wand ({wall}) trägt einen Schrank von max. {max} kg, weil die Befestigung das 1,5-fache Schrankgewicht halten muss.",
      heavy_resize: "Größe ändern:", use_size: "{dim} {v} cm",
      heavy_weigh: "Oder wiege deinen Schrank – unsere Schätzung ist vorsichtig, echte Schränke sind oft leichter.", weigh_btn: "Ich wiege meinen Schrank",
      weigh_label: "Mein Schrank wiegt", weigh_tip: "Tipp: Stell dich mit dem Schrank auf eine Personenwaage und zieh dein eigenes Gewicht ab.",
      weigh_ok: "✓ {kg} kg liegt im Limit von {max} kg – „Weiter“ zeigt die Dübel.",
      weigh_too_heavy: "{kg} kg liegt über dem Limit von {max} kg für diese Wand.",
      heavy_ask: "Oder frag eine Fachberatung im Markt.", heavy_continue: "Bitte ändere die Größe oder gib das gewogene Gewicht ein.",
      weight_weighed: "Gewicht: {kg} kg (von dir gewogen; Schätzung aus der Größe {est} kg)",
      n_weighed: "Schrankgewicht vom Kunden angegeben: {kg} kg (Schätzung aus der Größe: {est} kg).",
      use_max: "{max} cm übernehmen", width_max: "Zu breit: Hängeschränke sind max. {max} cm breit.",
      antitip_too_deep: "Tiefer als {max} cm: bitte frag eine Fachberatung im Markt.",
      enter_number: "Bitte gib in jedes Feld eine Zahl größer als 0 ein.", defect_required: "Bitte kreuze bei den gebrauchten Teilen mindestens ein Feld an.",
      next: "Weiter", confirm: "Bestätigen", start_over: "Neu starten",
      board_title: "Dein Brett", board: "Brett {l} × {d} mm", board_none: "Kein Brett im Katalog für diese Größe – bitte frag im Markt.",
      cut: "Andere Länge? Das Brett wird im Markt zugeschnitten.", split: "Über {max} cm: in {n} gleiche Regale à {len} cm teilen (oder zuschneiden).",
      brackets: "{n} Träger · Arm {arm} mm (passend zum Dübel)", brackets_n: "{n} Träger",
      thickness_note: "Die Brettstärke folgt dem Dübel (18 mm, wenn das dünne Brett reicht, sonst 25 mm).",
      cabinet_title: "Dein Schrank", weight: "Geschätztes Gewicht: {kg} kg", weight_note: "aus der Größe (Platten × {k} kg/m²), Sicherheitsreserve enthalten",
      rail: "Montageschiene {len} mm · {n} Befestigungspunkte",
      antitip_title: "Dein Kippschutz", antitip_plug: "Tiefe {d} cm → Dübel {mm} mm", antitip_anchor: "Tiefe {d} cm → Hohlraumdübel {a}",
      antitip_tall: "Höhe {h} cm (über {t} cm) → eine Größe stärker und 2 Befestigungen pro Set",
      antitip_kits: "Breite {w} cm → {n} Set(s) (1 pro {per} cm)", antitip_fix_total: "{n} Befestigung(en) insgesamt",
      plug_title: "Wähle deinen Dübel", plug_label: "Dübel", fixing_label: "Befestigung", plug_q_shelf: "Wie viel soll darauf?", plug_q_cabinet: "Wie viel soll hinein?",
      plug_kg: "bis {kg} kg", plug_kg_contents: "bis {kg} kg Inhalt",
      plug_mm: "{mm}-mm-Dübel", anchor_mm: "Hohlraumdübel {t} ({mm}-mm-Loch)", wood_mm: "{mm}-mm-Schraubengröße (kein Dübel, vorbohren)",
      plug_follow: "Schrauben, Bohrer und Träger passen automatisch dazu.", plug_hidden: "{list} ausgeblendet: zu schwach für diesen Schrank.",
      plug_none_shelf: "Kein Dübel trägt dieses Regal an dieser Wand. Versuch ein weniger tiefes Regal.",
      plugboard_share: "Gipskarton: {cap} kg gelten für den ganzen Wandabschnitt – für alle Regale darauf zusammen.",
      choose_plug: "Bitte wähle einen Dübel.", choose_wall: "Bitte wähle die Wandart.",
      fix_title: "So wird befestigt", fix_wall: "Wand: {wall}", fix_pieces: "{what} · {n} Stück",
      stud_hint: "Gipskarton: Findest du dahinter einen Ständer, schraube mit einer Holzschraube in den Ständer – das hält besser.",
      confirm_title: "Bitte bestätigen", confirm_shelf: "Ich belaste das Regal mit max. {kg} kg.", confirm_cabinet: "Ich lege max. {kg} kg hinein.",
      confirm_antitip: "Ich befestige an der oberen oder seitlichen Platte – nie an der dünnen Rückwand.",
      safety_incl: "Sicherheitsfaktor {f} ist schon eingerechnet.",
      glass_hint: "Glastüren oder Steinplatte? Bitte frag eine Fachberatung im Markt.",
      stop_title: "Bitte frag eine Fachberatung im Markt", stop_unknown_wall: "Ohne die Wandart kann kein Dübel sicher gewählt werden.",
      stop_cabinet_heavy: "Dein Schrank wiegt etwa {w} kg. Zur Sicherheit muss die Befestigung das 1,5-fache halten = {need} kg, diese Wand trägt aber max. {best} kg (stärkster Dübel).",
      stop_cabinet_heavy_weighed: "Du hast deinen Schrank mit {w} kg gewogen. Zur Sicherheit muss die Befestigung das 1,5-fache halten = {need} kg, diese Wand trägt aber max. {best} kg (stärkster Dübel).",
      n_confirmed_shelf: "Du hast bestätigt: max. {kg} kg auf dem Regal ({plug}). Sicherheitsfaktor {f} eingerechnet.",
      n_confirmed_cabinet: "Du hast bestätigt: max. {kg} kg im Schrank (Schrank ≈ {w} kg, {plug}). Sicherheitsfaktor {f} eingerechnet.",
      n_hammer: "Bohren: Schlagbohren {mode} bei dieser Wand.", on: "AN", off: "AUS", n_pilot: "Holz: vorbohren, kein Dübel.",
      method: "Montagelogik D-13 / D-14: Dübel-Optionen aus Blatt System ratings",
      l_board: "Regalboden", l_bracket: "Regalträger", l_plug: "Dübel", l_anchor: "Hohlraumdübel", l_screw: "Schraube",
      l_bit: "Bohrer", l_drill: "Bohrmaschine", l_level: "Wasserwaage", l_rail: "Montageschiene", l_hanger: "Schrankaufhänger", l_kit: "Kippsicherung"
    }
  };
  const lang = () => (root.BBI18n.getLang() === "de" ? "de" : "en");
  function fill(s, vars) {
    Object.entries(vars || {}).forEach(([k, v]) => { s = s.split("{" + k + "}").join(String(v)); });
    return s;
  }
  const tr = (key, vars) => fill(TEXT[lang()][key] !== undefined ? TEXT[lang()][key] : (TEXT.en[key] || key), vars);
  /** Both languages, for texts stored in the result (the list switches language without a re-check). */
  const both = (key, vars) => ({ en: fill(TEXT.en[key], vars && vars.en ? vars.en : vars), de: fill(TEXT.de[key], vars && vars.de ? vars.de : vars) });
  const num = (n, l) => new Intl.NumberFormat((l || lang()) === "de" ? "de-DE" : "en-GB", { maximumFractionDigits: 2 }).format(n);

  // ---------------------------------------------------------------------
  // Calculation (pure – no DOM). m = data.mounting, cat = data.catalogue
  // ---------------------------------------------------------------------
  const byVariant = (cat, v) => cat.all.filter((p) => p.variant_group === v);
  const chainOf = (m, cat, wall, mm) => R.fixingChain(wall, mm, m, cat, FT);

  /** Shelf (D-13): board, brackets, plug options with max. kg (R-17, R-18). */
  function shelfPlan(m, cat, wall, lengthCm, depthCm) {
    const w = m.walls[wall];
    if (depthCm > w.shelfMaxDepthCm) return { tooDeep: true, maxDepthCm: w.shelfMaxDepthCm };
    const shelves = lengthCm > P.maxShelfLengthCm ? Math.ceil(lengthCm / P.maxShelfLengthCm) : 1;
    const segCm = Math.round((lengthCm / shelves) * 10) / 10;
    const boards = byVariant(cat, P.variants.board)
      .filter((b) => b.specs.length_mm >= segCm * 10 && b.specs.depth_mm >= depthCm * 10)
      .sort((a, b) => a.specs.length_mm - b.specs.length_mm || a.specs.depth_mm - b.specs.depth_mm || a.specs.thickness_mm - b.specs.thickness_mm);
    const board25 = boards.find((b) => b.specs.thickness_mm === 25) || null;
    const bracketsPerShelf = Math.max(2, Math.ceil(segCm / m.bracketSpacingCm) + 1); // sheet System ratings: ROUNDUP(length ÷ 80) + 1, min. 2
    const options = [];
    for (const mm of m.plugSizes) {
      const c = chainOf(m, cat, wall, mm);
      if (!c.ok) continue;
      const cap = R.capacity({ kind: "shelf", wall, plugMm: mm, depthCm, bracketClass: c.bracketClass, boardMm: 25 }, m);
      if (!cap.offered) continue;
      const bracket = byVariant(cat, P.variants.bracket)
        .filter((b) => b.specs.class === c.bracketClass && b.specs.arm_mm >= depthCm * 10)
        .sort((a, b) => a.specs.arm_mm - b.specs.arm_mm)[0] || null;
      if (!bracket || !board25) continue;
      // 18 mm board when it is not the weakest part (same max. kg), else 25 mm (sheet Capacity note)
      const cap18 = R.capacity({ kind: "shelf", wall, plugMm: mm, depthCm, bracketClass: c.bracketClass, boardMm: 18 }, m);
      const thin = cap18.offered && cap18.maxKg === cap.maxKg
        ? boards.find((b) => b.specs.thickness_mm === 18 && b.specs.length_mm === board25.specs.length_mm) : null;
      options.push({ mm, kg: cap.maxKg, cap, chain: c, bracket, board: thin || board25 });
      if (cap.maxKg >= w.wallCapKg) break; // a bigger plug cannot carry more than the wall cap
    }
    return { tooDeep: false, shelves, segCm, board25, bracketsPerShelf, brackets: bracketsPerShelf * shelves, options, wallCapKg: w.wallCapKg };
  }

  /**
   * Wall cabinet (D-14): weight from the size, rail, plug options with max. contents.
   * weighedKg (optional): the weight the customer weighed. Only used when the estimate from
   * the size blocks (CP-D14-W, needs team approval) and only up to maxCabinetKg.
   */
  function cabinetPlan(m, cat, wall, widthCm, depthCm, heightCm, weighedKg) {
    const w = m.walls[wall];
    if (depthCm > w.cabinetMaxDepthCm) return { tooDeep: true, maxDepthCm: w.cabinetMaxDepthCm };
    if (widthCm > P.maxCabinetWidthCm) return { tooWide: true, maxWidthCm: P.maxCabinetWidthCm };
    // Sheet Cabinet: panel surface m² = (2·H·D + 3·W·D + 2·W·H) ÷ 10000; weight = ROUNDUP(surface × kg/m²)
    const surfaceM2 = (2 * heightCm * depthCm + 3 * widthCm * depthCm + 2 * widthCm * heightCm) / 10000;
    const estimateKg = Math.ceil(surfaceM2 * m.cabinet.panelKgPerM2 - 1e-9);
    const weighed = weighedKg > 0;
    const weightKg = weighed ? weighedKg : estimateKg;
    const minKg = weightKg * m.cabinet.minPlugFactor;
    const points = Math.ceil(widthCm / 30 - 1e-9) + 1; // sheet Cabinet: fixing points = ROUNDUP(W ÷ 30) + 1
    const rails = byVariant(cat, P.variants.rail);
    const slots = [...new Set(rails.map((r) => r.specs.slot_mm))].sort((a, b) => a - b);
    const options = [], hidden = [];
    for (const mm of m.plugSizes) {
      const c = chainOf(m, cat, wall, mm);
      if (!c.ok) continue;
      // rail class by slot: the screw must fit (screw Ø ≤ slot − 0.5 mm, R-17); smallest fitting slot
      const slot = slots.find((s) => c.screwMm <= s - R.HOLE_CLEARANCE_MM + 1e-9);
      if (!slot) continue;
      const fitting = rails.filter((r) => r.specs.slot_mm === slot).sort((a, b) => a.specs.rail_length_mm - b.specs.rail_length_mm);
      const rail = fitting.filter((r) => r.specs.rail_length_mm <= widthCm * 10).pop() || fitting[0];
      const cap = R.capacity({ kind: "cabinet", wall, plugMm: mm, depthCm, heightCm, railKg: rail.max_load_kg }, m);
      if (!cap.offered) continue;
      const hanger = byVariant(cat, P.variants.hangers).find((h) => h.specs.class === rail.specs.class) || null;
      const opt = { mm, total: cap.maxKg, kg: Math.max(0, Math.floor(cap.maxKg - weightKg + 1e-9)), cap, chain: c, rail, hanger };
      if (cap.maxKg >= minKg) options.push(opt); else hidden.push(opt);
    }
    // Heaviest cabinet this wall takes: the strongest option must carry min. plug factor × cabinet weight
    const bestTotalKg = Math.max(0, ...options.concat(hidden).map((o) => o.total));
    const maxCabinetKg = Math.floor(bestTotalKg / m.cabinet.minPlugFactor + 1e-9);
    if (weighed && weighedKg > maxCabinetKg) options.length = 0; // weighed, but still too heavy → stop
    return { tooDeep: false, tooWide: false, surfaceM2, estimateKg, weighed, weightKg, minKg, points, options, hidden, capKg: w.cabinetCapKg, bestTotalKg, maxCabinetKg };
  }

  /**
   * Sizes that fit when the estimate blocks: for each of height, width and depth (the other two
   * unchanged) the largest whole cm below the entered value for which a plug is offered.
   * null when none down to minSuggestedSizeCm fits.
   */
  function cabinetSizeFit(m, cat, wall, widthCm, depthCm, heightCm) {
    const size = { width: widthCm, depth: depthCm, height: heightCm };
    const fits = (s) => { const p = cabinetPlan(m, cat, wall, s.width, s.depth, s.height); return !p.tooDeep && !p.tooWide && p.options.length > 0; };
    const out = {};
    ["height", "width", "depth"].forEach((k) => {
      out[k] = null;
      for (let v = Math.ceil(size[k] - 1e-9) - 1; v >= P.minSuggestedSizeCm; v--) {
        if (fits(Object.assign({}, size, { [k]: v }))) { out[k] = v; break; }
      }
    });
    return out;
  }

  /** Anti-tip (D-14): depth → plug size, width → kits, height → stronger + 2 fixings (sheet Anti-tip). */
  function antiTipPlan(m, cat, wall, widthCm, depthCm, heightCm) {
    const rows = m.antiTip.rows.slice().sort((a, b) => a.maxDepthCm - b.maxDepthCm);
    const base = rows.findIndex((r) => depthCm <= r.maxDepthCm);
    if (base < 0) return { tooDeep: true, maxDepthCm: rows[rows.length - 1].maxDepthCm };
    const tall = heightCm > m.antiTip.tallFromCm;
    const basePlug = rows[base].plugMm;
    const plugMm = tall ? (m.plugSizes.find((s) => s > basePlug) || basePlug) : basePlug;
    const anchorRow = tall ? rows[Math.min(base + 1, rows.length - 1)] : rows[base];
    const kits = Math.ceil(widthCm / m.antiTip.widthPerKitCm - 1e-9);
    const perKit = tall ? 2 : 1;
    const plan = { tooDeep: false, tall, basePlug, plugMm, kits, perKit, fixings: kits * perKit, baseAnchor: rows[base].cavityAnchor, anchor: null, chain: null, hammer: m.walls[wall].hammer };
    if (m.walls[wall].fixingType === "cavity_anchor") {
      const anchor = byVariant(cat, P.variants.cavityAnchor).find((p) => String(p.specs.thread).toUpperCase() === anchorRow.cavityAnchor.toUpperCase()) || null;
      const row = anchor ? m.chain[anchor.specs.hole_mm] : null;
      plan.anchor = anchor;
      plan.bit = row ? cat.get(row.masonryBit) : null;
    } else {
      const c = chainOf(m, cat, wall, plugMm);
      plan.chain = c.ok ? c : null;
      plan.bit = c.ok ? c.drillBit : null;
    }
    return plan;
  }

  // ---------------------------------------------------------------------
  // State of the preview flow and the result for the normal list screen
  // ---------------------------------------------------------------------
  let X = null; // context from app.js: state, el, icon, go, render, recompute, resetProject, ...
  // weighing / weighedKg: the customer chose to weigh a cabinet that is too heavy by the estimate (CP-D14-W);
  // checkedSize: the size the background check last saw (another size clears the weighed weight)
  const pv = { project: null, tpl: null, wall: null, size: {}, plan: null, opt: null, weighing: false, weighedKg: null, checkedSize: null, guesses: {} };
  const PROJECTS = {
    hang_shelf: { id: "shelf", key: "prj_shelf" },
    hang_wall_cabinet: { id: "cabinet", key: "prj_cabinet" },
    anchor_shelf_anti_tip: { id: "antitip", key: "prj_antitip" }
  };
  const WALLS = {
    shelf: ["concrete", "solid_brick", "brick_unknown", "aerated_concrete", "plasterboard", "wood"],
    cabinet: ["concrete", "solid_brick", "brick_unknown", "aerated_concrete", "plasterboard", "wood"],
    antitip: ["concrete", "solid_brick", "brick_unknown", "aerated_concrete", "plasterboard"]
  };
  const SIZE_FIELDS = { shelf: ["length", "depth"], cabinet: ["width", "depth", "height"], antitip: ["width", "depth", "height"] };
  const data = () => X.state.data;
  const title = () => tr(PROJECTS[pv.tpl.template_id].key);

  function init(ctx) {
    X = ctx;
    // Own stylesheet file (the page's CSP allows styles from 'self' only, no inline styles)
    if (!document.getElementById("pv-style")) {
      document.head.appendChild(Object.assign(document.createElement("link"), { id: "pv-style", rel: "stylesheet", href: "preview-d13.css" }));
    }
  }

  /** The project's used-item checklist (C-7, fact "condition") from its template; null if it has none (anti-tip). */
  function conditionField() {
    for (const q of (pv.tpl && pv.tpl.questions) || []) {
      for (const f of (q.type === "group" ? q.fields : [q])) if (f.fact === "condition") return f;
    }
    return null;
  }

  /** The three projects with the new logic. */
  const handles = (tpl) => !!(tpl && PROJECTS[tpl.template_id]);
  /** The template object of a finished preview list (built in toList). */
  const owns = (tpl) => !!(tpl && tpl.preview_d13);

  /** Start from a project tile, or from free text / voice (guesses are pre-selected, never confirmed). */
  function start(tpl, guesses) {
    pv.project = PROJECTS[tpl.template_id].id;
    pv.tpl = tpl;
    pv.wall = null; pv.size = {}; pv.plan = null; pv.opt = null; pv.weighing = false; pv.weighedKg = null; pv.checkedSize = null; pv.condition = null;
    const g = guesses || {};
    const wallGuess = g.wall_type && g.wall_type.value;
    const wallMap = { brick: "brick_unknown" };
    const w = wallMap[wallGuess] || wallGuess;
    if (w && WALLS[pv.project].includes(w)) pv.wall = w;
    if (pv.project === "shelf") {
      if (g.shelf_length_cm && Number(g.shelf_length_cm.value) > 0) pv.size.length = Number(g.shelf_length_cm.value);
      if (g.shelf_depth_cm && Number(g.shelf_depth_cm.value) > 0) pv.size.depth = Number(g.shelf_depth_cm.value);
    }
    pv.guessed = !!(pv.wall || Object.keys(pv.size).length);
    X.state.template = null; X.state.result = null; X.state.facts = {}; X.state.owned = new Set(); X.state.overrides = {};
    X.state.recognized = null; X.state.pendingGuesses = {};
    X.go("pv_wall");
  }

  /** "Change" in the facts summary of the list → back into the preview flow (SR-08: everything is re-checked). */
  function edit(questionId) {
    const to = { PV1: "pv_wall", PV2: "pv_size", PV3: pv.project === "antitip" ? "pv_fix" : "pv_plug" }[questionId] || "pv_wall";
    X.go(to);
  }

  /** A preview screen can only be shown while its project data exists (browser back after "Start"). */
  function ready(sc) {
    if (!pv.project) return false;
    if (sc === "pv_wall" || sc === "pv_stop") return true;
    if (sc === "pv_size") return !!pv.wall;
    if (sc === "pv_summary" || sc === "pv_fix") return !!pv.plan;
    if (sc === "pv_plug") return !!(pv.plan && pv.plan.options);
    if (sc === "pv_confirm") return !!(pv.plan && (pv.opt || pv.project === "antitip"));
    return false;
  }

  function optLabel(o, l) {
    const c = o.chain, T = TEXT[l || lang()];
    if (c.fixingType === "cavity_anchor") return fill(T.anchor_mm, { t: c.plug.specs.thread, mm: o.mm });
    if (c.fixingType === "screw") return fill(T.wood_mm, { mm: o.mm });
    return fill(T.plug_mm, { mm: o.mm });
  }
  const lbl = (key) => ({ en: TEXT.en[key], de: TEXT.de[key] });

  /** Template for the list screen: the real project (title, how-to, safety level) + the preview's facts. */
  function listTemplate() {
    const opts = {};
    WALLS[pv.project].forEach((w) => { opts[w] = lbl("wall_" + w); });
    const sizeFields = SIZE_FIELDS[pv.project].map((f) => ({ fact: "pv_" + f + "_cm", type: "number", label: lbl(f), unit: "cm" }));
    if (conditionField()) sizeFields.push(conditionField()); // used parts (C-7) as in the project's template
    const plugLabels = {};
    if (pv.opt) {
      const k = pv.project === "cabinet" ? "plug_kg_contents" : "plug_kg";
      plugLabels[pv.opt.mm] = { en: optLabel(pv.opt, "en") + " – " + fill(TEXT.en[k], { kg: pv.opt.kg }), de: optLabel(pv.opt, "de") + " – " + fill(TEXT.de[k], { kg: pv.opt.kg }) };
    }
    const questions = [
      { id: "PV1", type: "choice", fact: "pv_wall", label: lbl("wall_label"), text: lbl("wall_q"), options: WALLS[pv.project], option_labels: opts },
      { id: "PV2", type: "group", text: lbl("size_q_" + pv.project), fields: sizeFields }
    ];
    if (pv.opt) questions.push({ id: "PV3", type: "choice", fact: "pv_plug", label: lbl("plug_label"), text: lbl("plug_title"), options: [pv.opt.mm], option_labels: plugLabels });
    return Object.freeze(Object.assign({}, pv.tpl, {
      preview_d13: true, version: pv.tpl.version + "+preview-d13",
      questions, methods: [], common_roles: [], segments: null, warnings: [], required_facts: []
    }));
  }

  function listFacts() {
    const f = {}, src = "preview-d13";
    f.pv_wall = R.makeFact(pv.wall, R.STATUS.CONFIRMED, src);
    SIZE_FIELDS[pv.project].forEach((k) => { f["pv_" + k + "_cm"] = R.makeFact(pv.size[k], R.STATUS.CONFIRMED, src); });
    if (pv.opt) f.pv_plug = R.makeFact(pv.opt.mm, R.STATUS.CONFIRMED, src);
    if (conditionField()) f.condition = R.makeFact(pv.condition || [], R.STATUS.CONFIRMED, src);
    return f;
  }

  /** Confirm → the normal list screen (with all its features). */
  function toList() {
    X.state.template = listTemplate();
    X.state.facts = listFacts();
    X.state.owned = new Set();
    X.state.overrides = {};
    X.recompute(false);
  }

  /**
   * Result in the shape of BBRules.evaluate, so viewList / shopping / save / share work unchanged.
   * Called by app.js recompute() for preview lists (also after "I already have this").
   */
  function result(owned) {
    if (!pv.project || !pv.plan) return null;
    const d = data(), m = d.mounting, cat = d.catalogue, sf = m.safetyFactor;
    const tpl = X.state.template;
    const evidence = [];
    const log = (rule, check, res, source) => evidence.push(Object.freeze({ rule_id: rule, check, result: res, source: source || "sheet System ratings (preview D-13/D-14)" }));
    const parts = [];
    const add = (role, section, label, product, units, rule, flags) => parts.push(Object.assign({ role, section, label, product, units, rule }, flags || {}));
    const notices = [{ id: "estimates", rule_id: "NFR-05" }];
    const hammerNotice = (wall, hammer) => {
      if (wall === "wood") notices.push({ id: "pv_pilot", rule_id: "R-17", text: both("n_pilot") });
      else notices.push({ id: "pv_hammer", rule_id: "R-17", text: { en: fill(TEXT.en.n_hammer, { mode: hammer ? TEXT.en.on : TEXT.en.off }), de: fill(TEXT.de.n_hammer, { mode: hammer ? TEXT.de.on : TEXT.de.off }) } });
    };
    const lb = { ownable: true, load_bearing: true };
    let loadKg = null, hammer = false, bitTool = null;
    log("R-17", "wall " + pv.wall, "fixing type " + m.walls[pv.wall].fixingType + ", hammer " + (m.walls[pv.wall].hammer ? "on" : "off"), "sheet Fixing chain");

    if (pv.project === "shelf") {
      const p = pv.plan, o = pv.opt, c = o.chain, n = p.brackets * P.plugsPerBracket;
      loadKg = o.kg; hammer = c.hammer && c.fixingType !== "screw";
      log("R-18", "capacity " + o.mm + " mm @ " + pv.size.depth + " cm", "max. " + o.kg + " kg (f " + num(o.cap.f, "en") + ", limited by " + o.cap.limitedBy + ")");
      log("R-17", "chain " + o.mm + " mm", "screw Ø " + c.screwMm + " → bracket " + c.bracketClass + " (hole " + c.bracketHoleMm + ")", "sheet Fixing chain");
      log("SHELF-Q", "brackets", p.brackets + " (ROUNDUP(" + p.segCm + " ÷ " + m.bracketSpacingCm + ") + 1, ×" + p.shelves + ")");
      add("board", "materials", lbl("l_board"), o.board, p.shelves, "R-18", lb);
      add("bracket", "materials", lbl("l_bracket"), o.bracket, p.brackets, "R-17", lb);
      if (c.plug) add("wall_plug", "materials", lbl("l_plug"), c.plug, n, "R-17");
      if (c.screw) add("screw", "materials", lbl("l_screw"), c.screw, n, "R-17");
      bitTool = c.drillBit;
      notices.push({ id: "pv_confirmed", rule_id: "SR-18", text: { en: fill(TEXT.en.n_confirmed_shelf, { kg: o.kg, plug: optLabel(o, "en"), f: num(sf, "en") }), de: fill(TEXT.de.n_confirmed_shelf, { kg: o.kg, plug: optLabel(o, "de"), f: num(sf, "de") }) } });
      if (p.shelves > 1) notices.push({ id: "pv_split", rule_id: "D-13", text: { en: fill(TEXT.en.split, { max: P.maxShelfLengthCm, n: p.shelves, len: num(p.segCm, "en") }), de: fill(TEXT.de.split, { max: P.maxShelfLengthCm, n: p.shelves, len: num(p.segCm, "de") }) } });
      if (o.board.specs.length_mm !== p.segCm * 10) notices.push({ id: "pv_cut", rule_id: "D-13", text: both("cut") });
      if (pv.wall === "plasterboard") notices.push({ id: "pv_share", rule_id: "SR-13", text: both("plugboard_share", { cap: p.wallCapKg }) });
      add("spirit_level", "tools", lbl("l_level"), cat.get(p.segCm > P.longLevelFromCm ? P.products.spiritLevelLong : P.products.spiritLevel), 1, "FR-37", { ownable: true });
      hammerNotice(pv.wall, c.hammer);
    } else if (pv.project === "cabinet") {
      const p = pv.plan, o = pv.opt, c = o.chain;
      loadKg = o.total; hammer = c.hammer && c.fixingType !== "screw";
      log("R-20", "cabinet weight", (p.weighed ? p.weightKg + " kg weighed by the customer (CP-D14-W); estimate " + p.estimateKg + " kg" : p.weightKg + " kg") + " (" + num(p.surfaceM2, "en") + " m² × " + m.cabinet.panelKgPerM2 + " kg/m²); smallest plug ≥ " + num(p.minKg, "en") + " kg", p.weighed ? "fact:customer + sheets System ratings + Cabinet" : "sheets System ratings + Cabinet");
      log("R-18", "capacity " + o.mm + " mm", "total " + o.total + " kg, contents " + o.kg + " kg (rail " + o.rail.max_load_kg + " kg, f " + num(o.cap.f, "en") + ")");
      add("rail", "materials", lbl("l_rail"), o.rail, 1, "R-17", lb);
      if (o.hanger) add("hangers", "materials", lbl("l_hanger"), o.hanger, o.hanger.pack_qty || 1, "R-17", lb);
      if (c.plug) add("wall_plug", "materials", lbl("l_plug"), c.plug, p.points, "R-17");
      if (c.screw) add("screw", "materials", lbl("l_screw"), c.screw, p.points, "R-17");
      bitTool = c.drillBit;
      notices.push({ id: "pv_confirmed", rule_id: "SR-19", text: { en: fill(TEXT.en.n_confirmed_cabinet, { kg: o.kg, w: num(p.weightKg, "en"), plug: optLabel(o, "en"), f: num(sf, "en") }), de: fill(TEXT.de.n_confirmed_cabinet, { kg: o.kg, w: num(p.weightKg, "de"), plug: optLabel(o, "de"), f: num(sf, "de") }) } });
      if (p.weighed) notices.push({ id: "pv_weighed", rule_id: "CP-D14-W", text: { en: fill(TEXT.en.n_weighed, { kg: num(p.weightKg, "en"), est: p.estimateKg }), de: fill(TEXT.de.n_weighed, { kg: num(p.weightKg, "de"), est: p.estimateKg }) } });
      notices.push({ id: "pv_glass", rule_id: "D-14", text: both("glass_hint") });
      add("spirit_level", "tools", lbl("l_level"), cat.get(pv.size.width > P.longLevelFromCm ? P.products.spiritLevelLong : P.products.spiritLevel), 1, "FR-37", { ownable: true });
      hammerNotice(pv.wall, c.hammer);
    } else {
      const p = pv.plan;
      hammer = p.hammer;
      log("R-21", "anti-tip", p.kits + " kit(s), " + p.fixings + " fixing(s), plug " + p.plugMm + " mm" + (p.anchor ? " / " + p.anchor.specs.thread : "") + (p.tall ? " (tall)" : ""), "sheets System ratings + Anti-tip");
      add("kit", "materials", lbl("l_kit"), cat.get(P.products.antiTipKit), p.kits, "R-21");
      if (p.anchor) add("wall_plug", "materials", lbl("l_anchor"), p.anchor, p.fixings, "R-21");
      if (p.chain && p.chain.plug) add("wall_plug", "materials", lbl("l_plug"), p.chain.plug, p.fixings, "R-21");
      if (p.chain && p.chain.screw) add("screw", "materials", lbl("l_screw"), p.chain.screw, p.fixings, "R-21");
      bitTool = p.bit;
      notices.push({ id: "pv_back_panel", rule_id: "SR-19", text: both("confirm_antitip") });
      if (pv.wall === "plasterboard") notices.push({ id: "pv_stud", rule_id: "D-14", text: both("stud_hint") });
      hammerNotice(pv.wall, p.hammer);
    }
    if (bitTool) add("drill_bit", "tools", lbl("l_bit"), bitTool, 1, "R-17", { ownable: true });
    add("drill", "tools", lbl("l_drill"), cat.get(hammer ? P.products.drillHammer : P.products.drill), 1, "R-09", { ownable: true });
    // Further tools and safety gear exactly as in the project's template (fixed product numbers)
    const realRoles = (pv.tpl.common_roles || []).concat(((pv.tpl.methods || [])[0] || {}).roles || []);
    const seen = new Set(parts.map((x) => x.role));
    realRoles.forEach((r) => {
      const nrs = r.select && r.select.product_nrs;
      if (!nrs || !nrs.length || seen.has(r.role) || P.skipTemplateRoles.includes(r.role)) return;
      seen.add(r.role);
      add(r.role, r.section, r.label, cat.get(nrs[0]), 1, (r.rule_ids || []).join(", ") || "template", { ownable: !!r.ownable, load_bearing: !!r.load_bearing });
    });
    notices.push({ id: "detector_limits", rule_id: "SR-05" });
    notices.push({ id: "no_wall_certification", rule_id: "SR-02" });

    const ownedSet = new Set(owned || []);
    // C-7 / ST-06: a used load-bearing part with a reported defect is not accepted – it stays on the list.
    const defect = Array.isArray(pv.condition) && pv.condition.length > 0;
    const items = parts.map((x) => {
      const wantOwned = !!x.ownable && ownedSet.has(x.role);
      const refused = wantOwned && !!x.load_bearing && defect;
      const isOwned = wantOwned && !refused;
      if (refused) log("ST-06", "customer has " + x.role, "not accepted – defect reported, new part stays on the list", "fact:customer");
      const q = { rule_id: pv.project === "shelf" ? "D-13" : "D-14", units: x.units, packs: null, pack_qty: null, clear: false, estimate: true };
      if (x.product) {
        q.pack_qty = x.product.pack_qty;
        if (q.pack_qty) { q.packs = Math.ceil(x.units / q.pack_qty - 1e-9); q.clear = true; }
        log(x.rule, "quantity " + x.role, q.clear ? x.units + " pcs → " + q.packs + " pack(s) of " + q.pack_qty : "pack size unclear", "catalogue " + x.product.product_nr);
      }
      if (isOwned) log("C-8", "customer has " + x.role, "taken off the list (not counted)", "fact:customer");
      const linePrice = q.clear && x.product.price_eur !== null ? Math.round(q.packs * x.product.price_eur * 100) / 100 : null;
      return {
        role: x.role, section: x.section, label: x.label, rule_ids: [x.rule],
        status: x.product ? "ok" : "none", on_none: "unresolved", overridden: false,
        ownable: !!x.ownable, load_bearing: !!x.load_bearing, owned: isOwned, owned_auto: false, owned_refused: refused,
        required_rating_kg: x.load_bearing && loadKg !== null ? Math.round(loadKg * sf * 10) / 10 : null,
        product: x.product || null, safety_note: x.product ? x.product.safety_note : "", hint: "",
        checks: [], failed_checks: [], quantity: q, line_price: linePrice
      };
    });
    if (items.some((i) => i.owned_refused)) notices.push({ id: "owned_defect", rule_id: "ST-06" });
    if (items.some((i) => i.owned && i.load_bearing)) notices.push({ id: "owned_load_bearing", rule_id: "SR-15" });
    if (defect) (pv.tpl.warnings || []).filter((w) => w.id === "used_item_defect").forEach((w) => {
      notices.push({ id: w.id, rule_id: w.rule_id, text: w.text });
      log(w.rule_id, "warning " + w.id, "shown (" + pv.condition.join(", ") + ")", "template " + pv.tpl.template_id);
    });

    const buy = items.filter((i) => !i.owned);
    const res = {
      template_id: tpl.template_id, template_version: tpl.version, review: tpl.review || null,
      state: "validated", missing_facts: [], blocked: null,
      method: { label: lbl("method"), rule_id: "R-17 / R-18", penetrates_wall: true },
      items, notices, total: { amount: null, reason: null }, subtotals: {}, worst_case: null, segments: null, evidence
    };
    if (buy.some((i) => i.status !== "ok")) { res.state = "incomplete"; res.total.reason = "unresolved_items"; }
    else if (buy.some((i) => i.line_price === null)) res.total.reason = "unclear_pack";
    ["materials", "tools", "safety"].forEach((sec) => {
      const inSec = buy.filter((i) => i.section === sec);
      if (!inSec.length) return;
      const bad = inSec.find((i) => i.status !== "ok" || i.line_price === null);
      res.subtotals[sec] = bad ? { amount: null, reason: bad.status !== "ok" ? "unresolved_items" : "unclear_pack" }
        : { amount: Math.round(inSec.reduce((s, i) => s + i.line_price, 0) * 100) / 100, reason: null };
    });
    if (res.state === "validated" && !res.total.reason) res.total.amount = Math.round(Object.values(res.subtotals).reduce((s, x) => s + x.amount, 0) * 100) / 100;
    log("SR-03", "final state", res.state + (res.total.reason ? " (" + res.total.reason + ")" : ""), "preview D-13/D-14");
    return res;
  }

  // ---------------------------------------------------------------------
  // Screens (the tab bar "Back" goes one step back, as everywhere in the app)
  // ---------------------------------------------------------------------
  const card = (cls, children) => X.el("section", { class: "card " + (cls || ""), "data-preview-screen": X.state.screen }, children.filter(Boolean));
  const btn = (text, onclick, cls, extra) => X.el("button", Object.assign({ type: "button", class: "btn " + (cls || ""), text, onclick }, extra || {}));
  const radio = (group, value) => group.querySelectorAll(".choice").forEach((c) => {
    const on = c.getAttribute("data-value") === String(value);
    c.classList.toggle("selected", on);
    c.setAttribute("aria-checked", on ? "true" : "false");
  });

  function viewWall() {
    let selected = pv.wall;
    const group = X.el("div", { class: "choices", role: "radiogroup", "aria-labelledby": "pv-q" });
    WALLS[pv.project].concat(["unknown"]).forEach((w) => {
      group.appendChild(btn(tr("wall_" + w), () => { selected = w; radio(group, w); },
        "choice" + (w === selected ? " selected" : ""), { role: "radio", "aria-checked": w === selected ? "true" : "false", "data-value": w }));
    });
    const err = X.el("p", { class: "error", role: "alert" });
    return card("question", [
      X.el("p", { class: "muted small", text: tr("step_of", { p: title(), n: 1 }) }),
      X.el("h2", { id: "pv-q", text: tr("wall_q") }),
      group, err,
      X.el("div", { class: "actions" }, [btn(tr("next"), () => {
        if (!selected) { err.textContent = tr("choose_wall"); return; }
        if (selected !== pv.wall) { pv.plan = null; pv.opt = null; }
        pv.wall = selected;
        X.go(selected === "unknown" ? "pv_stop" : "pv_size");
      }, "primary", { id: "pv-next" })])
    ]);
  }

  function maxDepthFor() {
    const m = data().mounting, w = m.walls[pv.wall];
    if (pv.project === "shelf") return w.shelfMaxDepthCm;
    if (pv.project === "cabinet") return w.cabinetMaxDepthCm;
    return Math.max(...m.antiTip.rows.map((r) => r.maxDepthCm));
  }

  /** Max. per size field, shown to the right of the field ("max. 40 cm"); null = no limit. */
  function maxFor(f) {
    if (f === "depth") return maxDepthFor();
    if (f === "width" && pv.project === "cabinet") return P.maxCabinetWidthCm;
    return null;
  }

  /**
   * Size screen. Checked in the background as soon as every field holds a number (no need to press
   * Continue): too deep / too wide → hint with the max.; a cabinet too heavy for the wall → notice
   * on this page with sizes that fit and the option to weigh the cabinet (CP-D14-W).
   */
  function viewSize() {
    const fields = SIZE_FIELDS[pv.project];
    const inputs = {};
    const form = X.el("form", { class: "card question pv-size", novalidate: true, "data-preview-screen": "pv_size" }, [
      X.el("p", { class: "muted small", text: tr("step_of", { p: title(), n: 2 }) }),
      X.el("h2", { text: tr("size_q_" + pv.project) })]);
    fields.forEach((f) => {
      const input = X.el("input", { type: "text", inputmode: "decimal", autocomplete: "off", class: "input", id: "pv-" + f, "aria-label": tr(f) });
      input.value = pv.size[f] !== undefined ? String(pv.size[f]) : "";
      inputs[f] = input;
      const max = maxFor(f);
      const limit = max === null ? null : X.el("span", { class: "pv-limit", id: "pv-" + f + "-max", "data-pv-max": f, "data-pv-depth-max": f === "depth" ? String(max) : null, text: tr("limit_max", { max }) });
      if (limit) input.setAttribute("aria-describedby", limit.id);
      form.appendChild(X.el("div", { class: "field" }, [
        X.el("label", { class: "field-label", for: "pv-" + f, text: tr(f) }),
        X.el("div", { class: "number-row" }, [input, X.el("span", { class: "unit", text: "cm" }), limit])
      ]));
    });
    const notice = X.el("div", { role: "status", "aria-live": "polite" });
    form.appendChild(notice);

    // Used parts (C-7): the same checklist as in the project's template ("None of these" is an explicit answer)
    const cf = conditionField();
    let readCondition = () => null;
    if (cf) {
      const pick = (o) => (o && (o[lang()] || o.en)) || "";
      const ticked = new Set(Array.isArray(pv.condition) ? pv.condition : []);
      const boxes = [];
      const list = X.el("div", { class: "checklist", role: "group", "aria-labelledby": "pv-cond-q" });
      const mk = (value, label) => {
        const input = X.el("input", { type: "checkbox", id: "pv-cond-" + value, class: "check", "data-value": value,
          checked: value === "none" ? (Array.isArray(pv.condition) && !pv.condition.length) : ticked.has(value) });
        input.addEventListener("change", () => {
          if (input.checked) boxes.forEach((b) => { if (b !== input && (value === "none" || b.getAttribute("data-value") === "none")) b.checked = false; });
        });
        boxes.push(input);
        return X.el("label", { for: input.id, class: "check-option" }, [input, X.el("span", { text: label })]);
      };
      cf.options.forEach((o) => list.appendChild(mk(o, pick(cf.option_labels && cf.option_labels[o]) || o)));
      list.appendChild(mk("none", pick(cf.none_label)));
      form.appendChild(X.el("div", { class: "field" }, [X.el("p", { class: "field-label", id: "pv-cond-q", text: pick(cf.label) }), list]));
      // [] = none; undefined = nothing ticked on a required checklist
      readCondition = () => {
        const on = boxes.filter((b) => b.checked).map((b) => b.getAttribute("data-value"));
        if (!on.length) return cf.optional ? [] : undefined;
        return on.filter((v) => v !== "none");
      };
    }
    const err = X.el("p", { class: "error", role: "alert" });
    const m = data().mounting, cat = data().catalogue;

    /** All fields as numbers > 0, else null. */
    const readSize = () => {
      const vals = {};
      for (const f of fields) {
        const n = R.parseDecimal(inputs[f].value);
        if (!(typeof n === "number" && Number.isFinite(n) && n > 0)) return null;
        vals[f] = n;
      }
      return vals;
    };
    const sameSize = (a, b) => !!(a && b) && fields.every((f) => a[f] === b[f]);
    const planFor = (vals, weighedKg) => pv.project === "shelf" ? shelfPlan(m, cat, pv.wall, vals.length, vals.depth)
      : pv.project === "cabinet" ? cabinetPlan(m, cat, pv.wall, vals.width, vals.depth, vals.height, weighedKg)
      : antiTipPlan(m, cat, pv.wall, vals.width, vals.depth, vals.height);
    const parseKg = (s) => { const n = R.parseDecimal(s); return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : null; };

    /** Notice for too heavy: estimate, max., "use this size" buttons, weigh option. */
    function heavyNotice(vals, plan) {
      const box = X.el("div", { class: "hint warn-hint pv-heavy", "data-pv-notice": "too_heavy", "data-pv-weight": String(plan.estimateKg), "data-pv-max-kg": String(plan.maxCabinetKg) });
      box.appendChild(X.el("p", { text: tr("heavy", { w: plan.estimateKg, wall: tr("wall_" + pv.wall), max: plan.maxCabinetKg }) }));
      const fit = cabinetSizeFit(m, cat, pv.wall, vals.width, vals.depth, vals.height);
      const sizes = ["height", "width", "depth"].filter((k) => fit[k] !== null);
      if (sizes.length) {
        box.appendChild(X.el("p", { class: "pv-heavy-label", text: tr("heavy_resize") }));
        box.appendChild(X.el("div", { class: "pv-size-btns" }, sizes.map((k) => btn(tr("use_size", { dim: tr(k), v: fit[k] }), () => {
          inputs[k].value = String(fit[k]);
          check();
          inputs[k].focus();
        }, "small", { "data-pv-use-size": k, "data-value": String(fit[k]) }))));
      }
      box.appendChild(X.el("p", { class: "pv-heavy-label", text: tr("heavy_weigh") }));
      const weighBox = X.el("div", { class: "pv-weigh" });
      const showWeigh = () => {
        const kgInput = X.el("input", { type: "text", inputmode: "decimal", autocomplete: "off", class: "input", id: "pv-weighed", "aria-describedby": "pv-weigh-tip" });
        kgInput.value = pv.weighedKg ? String(pv.weighedKg) : "";
        const verdict = X.el("p", { class: "pv-weigh-verdict", "aria-live": "polite" });
        const judge = () => {
          const kg = parseKg(kgInput.value);
          pv.weighedKg = kg;
          err.textContent = "";
          verdict.replaceChildren();
          if (kg === null) return;
          const ok = kg <= plan.maxCabinetKg;
          verdict.setAttribute("data-pv-weigh", ok ? "ok" : "too_heavy");
          verdict.textContent = tr(ok ? "weigh_ok" : "weigh_too_heavy", { kg: num(kg), max: plan.maxCabinetKg });
        };
        kgInput.addEventListener("input", judge);
        weighBox.replaceChildren(
          X.el("label", { class: "field-label", for: "pv-weighed", text: tr("weigh_label") }),
          X.el("div", { class: "number-row" }, [kgInput, X.el("span", { class: "unit", text: "kg" })]),
          X.el("p", { class: "muted small", id: "pv-weigh-tip", text: tr("weigh_tip") }),
          verdict);
        judge();
        return kgInput;
      };
      if (pv.weighing) showWeigh();
      else weighBox.appendChild(btn(tr("weigh_btn"), () => { pv.weighing = true; showWeigh().focus(); }, "small", { id: "pv-weigh-btn" }));
      box.appendChild(weighBox);
      box.appendChild(X.el("p", { class: "muted small", text: tr("heavy_ask") }));
      return box;
    }

    /** Background check of the entered size; returns { vals, plan } or null while a field is empty. */
    function check() {
      const vals = readSize();
      if (!vals) { notice.replaceChildren(); return null; }
      if (!sameSize(vals, pv.checkedSize)) { pv.weighing = false; pv.weighedKg = null; } // other size = other cabinet
      pv.checkedSize = vals;
      const plan = planFor(vals);
      notice.replaceChildren();
      err.textContent = "";
      // Too deep / too wide → hint with the max., the customer adjusts (no stop, D-13)
      if (plan.tooDeep) {
        notice.appendChild(X.el("p", { class: "hint warn-hint", "data-pv-notice": "too_deep", text: tr(pv.project === "antitip" ? "antitip_too_deep" : "too_deep", { max: plan.maxDepthCm }) }));
        if (pv.project !== "antitip") notice.appendChild(btn(tr("use_max", { max: plan.maxDepthCm }), () => { inputs.depth.value = String(plan.maxDepthCm); check(); }, "small", { "data-pv-use-max": String(plan.maxDepthCm) }));
      } else if (plan.tooWide) {
        notice.appendChild(X.el("p", { class: "hint warn-hint", "data-pv-notice": "too_wide", text: tr("width_max", { max: plan.maxWidthCm }) }));
      } else if (pv.project === "cabinet" && !plan.options.length) {
        notice.appendChild(heavyNotice(vals, plan));
      } else if (pv.project === "cabinet") {
        notice.appendChild(X.el("p", { class: "muted small", "data-pv-weight": String(plan.weightKg), text: tr("weight", { kg: plan.weightKg }) }));
      }
      return { vals, plan };
    }
    fields.forEach((f) => inputs[f].addEventListener("input", check));
    check();

    form.appendChild(err);
    form.appendChild(X.el("div", { class: "actions" }, [X.el("button", { type: "submit", class: "btn primary", id: "pv-next", text: tr("next") })]));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      err.textContent = "";
      const c = check();
      if (!c) { err.textContent = tr("enter_number"); return; }
      const condition = readCondition();
      if (condition === undefined) { err.textContent = tr("defect_required"); return; }
      pv.condition = condition;
      let plan = c.plan;
      if (plan.tooDeep || plan.tooWide) return; // the hint with the max. is on this page
      if (pv.project === "cabinet" && !plan.options.length) {
        if (!pv.weighedKg) { err.textContent = tr("heavy_continue"); return; } // stays here: change the size or weigh
        plan = planFor(c.vals, pv.weighedKg); // weighed: the customer's weight decides (CP-D14-W)
      }
      pv.size = c.vals; pv.plan = plan; pv.opt = null;
      if (pv.project === "cabinet" && !plan.options.length) { X.go("pv_stop"); return; }
      X.go("pv_summary");
    });
    return form;
  }

  const factsList = (items) => X.el("ul", { class: "pv-facts" }, items.filter(Boolean).map((x) => X.el("li", typeof x === "string" ? { text: x } : x)));

  function viewSummary() {
    const p = pv.plan, s = pv.size, m = data().mounting;
    let head, items;
    if (pv.project === "shelf") {
      head = tr("board_title");
      const b = p.board25;
      const arm = p.options.length ? p.options[0].bracket.specs.arm_mm : null;
      items = [
        b ? tr("board", { l: b.specs.length_mm, d: b.specs.depth_mm }) + (p.shelves > 1 ? " × " + p.shelves : "") : { class: "warn-text", text: tr("board_none") },
        arm ? tr("brackets", { n: p.brackets, arm }) : tr("brackets_n", { n: p.brackets }),
        p.shelves > 1 ? { class: "hint warn-hint", "data-pv-split": String(p.shelves), text: tr("split", { max: P.maxShelfLengthCm, n: p.shelves, len: num(p.segCm) }) } : null,
        b && b.specs.length_mm !== p.segCm * 10 ? tr("cut") : null,
        tr("thickness_note")
      ];
    } else if (pv.project === "cabinet") {
      head = tr("cabinet_title");
      items = [
        p.weighed
          ? { "data-pv-weight": String(p.weightKg), "data-pv-weighed": "1", text: tr("weight_weighed", { kg: num(p.weightKg), est: p.estimateKg }) }
          : { "data-pv-weight": String(p.weightKg), text: tr("weight", { kg: p.weightKg }) },
        p.weighed ? null : { class: "muted small", text: tr("weight_note", { k: num(m.cabinet.panelKgPerM2) }) },
        tr("rail", { len: p.options[0].rail.specs.rail_length_mm, n: p.points })
      ];
    } else {
      head = tr("antitip_title");
      items = [
        pv.wall === "plasterboard" ? tr("antitip_anchor", { d: num(s.depth), a: p.baseAnchor }) : tr("antitip_plug", { d: num(s.depth), mm: p.basePlug }),
        p.tall ? { "data-pv-tall": "1", text: tr("antitip_tall", { h: num(s.height), t: m.antiTip.tallFromCm }) } : null,
        { "data-pv-kits": String(p.kits), text: tr("antitip_kits", { w: num(s.width), n: p.kits, per: m.antiTip.widthPerKitCm }) },
        tr("antitip_fix_total", { n: p.fixings })
      ];
    }
    const blocked = pv.project === "shelf" && (!p.board25 || !p.options.length);
    return card("", [
      X.el("h2", { text: head }),
      factsList(items),
      pv.project === "shelf" && !p.options.length ? X.el("p", { class: "hint warn-hint", text: tr("plug_none_shelf") }) : null,
      X.el("div", { class: "actions" }, [btn(tr("next"), () => X.go(pv.project === "antitip" ? "pv_fix" : "pv_plug"), "primary", { id: "pv-next", disabled: blocked })])
    ]);
  }

  function viewPlug() {
    const p = pv.plan;
    let selected = pv.opt ? pv.opt.mm : null;
    const group = X.el("div", { class: "choices", role: "radiogroup", "aria-labelledby": "pv-q" });
    p.options.forEach((o) => {
      group.appendChild(X.el("button", {
        type: "button", class: "btn choice pv-opt" + (o.mm === selected ? " selected" : ""), role: "radio",
        "aria-checked": o.mm === selected ? "true" : "false", "data-value": String(o.mm), "data-kg": String(o.kg),
        onclick: () => { selected = o.mm; radio(group, o.mm); }
      }, [X.el("span", { text: optLabel(o) }), X.el("span", { class: "pv-opt-kg", text: tr(pv.project === "cabinet" ? "plug_kg_contents" : "plug_kg", { kg: o.kg }) })]));
    });
    const err = X.el("p", { class: "error", role: "alert" });
    return card("question", [
      X.el("h2", { id: "pv-q", text: tr("plug_title") }),
      X.el("p", { class: "muted", text: tr(pv.project === "cabinet" ? "plug_q_cabinet" : "plug_q_shelf") }),
      group,
      pv.project === "cabinet" && p.hidden.length ? X.el("p", { class: "muted small", "data-pv-hidden": p.hidden.map((o) => o.mm).join(","), text: tr("plug_hidden", { list: p.hidden.map((o) => o.mm + " mm").join(", ") }) }) : null,
      pv.wall === "plasterboard" && pv.project === "shelf" ? X.el("p", { class: "hint", text: tr("plugboard_share", { cap: p.wallCapKg }) }) : null,
      X.el("p", { class: "muted small", text: tr("plug_follow") }),
      err,
      X.el("div", { class: "actions" }, [btn(tr("next"), () => {
        const o = p.options.find((x) => x.mm === selected);
        if (!o) { err.textContent = tr("choose_plug"); return; }
        pv.opt = o;
        X.go("pv_confirm");
      }, "primary", { id: "pv-next" })])
    ]);
  }

  function viewFix() {
    const p = pv.plan;
    const what = p.anchor ? X.productName(p.anchor) + " " + p.anchor.specs.thread
      : p.chain && p.chain.plug ? X.productName(p.chain.plug) + " " + p.plugMm + " mm"
      : p.chain && p.chain.screw ? X.productName(p.chain.screw) + " " + p.chain.screw.size : "–";
    return card("", [
      X.el("h2", { text: tr("fix_title") }),
      factsList([
        tr("fix_wall", { wall: tr("wall_" + pv.wall) }),
        { "data-pv-fixing": p.anchor ? p.anchor.specs.thread : String(p.plugMm), text: tr("fix_pieces", { what, n: p.fixings }) },
        pv.wall === "plasterboard" ? { class: "hint", text: tr("stud_hint") } : null
      ]),
      X.el("p", { class: "muted small", text: tr("plug_follow") }),
      X.el("div", { class: "actions" }, [btn(tr("next"), () => X.go("pv_confirm"), "primary", { id: "pv-next" })])
    ]);
  }

  function viewConfirm() {
    const m = data().mounting;
    let lines;
    if (pv.project === "shelf") lines = [tr("confirm_shelf", { kg: pv.opt.kg }), optLabel(pv.opt) + " · " + tr("brackets_n", { n: pv.plan.brackets }), tr("safety_incl", { f: num(m.safetyFactor) })];
    else if (pv.project === "cabinet") lines = [tr("confirm_cabinet", { kg: pv.opt.kg }), optLabel(pv.opt) + " · " + tr("rail", { len: pv.opt.rail.specs.rail_length_mm, n: pv.plan.points }), tr("safety_incl", { f: num(m.safetyFactor) })];
    else lines = [tr("confirm_antitip")];
    return card("", [
      X.el("h2", { text: tr("confirm_title") }),
      X.el("p", { class: "state-banner ok", "data-pv-confirm": pv.opt ? String(pv.opt.kg) : "antitip", text: lines[0] }),
      factsList(lines.slice(1)),
      pv.project === "cabinet" ? X.el("p", { class: "hint", text: tr("glass_hint") }) : null,
      X.el("div", { class: "actions" }, [btn(tr("confirm"), toList, "primary", { id: "pv-confirm" })])
    ]);
  }

  function viewStop() {
    let text = tr("stop_unknown_wall");
    const p = pv.plan;
    if (pv.wall !== "unknown" && pv.project === "cabinet" && p) {
      text = tr(p.weighed ? "stop_cabinet_heavy_weighed" : "stop_cabinet_heavy", { w: num(p.weightKg), need: num(p.minKg), best: p.bestTotalKg });
    }
    return X.el("section", { class: "card stop", role: "alert", "data-preview-screen": "pv_stop" }, [
      X.el("h2", { text: tr("stop_title") }),
      X.el("p", { "data-pv-stop": pv.wall === "unknown" ? "unknown_wall" : "too_heavy", text }),
      X.el("div", { class: "actions" }, [btn(tr("start_over"), () => X.resetProject(), "primary")])
    ]);
  }

  /** Hook of app.js for every screen; the released flow adds nothing (the former preview bar is gone). */
  const decorate = (node) => node;

  const PROGRESS = { pv_wall: "questions", pv_size: "questions", pv_summary: "questions", pv_plug: "questions", pv_fix: "questions", pv_confirm: "questions" };
  function progress(sc) {
    if (sc === "pv_stop") return { step: "questions", stop: true };
    return PROGRESS[sc] ? { step: PROGRESS[sc], stop: false } : null;
  }

  const calc = Object.freeze({ shelfPlan, cabinetPlan, cabinetSizeFit, antiTipPlan }); // pure – also for tests.html and the browser console
  if (!active) { root.BBPreviewD13 = Object.freeze({ active: false, calc }); return; }

  root.BBPreviewD13 = Object.freeze({
    active: true,
    workbook: P.workbook,
    init, progress, handles, owns, start, edit, ready, result, decorate,
    screens: Object.freeze({ pv_wall: viewWall, pv_size: viewSize, pv_summary: viewSummary, pv_plug: viewPlug, pv_fix: viewFix, pv_confirm: viewConfirm, pv_stop: viewStop }),
    calc
  });
})(typeof window !== "undefined" ? window : globalThis);
