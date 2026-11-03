/*
 * Baumarkt-Buddy – PREVIEW of the D-13 / D-14 mounting logic.
 *
 * Active ONLY with "?preview=d13" in the URL (http://localhost:8000/app/?preview=d13).
 * Without it this file only sets BBPreviewD13 = { active: false } and app.js runs
 * exactly as before. tests.html does not load this file.
 *
 * Projects: hang a shelf (D-13), hang a wall cabinet and anti-tip (D-14) with the
 * new flow wall → size → summary → plug options "max. X kg" → confirm → list;
 * hang a picture keeps its weight question (D-2) and opens the existing flow.
 *
 * Every load value comes from sheet "System ratings" (data.mounting, DR-09) via
 * BBRules.fixingChain (R-17) and BBRules.capacity (R-18); rail ratings from the
 * rail products (same values as sheet Cabinet). Formulas taken over from the
 * sheets Cabinet and Anti-tip are marked where they are used.
 * NFR-07: all text is set with textContent.
 */
(function (root) {
  "use strict";

  const active = !!(root.location && new URLSearchParams(root.location.search).get("preview") === "d13");
  if (!active) { root.BBPreviewD13 = Object.freeze({ active: false }); return; }

  const CFG = root.BB_CONFIG;
  const R = root.BBRules;
  const P = CFG.preview.d13;
  const FT = CFG.mounting.fixingTypes;

  // ---------------------------------------------------------------------
  // Texts (EN default, DE)
  // ---------------------------------------------------------------------
  const TEXT = {
    en: {
      banner: "Preview D-13 / D-14 – new mounting logic with sample values (System ratings). Not the released app.",
      choose_title: "What would you like to do?",
      choose_group: "Wall mounting",
      choose_note: "Preview shows only the four wall-mounting projects. Open the app without “?preview=d13” for all projects.",
      prj_shelf: "Hang a shelf", prj_cabinet: "Hang a wall cabinet", prj_picture: "Hang a picture", prj_antitip: "Anchor a shelf to the wall (anti-tip)",
      step_of: "{p} · {n} of 2",
      wall_q: "What is the wall made of?",
      wall_concrete: "Concrete", wall_solid_brick: "Solid brick", wall_brick_unknown: "Perforated brick / brick of unknown type",
      wall_aerated_concrete: "Aerated concrete", wall_plasterboard: "Plasterboard", wall_wood: "Wood (solid or stud)", wall_unknown: "I don't know",
      size_q_shelf: "How big is your shelf?", size_q_cabinet: "How big is your cabinet?", size_q_antitip: "How big is the furniture?",
      length: "Length", width: "Width", depth: "Depth", height: "Height",
      depth_ok: "✓ {wall}: up to {max} cm deep", too_deep: "Too deep for this wall: max. {max} cm. Please adjust the depth.",
      use_max: "Use {max} cm", width_max: "Too wide: max. {max} cm (longest mounting rail).",
      antitip_too_deep: "Deeper than {max} cm: please ask a store associate.",
      enter_number: "Please enter a number greater than 0 for every field.",
      next: "Continue", back: "Back", confirm: "Confirm", start_over: "Start again",
      board_title: "Your board", board: "Board {l} × {d} mm", board_none: "No board in the catalogue for this size – please ask a store associate.",
      cut: "Other length? The board is cut to size in the store.", split: "Over {max} cm: split into {n} equal shelves of {len} cm each (or cut).",
      brackets: "{n} brackets · arm {arm} mm (follow the plug)", brackets_n: "{n} brackets",
      thickness_note: "Board thickness follows the plug you choose (18 mm when the thin board is strong enough, else 25 mm).",
      cabinet_title: "Your cabinet", weight: "Estimated weight: {kg} kg", weight_note: "from the size (panels × {k} kg/m²), safety margin included",
      rail: "Mounting rail {len} mm · {n} fixing points",
      antitip_title: "Your anti-tip set", antitip_plug: "Depth {d} cm → plug {mm} mm", antitip_anchor: "Depth {d} cm → cavity anchor {a}",
      antitip_tall: "Height {h} cm (over {t} cm) → one size bigger and 2 fixings per kit",
      antitip_kits: "Width {w} cm → {n} kit(s) (1 per {per} cm)", antitip_fix_total: "{n} fixing(s) in total",
      plug_title: "Choose your plug", plug_q_shelf: "How much will you put on it?", plug_q_cabinet: "How much will you put inside?",
      plug_kg: "up to {kg} kg", plug_kg_contents: "up to {kg} kg contents",
      plug_mm: "{mm} mm plug", anchor_mm: "cavity anchor {t} ({mm} mm hole)", wood_mm: "{mm} mm screw size (no plug, pilot hole)",
      plug_follow: "Screws, drill bit and brackets follow automatically.", plug_hidden: "{list} hidden: too small for this cabinet.",
      plug_none_shelf: "No plug carries this shelf on this wall. Try a shallower shelf.",
      plugboard_share: "Plasterboard: {cap} kg is for the whole wall section – shared by all shelves on it.",
      choose_plug: "Please choose a plug.", choose_wall: "Please choose the wall type.",
      fix_title: "How to fix it", fix_wall: "{wall} wall", fix_pieces: "{what} · {n} pieces",
      stud_hint: "Stud found behind the plasterboard? A wood screw there is stronger.",
      confirm_title: "Please confirm", confirm_shelf: "I will load max. {kg} kg on the shelf.", confirm_cabinet: "I will put max. {kg} kg inside.",
      confirm_antitip: "I fix it to the top or side panel – never to the thin back panel.",
      confirm_parts: "{plug} · {extra}", safety_incl: "Safety factor {f} already included.",
      glass_hint: "Glass doors or a stone top? Please ask a store associate.",
      stop_title: "Please ask a store associate", stop_unknown_wall: "Without the wall type no plug can be chosen safely.",
      stop_cabinet_heavy: "This cabinet is too heavy for this wall: no plug carries 1.5 × the cabinet weight ({kg} kg). Max. {cap} kg on this wall.",
      list_title: "Shopping list – {p}", list_ok: "✓ Checked with the new D-13 / D-14 rules (preview)",
      qty: "{packs} × ({pcs} pcs needed)", qty_one: "{packs} ×",
      hammer_on: "hammer drill: ON", hammer_off: "hammer drill: OFF",
      total: "Total", per_pack: "per pack", sample: "sample", store_none: "No store chosen – aisle and stock not shown.",
      store_add: "Choose store", store_change: "Change store", store_sel: "Store", stock: "Stock", aisle: "Aisle", shelf: "Shelf", na: "n/a",
      new_project: "Plan another project", rules_note: "Loads: sheet System ratings (R-17, R-18). Sample values – the team replaces them with the fischer recommended loads."
    },
    de: {
      banner: "Vorschau D-13 / D-14 – neue Montagelogik mit Beispielwerten (System ratings). Nicht die freigegebene App.",
      choose_title: "Was möchtest du machen?",
      choose_group: "Wandmontage",
      choose_note: "Die Vorschau zeigt nur die vier Wandmontage-Projekte. Ohne „?preview=d13“ siehst du alle Projekte.",
      prj_shelf: "Regal aufhängen", prj_cabinet: "Hängeschrank aufhängen", prj_picture: "Bild aufhängen", prj_antitip: "Regal an der Wand sichern (Kippschutz)",
      step_of: "{p} · {n} von 2",
      wall_q: "Woraus ist die Wand?",
      wall_concrete: "Beton", wall_solid_brick: "Vollziegel", wall_brick_unknown: "Lochziegel / unbekannter Ziegel",
      wall_aerated_concrete: "Porenbeton", wall_plasterboard: "Gipskarton", wall_wood: "Holz (massiv oder Ständer)", wall_unknown: "Weiß ich nicht",
      size_q_shelf: "Wie groß ist dein Regal?", size_q_cabinet: "Wie groß ist dein Schrank?", size_q_antitip: "Wie groß ist das Möbel?",
      length: "Länge", width: "Breite", depth: "Tiefe", height: "Höhe",
      depth_ok: "✓ {wall}: bis {max} cm tief", too_deep: "Zu tief für diese Wand: max. {max} cm. Bitte passe die Tiefe an.",
      use_max: "{max} cm übernehmen", width_max: "Zu breit: max. {max} cm (längste Montageschiene).",
      antitip_too_deep: "Tiefer als {max} cm: bitte frag eine Fachberatung im Markt.",
      enter_number: "Bitte gib in jedes Feld eine Zahl größer als 0 ein.",
      next: "Weiter", back: "Zurück", confirm: "Bestätigen", start_over: "Neu starten",
      board_title: "Dein Brett", board: "Brett {l} × {d} mm", board_none: "Kein Brett im Katalog für diese Größe – bitte frag im Markt.",
      cut: "Andere Länge? Das Brett wird im Markt zugeschnitten.", split: "Über {max} cm: in {n} gleiche Regale à {len} cm teilen (oder zuschneiden).",
      brackets: "{n} Träger · Arm {arm} mm (passend zum Dübel)", brackets_n: "{n} Träger",
      thickness_note: "Die Brettstärke folgt dem Dübel (18 mm, wenn das dünne Brett reicht, sonst 25 mm).",
      cabinet_title: "Dein Schrank", weight: "Geschätztes Gewicht: {kg} kg", weight_note: "aus der Größe (Platten × {k} kg/m²), Sicherheitsreserve enthalten",
      rail: "Montageschiene {len} mm · {n} Befestigungspunkte",
      antitip_title: "Dein Kippschutz", antitip_plug: "Tiefe {d} cm → Dübel {mm} mm", antitip_anchor: "Tiefe {d} cm → Hohlraumdübel {a}",
      antitip_tall: "Höhe {h} cm (über {t} cm) → eine Größe stärker und 2 Befestigungen pro Set",
      antitip_kits: "Breite {w} cm → {n} Set(s) (1 pro {per} cm)", antitip_fix_total: "{n} Befestigung(en) insgesamt",
      plug_title: "Wähle deinen Dübel", plug_q_shelf: "Wie viel soll darauf?", plug_q_cabinet: "Wie viel soll hinein?",
      plug_kg: "bis {kg} kg", plug_kg_contents: "bis {kg} kg Inhalt",
      plug_mm: "{mm}-mm-Dübel", anchor_mm: "Hohlraumdübel {t} ({mm}-mm-Loch)", wood_mm: "{mm}-mm-Schraubengröße (kein Dübel, vorbohren)",
      plug_follow: "Schrauben, Bohrer und Träger passen automatisch dazu.", plug_hidden: "{list} ausgeblendet: zu schwach für diesen Schrank.",
      plug_none_shelf: "Kein Dübel trägt dieses Regal an dieser Wand. Versuch ein weniger tiefes Regal.",
      plugboard_share: "Gipskarton: {cap} kg gelten für den ganzen Wandabschnitt – für alle Regale darauf zusammen.",
      choose_plug: "Bitte wähle einen Dübel.", choose_wall: "Bitte wähle die Wandart.",
      fix_title: "So wird befestigt", fix_wall: "Wand: {wall}", fix_pieces: "{what} · {n} Stück",
      stud_hint: "Ständer hinter dem Gipskarton gefunden? Eine Holzschraube dort hält besser.",
      confirm_title: "Bitte bestätigen", confirm_shelf: "Ich belaste das Regal mit max. {kg} kg.", confirm_cabinet: "Ich lege max. {kg} kg hinein.",
      confirm_antitip: "Ich befestige an der oberen oder seitlichen Platte – nie an der dünnen Rückwand.",
      confirm_parts: "{plug} · {extra}", safety_incl: "Sicherheitsfaktor {f} ist schon eingerechnet.",
      glass_hint: "Glastüren oder Steinplatte? Bitte frag eine Fachberatung im Markt.",
      stop_title: "Bitte frag eine Fachberatung im Markt", stop_unknown_wall: "Ohne die Wandart kann kein Dübel sicher gewählt werden.",
      stop_cabinet_heavy: "Dieser Schrank ist zu schwer für diese Wand: kein Dübel trägt das 1,5-fache Schrankgewicht ({kg} kg). Max. {cap} kg an dieser Wand.",
      list_title: "Einkaufsliste – {p}", list_ok: "✓ Mit den neuen D-13 / D-14 Regeln geprüft (Vorschau)",
      qty: "{packs} × ({pcs} Stück benötigt)", qty_one: "{packs} ×",
      hammer_on: "Schlagbohren: AN", hammer_off: "Schlagbohren: AUS",
      total: "Summe", per_pack: "pro Packung", sample: "Beispiel", store_none: "Kein Markt gewählt – Gang und Bestand nicht angezeigt.",
      store_add: "Markt wählen", store_change: "Markt ändern", store_sel: "Markt", stock: "Bestand", aisle: "Gang", shelf: "Regal", na: "k. A.",
      new_project: "Weiteres Projekt planen", rules_note: "Lasten: Blatt System ratings (R-17, R-18). Beispielwerte – das Team ersetzt sie durch die fischer-Empfehlungen."
    }
  };
  const lang = () => (root.BBI18n.getLang() === "de" ? "de" : "en");
  function tr(key, vars) {
    let s = TEXT[lang()][key];
    if (s === undefined) s = TEXT.en[key] || key;
    Object.entries(vars || {}).forEach(([k, v]) => { s = s.split("{" + k + "}").join(String(v)); });
    return s;
  }
  const fmt = (n) => new Intl.NumberFormat(lang() === "de" ? "de-DE" : "en-GB", { maximumFractionDigits: 1 }).format(n);

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
      if (!bracket) continue;
      // 18 mm board when it is not the weakest part (same max. kg), else 25 mm (sheet Capacity note)
      const cap18 = R.capacity({ kind: "shelf", wall, plugMm: mm, depthCm, bracketClass: c.bracketClass, boardMm: 18 }, m);
      const thin = cap18.offered && cap18.maxKg === cap.maxKg
        ? boards.find((b) => b.specs.thickness_mm === 18 && board25 && b.specs.length_mm === board25.specs.length_mm) : null;
      options.push({ mm, kg: cap.maxKg, cap, chain: c, bracket, board: thin || board25 });
      if (cap.maxKg >= w.wallCapKg) break; // a bigger plug cannot carry more than the wall cap
    }
    return { tooDeep: false, shelves, segCm, board25, bracketsPerShelf, brackets: bracketsPerShelf * shelves, options, wallCapKg: w.wallCapKg };
  }

  /** Wall cabinet (D-14): weight from the size, rail, plug options with max. contents. */
  function cabinetPlan(m, cat, wall, widthCm, depthCm, heightCm) {
    const w = m.walls[wall];
    if (depthCm > w.cabinetMaxDepthCm) return { tooDeep: true, maxDepthCm: w.cabinetMaxDepthCm };
    if (widthCm > P.maxCabinetWidthCm) return { tooWide: true, maxWidthCm: P.maxCabinetWidthCm };
    // Sheet Cabinet: panel surface m² = (2·H·D + 3·W·D + 2·W·H) ÷ 10000; weight = ROUNDUP(surface × kg/m²)
    const surfaceM2 = (2 * heightCm * depthCm + 3 * widthCm * depthCm + 2 * widthCm * heightCm) / 10000;
    const weightKg = Math.ceil(surfaceM2 * m.cabinet.panelKgPerM2 - 1e-9);
    const minKg = weightKg * m.cabinet.minPlugFactor;
    const points = Math.ceil(widthCm / 30 - 1e-9) + 1; // sheet Cabinet: fixing points = ROUNDUP(W ÷ 30) + 1
    const rails = byVariant(cat, P.variants.rail);
    const options = [], hidden = [];
    for (const mm of m.plugSizes) {
      const c = chainOf(m, cat, wall, mm);
      if (!c.ok) continue;
      // rail class by slot: the screw must fit (screw Ø ≤ slot − 0.5 mm, R-17); smallest fitting slot first
      const slots = [...new Set(rails.map((r) => r.specs.slot_mm))].sort((a, b) => a - b);
      const slot = slots.find((s) => c.screwMm <= s - R.HOLE_CLEARANCE_MM + 1e-9);
      if (!slot) continue;
      const fitting = rails.filter((r) => r.specs.slot_mm === slot).sort((a, b) => a.specs.rail_length_mm - b.specs.rail_length_mm);
      const rail = fitting.filter((r) => r.specs.rail_length_mm <= widthCm * 10).pop() || fitting[0];
      const cap = R.capacity({ kind: "cabinet", wall, plugMm: mm, depthCm, heightCm, railKg: rail.max_load_kg }, m);
      if (!cap.offered) continue;
      const hanger = byVariant(cat, P.variants.hangers).find((h) => h.specs.class === rail.specs.class) || null;
      const opt = { mm, total: cap.maxKg, kg: Math.max(0, cap.maxKg - weightKg), cap, chain: c, rail, hanger };
      if (cap.maxKg >= minKg) options.push(opt); else hidden.push(opt);
    }
    return { tooDeep: false, tooWide: false, surfaceM2, weightKg, minKg, points, options, hidden, capKg: w.cabinetCapKg };
  }

  /** Anti-tip (D-14): depth → plug size, width → kits, height → stronger + 2 fixings (sheet Anti-tip). */
  function antiTipPlan(m, cat, wall, widthCm, depthCm, heightCm) {
    const rows = m.antiTip.rows.slice().sort((a, b) => a.maxDepthCm - b.maxDepthCm);
    const base = rows.findIndex((r) => depthCm <= r.maxDepthCm);
    if (base < 0) return { tooDeep: true, maxDepthCm: rows[rows.length - 1].maxDepthCm };
    const tall = heightCm > m.antiTip.tallFromCm;
    const sizes = m.plugSizes;
    const basePlug = rows[base].plugMm;
    const plugMm = tall ? (sizes.find((s) => s > basePlug) || basePlug) : basePlug;
    const anchorRow = tall ? rows[Math.min(base + 1, rows.length - 1)] : rows[base];
    const kits = Math.ceil(widthCm / m.antiTip.widthPerKitCm - 1e-9);
    const perKit = tall ? 2 : 1;
    const fixings = kits * perKit;
    const plan = { tooDeep: false, tall, basePlug, plugMm, kits, perKit, fixings, baseAnchor: rows[base].cavityAnchor, anchor: null, chain: null };
    if (m.walls[wall].fixingType === "cavity_anchor") {
      const anchor = byVariant(cat, P.variants.cavityAnchor).find((p) => String(p.specs.thread).toUpperCase() === anchorRow.cavityAnchor.toUpperCase()) || null;
      const row = anchor ? m.chain[anchor.specs.hole_mm] : null;
      plan.anchor = anchor;
      plan.bit = row ? cat.get(row.masonryBit) : null;
      plan.bitMm = anchor ? anchor.specs.hole_mm : null;
      plan.hammer = m.walls[wall].hammer;
    } else {
      const c = chainOf(m, cat, wall, plugMm);
      plan.chain = c.ok ? c : null;
      plan.bit = c.ok ? c.drillBit : null;
      plan.bitMm = plugMm;
      plan.hammer = m.walls[wall].hammer;
    }
    return plan;
  }

  /** Line of the shopping list: pieces needed → packs (pack_qty from the catalogue). */
  function line(product, pieces, note) {
    if (!product) return null;
    const pack = product.pack_qty || 1;
    const packs = Math.ceil(pieces / pack - 1e-9);
    return { product, pieces, packs, note: note || "", price: product.price_eur === null ? null : Math.round(product.price_eur * packs * 100) / 100 };
  }
  const level = (cat, lengthCm) => cat.get(lengthCm > P.longLevelFromCm ? P.products.spiritLevelLong : P.products.spiritLevel);

  function shelfList(cat, plan, opt) {
    const c = opt.chain, n = plan.brackets * P.plugsPerBracket;
    const hammer = c.fixingType === "screw" ? "" : (c.hammer ? tr("hammer_on") : tr("hammer_off"));
    return [
      line(opt.board, plan.shelves),
      line(opt.bracket, plan.brackets),
      c.plug ? line(c.plug, n) : null,
      c.screw ? line(c.screw, n) : null,
      line(c.drillBit, 1, hammer),
      line(level(cat, plan.segCm), 1)
    ].filter(Boolean);
  }

  function cabinetList(cat, plan, opt, widthCm) {
    const c = opt.chain, n = plan.points;
    return [
      line(opt.rail, 1),
      opt.hanger ? line(opt.hanger, opt.hanger.pack_qty || 1) : null, // one pair
      c.plug ? line(c.plug, n) : null,
      c.screw ? line(c.screw, n) : null,
      line(c.drillBit, 1, c.fixingType === "screw" ? "" : (c.hammer ? tr("hammer_on") : tr("hammer_off"))),
      line(level(cat, widthCm), 1)
    ].filter(Boolean);
  }

  function antiTipList(cat, plan, wall) {
    const out = [line(cat.get(P.products.antiTipKit), plan.kits)];
    if (plan.anchor) out.push(line(plan.anchor, plan.fixings));
    if (plan.chain && plan.chain.plug) out.push(line(plan.chain.plug, plan.fixings));
    if (plan.chain && plan.chain.screw) out.push(line(plan.chain.screw, plan.fixings));
    out.push(line(plan.bit, 1, wall === "wood" ? "" : (plan.hammer ? tr("hammer_on") : tr("hammer_off"))));
    if (wall === "plasterboard") out.push(line(cat.get(P.products.detector), 1, tr("stud_hint")));
    return out.filter(Boolean);
  }

  // ---------------------------------------------------------------------
  // Screens
  // ---------------------------------------------------------------------
  let X = null; // context from app.js: state, el, icon, priceEl, productName, go, render, ...
  const pv = { project: null, wall: null, size: {}, plan: null, opt: null, sizeNotice: null };
  const PROJECTS = { shelf: { key: "prj_shelf", icon: "shelf" }, cabinet: { key: "prj_cabinet", icon: "cabinet" }, antitip: { key: "prj_antitip", icon: "anchor" } };
  const WALLS = {
    shelf: ["concrete", "solid_brick", "brick_unknown", "aerated_concrete", "plasterboard", "wood"],
    cabinet: ["concrete", "solid_brick", "brick_unknown", "aerated_concrete", "plasterboard", "wood"],
    antitip: ["concrete", "solid_brick", "brick_unknown", "aerated_concrete", "plasterboard"]
  };
  const SIZE_FIELDS = { shelf: ["length", "depth"], cabinet: ["width", "depth", "height"], antitip: ["width", "depth", "height"] };
  const data = () => X.state.data;

  function init(ctx) {
    X = ctx;
    // Own stylesheet file (the page's CSP allows styles from 'self' only, no inline styles)
    if (!document.getElementById("pv-style")) {
      document.head.appendChild(Object.assign(document.createElement("link"), { id: "pv-style", rel: "stylesheet", href: "preview-d13.css" }));
    }
  }

  const banner = () => X.el("p", { class: "pv-banner", role: "note", "data-preview": "d13", text: tr("banner") });
  const card = (cls, children) => X.el("section", { class: "card " + (cls || ""), "data-preview-screen": X.state.screen }, [banner()].concat(children));
  const btn = (text, onclick, cls, extra) => X.el("button", Object.assign({ type: "button", class: "btn " + (cls || ""), text, onclick }, extra || {}));
  const backBtn = (to) => btn(tr("back"), () => X.go(to), "", { "data-pv-back": to });
  const title = () => tr(PROJECTS[pv.project].key);

  function startProject(id) {
    pv.project = id; pv.wall = null; pv.size = {}; pv.plan = null; pv.opt = null; pv.sizeNotice = null;
    X.state.result = null; X.state.template = null;
    X.go("pv_wall");
  }

  function viewChoose() {
    const tiles = [
      { id: "shelf", label: tr("prj_shelf"), icon: "shelf", run: () => startProject("shelf") },
      { id: "cabinet", label: tr("prj_cabinet"), icon: "cabinet", run: () => startProject("cabinet") },
      { id: "picture", label: tr("prj_picture"), icon: "picture", run: () => {
        const tpl = data().templates.find((x) => x.template_id === P.pictureTemplate);
        if (tpl) X.startTemplate(tpl, {});
      } },
      { id: "antitip", label: tr("prj_antitip"), icon: "anchor", run: () => startProject("antitip") }
    ];
    const grid = X.el("div", { class: "template-grid" }, tiles.map((x) => X.el("button", { class: "btn template", "data-pv-project": x.id, onclick: x.run }, [
      X.el("span", { class: "template-icon", "aria-hidden": "true" }, [X.icon(x.icon, true)]),
      X.el("span", { class: "template-title", text: x.label })
    ])));
    const out = card("", [
      X.el("h2", { text: tr("choose_title") }),
      X.el("h3", { class: "template-group", text: tr("choose_group") }),
      grid,
      X.el("p", { class: "muted small", text: tr("choose_note") })
    ]);
    if (data().mountingError) out.appendChild(X.el("p", { class: "hint warn-hint", role: "alert", text: data().mountingError }));
    return out;
  }

  function viewWall() {
    let selected = pv.wall;
    const group = X.el("div", { class: "choices", role: "radiogroup", "aria-labelledby": "pv-q" });
    WALLS[pv.project].concat(["unknown"]).forEach((w) => {
      group.appendChild(btn(tr("wall_" + w), () => {
        selected = w;
        group.querySelectorAll(".choice").forEach((c) => {
          const on = c.getAttribute("data-value") === w;
          c.classList.toggle("selected", on);
          c.setAttribute("aria-checked", on ? "true" : "false");
        });
      }, "choice" + (w === selected ? " selected" : ""), { role: "radio", "aria-checked": w === selected ? "true" : "false", "data-value": w }));
    });
    const err = X.el("p", { class: "error", role: "alert" });
    return card("question", [
      X.el("p", { class: "muted small", text: tr("step_of", { p: title(), n: 1 }) }),
      X.el("h2", { id: "pv-q", text: tr("wall_q") }),
      group, err,
      X.el("div", { class: "actions" }, [
        backBtn("choose"),
        btn(tr("next"), () => {
          if (!selected) { err.textContent = tr("choose_wall"); return; }
          pv.wall = selected; pv.plan = null; pv.opt = null;
          X.go(selected === "unknown" ? "pv_stop" : "pv_size");
        }, "primary", { id: "pv-next" })
      ])
    ]);
  }

  function maxDepthFor() {
    const m = data().mounting, w = m.walls[pv.wall];
    if (pv.project === "shelf") return w.shelfMaxDepthCm;
    if (pv.project === "cabinet") return w.cabinetMaxDepthCm;
    return Math.max(...m.antiTip.rows.map((r) => r.maxDepthCm));
  }

  function viewSize() {
    const fields = SIZE_FIELDS[pv.project];
    const inputs = {};
    const form = X.el("form", { class: "card question pv-size", novalidate: true, "data-preview-screen": "pv_size" }, [banner(),
      X.el("p", { class: "muted small", text: tr("step_of", { p: title(), n: 2 }) }),
      X.el("h2", { text: tr("size_q_" + pv.project) })]);
    fields.forEach((f) => {
      const input = X.el("input", { type: "text", inputmode: "decimal", autocomplete: "off", class: "input", id: "pv-" + f, "aria-label": tr(f) });
      input.value = pv.size[f] !== undefined ? String(pv.size[f]) : "";
      inputs[f] = input;
      form.appendChild(X.el("div", { class: "field" }, [
        X.el("label", { class: "field-label", for: "pv-" + f, text: tr(f) }),
        X.el("div", { class: "number-row" }, [input, X.el("span", { class: "unit", text: "cm" })])
      ]));
    });
    const max = maxDepthFor();
    form.appendChild(X.el("p", { class: "hint", "data-pv-depth-max": String(max), text: pv.project === "antitip" ? "" : tr("depth_ok", { wall: tr("wall_" + pv.wall), max }) }));
    const notice = X.el("div", { role: "status", "aria-live": "polite" });
    form.appendChild(notice);
    const showNotice = (n) => {
      notice.replaceChildren();
      if (!n) return;
      notice.appendChild(X.el("p", { class: "hint warn-hint", "data-pv-notice": n.id, text: n.text }));
      if (n.useMax) notice.appendChild(btn(tr("use_max", { max: n.useMax }), () => { inputs.depth.value = String(n.useMax); notice.replaceChildren(); }, "small", { "data-pv-use-max": String(n.useMax) }));
    };
    showNotice(pv.sizeNotice);
    form.appendChild(X.el("div", { class: "actions" }, [backBtn("pv_wall"), X.el("button", { type: "submit", class: "btn primary", id: "pv-next", text: tr("next") })]));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const vals = {};
      for (const f of fields) {
        const n = R.parseDecimal(inputs[f].value);
        if (!(typeof n === "number" && Number.isFinite(n) && n > 0)) { showNotice({ id: "number", text: tr("enter_number") }); return; }
        vals[f] = n;
      }
      pv.size = vals;
      const m = data().mounting, cat = data().catalogue;
      const plan = pv.project === "shelf" ? shelfPlan(m, cat, pv.wall, vals.length, vals.depth)
        : pv.project === "cabinet" ? cabinetPlan(m, cat, pv.wall, vals.width, vals.depth, vals.height)
        : antiTipPlan(m, cat, pv.wall, vals.width, vals.depth, vals.height);
      // Too deep / too wide → hint with the max., the customer adjusts (no stop, D-13)
      if (plan.tooDeep) {
        pv.sizeNotice = pv.project === "antitip"
          ? { id: "too_deep", text: tr("antitip_too_deep", { max: plan.maxDepthCm }) }
          : { id: "too_deep", text: tr("too_deep", { max: plan.maxDepthCm }), useMax: plan.maxDepthCm };
        showNotice(pv.sizeNotice); return;
      }
      if (plan.tooWide) { pv.sizeNotice = { id: "too_wide", text: tr("width_max", { max: plan.maxWidthCm }) }; showNotice(pv.sizeNotice); return; }
      pv.sizeNotice = null; pv.plan = plan; pv.opt = null;
      if (pv.project === "cabinet" && !plan.options.length) { X.go("pv_stop"); return; }
      X.go("pv_summary");
    });
    return form;
  }

  function factsList(items) {
    return X.el("ul", { class: "pv-facts" }, items.filter(Boolean).map((x) => X.el("li", typeof x === "string" ? { text: x } : x)));
  }

  function viewSummary() {
    const p = pv.plan, s = pv.size;
    let head, items;
    if (pv.project === "shelf") {
      head = tr("board_title");
      const b = p.board25;
      const arm = p.options.length ? p.options[0].bracket.specs.arm_mm : null;
      items = [
        b ? tr("board", { l: b.specs.length_mm, d: b.specs.depth_mm }) + (p.shelves > 1 ? " × " + p.shelves : "") : { class: "warn-text", text: tr("board_none") },
        arm ? tr("brackets", { n: p.brackets, arm }) : tr("brackets_n", { n: p.brackets }),
        p.shelves > 1 ? { class: "hint warn-hint", "data-pv-split": String(p.shelves), text: tr("split", { max: P.maxShelfLengthCm, n: p.shelves, len: fmt(p.segCm) }) } : null,
        b && b.specs.length_mm !== p.segCm * 10 ? tr("cut") : null,
        tr("thickness_note")
      ];
    } else if (pv.project === "cabinet") {
      head = tr("cabinet_title");
      const r = p.options[0].rail;
      items = [
        { "data-pv-weight": String(p.weightKg), text: tr("weight", { kg: p.weightKg }) },
        { class: "muted small", text: tr("weight_note", { k: fmt(data().mounting.cabinet.panelKgPerM2) }) },
        tr("rail", { len: r.specs.rail_length_mm, n: p.points })
      ];
    } else {
      head = tr("antitip_title");
      const m = data().mounting;
      items = [
        pv.wall === "plasterboard" ? tr("antitip_anchor", { d: fmt(s.depth), a: p.baseAnchor }) : tr("antitip_plug", { d: fmt(s.depth), mm: p.basePlug }),
        p.tall ? { "data-pv-tall": "1", text: tr("antitip_tall", { h: fmt(s.height), t: m.antiTip.tallFromCm }) } : null,
        { "data-pv-kits": String(p.kits), text: tr("antitip_kits", { w: fmt(s.width), n: p.kits, per: m.antiTip.widthPerKitCm }) },
        tr("antitip_fix_total", { n: p.fixings })
      ];
    }
    const blocked = pv.project === "shelf" && (!p.board25 || !p.options.length);
    return card("", [
      X.el("h2", { text: head }),
      factsList(items),
      pv.project === "shelf" && !p.options.length ? X.el("p", { class: "hint warn-hint", text: tr("plug_none_shelf") }) : null,
      X.el("div", { class: "actions" }, [backBtn("pv_size"), btn(tr("next"), () => X.go(pv.project === "antitip" ? "pv_fix" : "pv_plug"), "primary", { id: "pv-next", disabled: blocked })])
    ]);
  }

  function optLabel(o) {
    const c = o.chain;
    if (c.fixingType === "cavity_anchor") return tr("anchor_mm", { t: c.plug.specs.thread, mm: o.mm });
    if (c.fixingType === "screw") return tr("wood_mm", { mm: o.mm });
    return tr("plug_mm", { mm: o.mm });
  }

  function viewPlug() {
    const p = pv.plan;
    let selected = pv.opt ? pv.opt.mm : null;
    const group = X.el("div", { class: "choices", role: "radiogroup", "aria-labelledby": "pv-q" });
    p.options.forEach((o) => {
      group.appendChild(X.el("button", {
        type: "button", class: "btn choice pv-opt" + (o.mm === selected ? " selected" : ""), role: "radio",
        "aria-checked": o.mm === selected ? "true" : "false", "data-value": String(o.mm), "data-kg": String(o.kg),
        onclick: () => {
          selected = o.mm;
          group.querySelectorAll(".choice").forEach((c) => {
            const on = c.getAttribute("data-value") === String(o.mm);
            c.classList.toggle("selected", on);
            c.setAttribute("aria-checked", on ? "true" : "false");
          });
        }
      }, [X.el("span", { text: optLabel(o) }), X.el("span", { class: "pv-opt-kg", text: tr(pv.project === "cabinet" ? "plug_kg_contents" : "plug_kg", { kg: o.kg }) })]));
    });
    const err = X.el("p", { class: "error", role: "alert" });
    const hidden = pv.project === "cabinet" && p.hidden.length ? X.el("p", { class: "muted small", "data-pv-hidden": p.hidden.map((o) => o.mm).join(","), text: tr("plug_hidden", { list: p.hidden.map((o) => o.mm + " mm").join(", ") }) }) : null;
    return card("question", [
      X.el("h2", { id: "pv-q", text: tr("plug_title") }),
      X.el("p", { class: "muted", text: tr(pv.project === "cabinet" ? "plug_q_cabinet" : "plug_q_shelf") }),
      group, hidden,
      pv.wall === "plasterboard" && pv.project === "shelf" ? X.el("p", { class: "hint", text: tr("plugboard_share", { cap: p.wallCapKg }) }) : null,
      X.el("p", { class: "muted small", text: tr("plug_follow") }),
      err,
      X.el("div", { class: "actions" }, [backBtn("pv_summary"), btn(tr("next"), () => {
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
      X.el("div", { class: "actions" }, [backBtn("pv_summary"), btn(tr("next"), () => X.go("pv_confirm"), "primary", { id: "pv-next" })])
    ]);
  }

  function viewConfirm() {
    const m = data().mounting;
    let lines;
    if (pv.project === "shelf") lines = [tr("confirm_shelf", { kg: pv.opt.kg }), tr("confirm_parts", { plug: optLabel(pv.opt), extra: tr("brackets_n", { n: pv.plan.brackets }) }), tr("safety_incl", { f: fmt(m.safetyFactor) })];
    else if (pv.project === "cabinet") lines = [tr("confirm_cabinet", { kg: pv.opt.kg }), tr("confirm_parts", { plug: optLabel(pv.opt), extra: tr("rail", { len: pv.opt.rail.specs.rail_length_mm, n: pv.plan.points }) }), tr("safety_incl", { f: fmt(m.safetyFactor) })];
    else lines = [tr("confirm_antitip")];
    return card("", [
      X.el("h2", { text: tr("confirm_title") }),
      X.el("p", { class: "state-banner ok", "data-pv-confirm": pv.opt ? String(pv.opt.kg) : "antitip", text: lines[0] }),
      factsList(lines.slice(1)),
      pv.project === "cabinet" ? X.el("p", { class: "hint", text: tr("glass_hint") }) : null,
      X.el("div", { class: "actions" }, [backBtn(pv.project === "antitip" ? "pv_fix" : "pv_plug"), btn(tr("confirm"), () => X.go("pv_list"), "primary", { id: "pv-confirm" })])
    ]);
  }

  function viewStop() {
    let text = tr("stop_unknown_wall");
    if (pv.wall !== "unknown" && pv.project === "cabinet" && pv.plan) text = tr("stop_cabinet_heavy", { kg: fmt(pv.plan.minKg), cap: pv.plan.capKg });
    return X.el("section", { class: "card stop", role: "alert", "data-preview-screen": "pv_stop" }, [
      banner(),
      X.el("h2", { text: tr("stop_title") }),
      X.el("p", { "data-pv-stop": pv.wall === "unknown" ? "unknown_wall" : "too_heavy", text: text }),
      X.el("div", { class: "actions" }, [backBtn(pv.wall === "unknown" ? "pv_wall" : "pv_size"), btn(tr("start_over"), () => X.resetProject(), "primary")])
    ]);
  }

  function viewList() {
    const cat = data().catalogue, st = X.state;
    const lines = pv.project === "shelf" ? shelfList(cat, pv.plan, pv.opt)
      : pv.project === "cabinet" ? cabinetList(cat, pv.plan, pv.opt, pv.size.width)
      : antiTipList(cat, pv.plan, pv.wall);
    const store = st.storeId ? st.data.stores.find((x) => x.store_id === st.storeId) : null;
    const box = card("list", [
      X.el("h2", { text: tr("list_title", { p: title() }) }),
      X.el("p", { class: "state-banner ok", role: "status", text: tr("list_ok") }),
      X.el("div", { class: "store-bar", "data-store-bar": store ? store.store_id : "none" }, store
        ? [X.el("span", { text: tr("store_sel") + ": " }), X.el("strong", { text: store.name + " (" + store.city + ")" }),
          btn(tr("store_change"), () => X.openStoreSearch("pv_list"), "small")]
        : [X.el("p", { class: "hint", text: tr("store_none") }), btn(tr("store_add"), () => X.openStoreSearch("pv_list"), "small", { "data-pv-store": "add" })])
    ]);
    if (pv.project === "antitip" && pv.wall === "plasterboard") box.appendChild(X.el("p", { class: "notice safety", text: tr("stud_hint") }));
    if (pv.project === "antitip") box.appendChild(X.el("p", { class: "notice safety", text: tr("confirm_antitip") }));
    const ul = X.el("ul", { class: "items" });
    let total = 0, complete = true;
    lines.forEach((l) => {
      const p = l.product;
      if (l.price === null) complete = false; else total += l.price;
      const li = X.el("li", { class: "item", "data-product": p.product_nr, "data-packs": String(l.packs) }, [
        X.el("p", { class: "item-name" }, [X.el("span", { text: X.productName(p) }), X.el("span", { class: "muted", text: " · " + p.size })]),
        X.el("p", { class: "qty", text: (p.pack_qty && p.pack_qty > 1 ? tr("qty", { packs: l.packs, pcs: l.pieces }) : tr("qty_one", { packs: l.packs })) + (l.note && l.note !== tr("stud_hint") ? " · " + l.note : "") }),
        X.el("div", { class: "price" }, [
          p.price_eur !== null ? X.priceEl(p.price_eur) : X.el("span", { class: "muted", text: "–" }),
          X.el("span", { class: "price-unit muted", text: " " + tr("per_pack") }),
          X.el("span", { class: "tag sample", text: tr("sample") })
        ])
      ]);
      if (store) {
        const s = R.storeInfo(st.data.stock, st.storeId, p.product_nr);
        const na = tr("na");
        li.appendChild(X.el("p", { class: "store-info", "data-aisle": s.aisle_nr === null ? "none" : String(s.aisle_nr) }, [
          X.el("span", { text: tr("stock") + ": " + (s.stock_qty === null ? na : s.stock_qty) + " · " }),
          X.el("span", { text: tr("aisle") + ": " + (s.aisle_nr === null ? na : s.aisle_nr + (s.aisle_name ? " (" + s.aisle_name + ")" : "")) + " · " }),
          X.el("span", { text: tr("shelf") + ": " + (s.shelf_nr === null ? na : s.shelf_nr) })
        ]));
      }
      ul.appendChild(li);
    });
    box.appendChild(ul);
    box.appendChild(X.el("p", { class: "total", "data-total": complete ? String(Math.round(total * 100) / 100) : "none" },
      complete ? [X.el("span", { class: "total-label", text: tr("total") }), X.priceEl(Math.round(total * 100) / 100, "total-value")] : [X.el("span", { text: "–" })]));
    box.appendChild(X.el("p", { class: "muted small", text: tr("rules_note") }));
    box.appendChild(X.el("div", { class: "actions" }, [backBtn("pv_confirm"), btn(tr("new_project"), () => X.resetProject(), "primary")]));
    return box;
  }

  const PROGRESS = { pv_wall: "questions", pv_size: "questions", pv_summary: "questions", pv_plug: "questions", pv_fix: "questions", pv_confirm: "questions", pv_list: "list" };
  function progress(sc) {
    if (sc === "pv_stop") return { step: "questions", stop: true };
    return PROGRESS[sc] ? { step: PROGRESS[sc], stop: false } : null;
  }

  root.BBPreviewD13 = Object.freeze({
    active: true,
    workbook: P.workbook,
    init,
    progress,
    screens: Object.freeze({ choose: viewChoose, pv_wall: viewWall, pv_size: viewSize, pv_summary: viewSummary, pv_plug: viewPlug, pv_fix: viewFix, pv_confirm: viewConfirm, pv_list: viewList, pv_stop: viewStop }),
    calc: Object.freeze({ shelfPlan, cabinetPlan, antiTipPlan, shelfList, cabinetList, antiTipList }) // for checks in the browser console
  });
})(typeof window !== "undefined" ? window : globalThis);
