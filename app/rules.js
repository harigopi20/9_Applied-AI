/*
 * Baumarkt-Buddy – rule engine (control layer, deterministic).
 *
 * ALL product, quantity, compatibility and safety decisions are made here,
 * from the project templates (DR-04) and the catalogue (DR-01). The AI never
 * decides anything in this file (architecture point 3, design DP-1).
 *
 * Rule IDs R-01 … R-16 refer to data/03-design.md §6. Template-specific
 * rule IDs (SHELF-*, PIC-*) are defined in data/templates/*.json.
 *
 * Pure functions, no DOM, no network – testable in tests.html.
 */
(function (root) {
  "use strict";

  // ---------------------------------------------------------------------
  // Fact status (SR-01, SR-11). Only trusted values drive safety decisions.
  // ---------------------------------------------------------------------
  const STATUS = Object.freeze({
    OBSERVED: "observed",                  // "Vermutung" from text or speech
    CONFIRMED: "user-confirmed",           // confirmed by the customer (tap)
    MANUFACTURER: "manufacturer-supported", // from catalogue / manufacturer
    UNKNOWN: "unknown"
  });
  const TRUSTED = new Set([STATUS.CONFIRMED, STATUS.MANUFACTURER]);
  const UNKNOWN_VALUE = "unknown";

  function makeFact(value, status, source) {
    if (!Object.values(STATUS).includes(status)) throw new Error("Invalid fact status: " + status);
    return Object.freeze({ value, status, source: source || "" });
  }

  /** Returns the value only if it is user-confirmed or manufacturer-supported. */
  function trustedValue(facts, key) {
    const f = facts && facts[key];
    if (!f || !TRUSTED.has(f.status)) return undefined;
    return f.value;
  }

  // ---------------------------------------------------------------------
  // Text helpers (SR-02, SR-07, SR-09, NFR-07)
  // ---------------------------------------------------------------------
  function normalise(text) {
    return " " + String(text == null ? "" : text)
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[’'`´]/g, "'")
      .replace(/[^\p{L}\p{N}%']+/gu, " ")
      .trim() + " ";
  }

  /** Phrase match at a word start (conservative: "ignore" also hits "ignored"). */
  function findPhrase(text, phrasesByLang) {
    const t = normalise(text);
    for (const lang of Object.keys(phrasesByLang || {})) {
      const list = phrasesByLang[lang];
      if (!Array.isArray(list)) continue;
      for (const p of list) {
        const np = normalise(p).trim();
        if (np && t.includes(" " + np)) return p;
      }
    }
    return null;
  }

  /** SR-02 / RB-07: true if a text certifies a wall or a drilling spot. */
  function impliesClearance(text, safetyRules) {
    return findPhrase(text, safetyRules.clearance_phrases) !== null;
  }

  /**
   * SR-07 / RB-08: generated (non-manufacturer) text is checked against the
   * product's safety_note. If it could weaken the note, it is discarded.
   * The safety_note itself is never modified.
   */
  function guardGeneratedText(text, safetyNote, safetyRules) {
    if (!text) return { text: null, discarded: false, reason: null };
    const weak = findPhrase(text, safetyRules.weakening_phrases);
    const clear = findPhrase(text, safetyRules.clearance_phrases);
    if (clear) return { text: null, discarded: true, reason: "SR-02 clearance phrase: " + clear };
    if (weak && safetyNote) return { text: null, discarded: true, reason: "SR-07 conflicts with manufacturer note: " + weak };
    return { text: String(text), discarded: false, reason: null };
  }

  /** SR-09 / FR-15: high-risk work detection on any text (typed or spoken). */
  function checkScope(text, safetyRules) {
    const groups = safetyRules.high_risk_keywords || {};
    const categories = [];
    const matched = [];
    Object.keys(groups).forEach((cat) => {
      if (cat === "comment") return;
      const hit = findPhrase(text, groups[cat]);
      if (hit) { categories.push(cat); matched.push(hit); }
    });
    return { highRisk: categories.length > 0, categories, matched, rule_id: "SR-09" };
  }

  // ---------------------------------------------------------------------
  // Expressions for quantity rules (explicit, no eval)
  // ---------------------------------------------------------------------
  class MissingValue extends Error {}

  function evalExpr(expr, ctx) {
    let v;
    if (typeof expr === "number") v = expr;
    else if (expr && typeof expr === "object") {
      if ("fact" in expr) {
        v = trustedValue(ctx.facts, expr.fact);
        if (v === undefined || v === UNKNOWN_VALUE) throw new MissingValue("fact " + expr.fact);
        v = Number(v);
      } else if ("spec" in expr) {
        const [role, key] = String(expr.spec).split(".");
        const item = ctx.resolved[role];
        v = item && item.product ? item.product.specs[key] : undefined;
        if (typeof v !== "number") throw new MissingValue("spec " + expr.spec);
      } else if ("var" in expr) {
        v = computeVar(expr.var, ctx);
      } else if ("mul" in expr) {
        v = expr.mul.reduce((acc, e) => acc * evalExpr(e, ctx), 1);
      } else if ("ceil_div" in expr) {
        v = Math.ceil(evalExpr(expr.ceil_div[0], ctx) / evalExpr(expr.ceil_div[1], ctx));
      } else if ("max" in expr) {
        v = Math.max.apply(null, expr.max.map((e) => evalExpr(e, ctx)));
      } else if ("min" in expr) {
        v = Math.min.apply(null, expr.min.map((e) => evalExpr(e, ctx)));
      } else if ("add" in expr) {
        v = expr.add.reduce((acc, e) => acc + evalExpr(e, ctx), 0);
      } else if ("sub" in expr) {
        v = evalExpr(expr.sub[0], ctx) - evalExpr(expr.sub[1], ctx);
      } else if ("div" in expr) {
        v = evalExpr(expr.div[0], ctx) / evalExpr(expr.div[1], ctx);
      } else if ("floor" in expr) {
        v = Math.floor(evalExpr(expr.floor, ctx) + 1e-9); // 1e-9: 5.9999999 from float maths counts as 6
      } else if ("ceil" in expr) {
        v = Math.ceil(evalExpr(expr.ceil, ctx) - 1e-9);
      } else if ("table" in expr) {
        v = tableLookup(expr.table, ctx);
      } else if ("unclear" in expr) {
        // Quantity the data does not give (e.g. "per rail instructions") → "unclear", no total (RB-13).
        throw new MissingValue("unclear: " + expr.unclear);
      } else {
        throw new Error("Unknown expression: " + JSON.stringify(expr)); // fail safe
      }
    } else throw new Error("Invalid expression");
    if (!Number.isFinite(v)) throw new MissingValue("not a number");
    return v;
  }

  /**
   * Table lookup, e.g. the plasterboard cabinet limits (PRJ-02, sheet
   * "Plasterboard cabinet"). pick "floor" = next smaller key, "ceil" = next
   * larger key (the less favourable value, as the manufacturer advises).
   * Outside the table → MissingValue (callers treat that as "not allowed").
   */
  function tableLookup(t, ctx) {
    const pickKey = (keys, x, mode) => {
      const sorted = keys.slice().sort((a, b) => a - b);
      const k = mode === "ceil" ? sorted.find((v) => v >= x) : sorted.filter((v) => v <= x).pop();
      if (k === undefined) throw new MissingValue("outside table");
      return keys.indexOf(k);
    };
    const r = pickKey(t.rows, evalExpr(t.row, ctx), t.row_pick);
    const c = pickKey(t.cols, evalExpr(t.col, ctx), t.col_pick);
    const v = t.values[r] && t.values[r][c];
    if (typeof v !== "number") throw new MissingValue("no table value");
    return v;
  }

  // ---------------------------------------------------------------------
  // Conditions for stop rules, warnings and optional roles (explicit, no eval)
  // ---------------------------------------------------------------------
  /**
   * Returns true/false. Throws MissingValue if a needed value is missing –
   * stop rules treat that as "stop" (fail safe), optional roles as "not added".
   */
  function condTrue(c, ctx) {
    if (!c || typeof c !== "object") throw new Error("Invalid condition");
    if ("all" in c) return c.all.every((x) => condTrue(x, ctx));
    if ("any" in c) return c.any.some((x) => condTrue(x, ctx));
    if ("not" in c) return !condTrue(c.not, ctx);
    if ("wall_in" in c) return c.wall_in.includes(trustedValue(ctx.facts, "wall_type"));
    if ("fact_in" in c) {
      // Choice facts: value in list. Checklist facts (arrays): any ticked value in list.
      const v = trustedValue(ctx.facts, c.fact_in.fact);
      if (v === undefined) throw new MissingValue("fact " + c.fact_in.fact);
      return Array.isArray(v) ? v.some((x) => c.fact_in.values.includes(x)) : c.fact_in.values.includes(v);
    }
    if ("role_in" in c) {
      const it = ctx.resolved[c.role_in.role];
      return !!(it && it.product && c.role_in.product_nrs.includes(it.product.product_nr));
    }
    const ops = { gt: (a, b) => a > b, gte: (a, b) => a >= b, lt: (a, b) => a < b, lte: (a, b) => a <= b };
    const op = Object.keys(ops).find((k) => k in c);
    if (op) return ops[op](evalExpr(c[op][0], ctx), evalExpr(c[op][1], ctx));
    throw new Error("Unknown condition: " + JSON.stringify(c)); // fail safe
  }

  function computeVar(name, ctx) {
    if (name in ctx.vars) return ctx.vars[name];
    const def = ctx.template.variables && ctx.template.variables[name];
    if (!def) throw new Error("Unknown variable " + name);
    const v = evalExpr(def.expr, ctx);
    ctx.vars[name] = v;
    log(ctx, def.rule_id, "variable " + name, "= " + v, "template:" + ctx.template.template_id);
    return v;
  }

  // ---------------------------------------------------------------------
  // Evidence log (DR-07)
  // ---------------------------------------------------------------------
  function log(ctx, ruleId, check, result, source, inputs) {
    ctx.evidence.push(Object.freeze({
      time: new Date().toISOString(),
      rule_id: ruleId || "",
      check,
      result,
      source,
      inputs: inputs || null
    }));
  }

  function catalogueSource(p) {
    return "catalogue:" + p.product_nr + " (baumarkt-buddy-data.xlsx/Products)";
  }

  // ---------------------------------------------------------------------
  // Compatibility (FR-09)
  // ---------------------------------------------------------------------
  /** Two products are compatible only if the catalogue lists the pair. */
  function compatible(a, b) {
    return a.compatible_with.includes(b.product_nr) || b.compatible_with.includes(a.product_nr);
  }

  /** Candidate pool of a role: membership only (variant group / ids / category). */
  function rolePool(role, catalogue) {
    const s = role.select || {};
    return catalogue.all.filter((p) => {
      if (s.product_nrs && !s.product_nrs.includes(p.product_nr)) return false;
      if (s.variant_groups && !s.variant_groups.includes(p.variant_group)) return false;
      if (s.category && !s.category.includes(p.category)) return false;
      return true;
    });
  }

  /** All checks for one product in one role. Every check returns ok + detail. */
  function checkCandidate(p, role, ctx) {
    const s = role.select || {};
    const checks = [];
    const add = (check, ok, detail, ruleId) => checks.push({ check, ok, detail, rule_id: ruleId });
    const wall = trustedValue(ctx.facts, "wall_type");
    // Load from the customer's answer, or from catalogue data (e.g. glass door weight, PRJ-06).
    let load = Number(trustedValue(ctx.facts, "load_kg"));
    if (s.load_expr) { try { load = evalExpr(s.load_expr, ctx); } catch (_) { load = NaN; } }

    // R-13: products that require a professional are never offered.
    add("requires_professional", !p.requires_professional,
      p.requires_professional ? "requires a professional" : "no", "R-13");

    if (s.product_nrs) add("product_nr", s.product_nrs.includes(p.product_nr), p.product_nr, "R-16");
    if (s.variant_groups) add("variant_group", s.variant_groups.includes(p.variant_group), p.variant_group, "R-16");
    if (s.category) add("category", s.category.includes(p.category), p.category, "R-16");

    (s.compatible_with_roles || []).forEach((r) => {
      const other = ctx.resolved[r];
      if (!other || !other.product) return; // role not part of this method
      add("compatible_with:" + r, compatible(p, other.product),
        p.product_nr + " ↔ " + other.product.product_nr, "FR-09");
    });

    Object.entries(s.spec_eq_role || {}).forEach(([key, r]) => {
      const other = ctx.resolved[r];
      if (!other || !other.product) return;
      const a = p.specs[key], b = other.product.specs[key];
      add("spec " + key + " = " + r, a !== undefined && a === b, a + " vs " + b, "R-05");
    });

    if (s.wall_suitable) {
      // Template maps an answer to the catalogue's wall words, e.g. solid_brick → "solid brick", "brick".
      const accepted = (ctx.template.wall_matches && ctx.template.wall_matches[wall]) || [wall];
      add("wall_type", typeof wall === "string" && accepted.some((w) => p.suitable_wall_types.includes(w)),
        "wall=" + wall + "; product: " + (p.suitable_wall_types.join(", ") || "no data"), "R-04");
    }

    if (s.load_rated) {
      // SR-04 / R-07: every load-bearing part must be rated for the WHOLE
      // load on its own (× safety factor). Ratings are never added up.
      const required = load * ctx.template.safety_factor;
      const rated = p.max_load_kg;
      add("load", rated !== null && Number.isFinite(required) && rated >= required,
        rated === null ? "no manufacturer rating (data unavailable)"
          : rated + " kg rated, " + round(required) + " kg required", "R-07");
    }

    Object.entries(s.spec_eq || {}).forEach(([key, e]) => {
      let want;
      try { want = evalExpr(e, ctx); } catch (_) { want = undefined; }
      add("spec " + key, want !== undefined && p.specs[key] === want, p.specs[key] + " vs " + want, "FR-08");
    });
    Object.entries(s.spec_eq_fact || {}).forEach(([key, fact]) => {
      // Text specs that must match a confirmed answer, e.g. lock type BB/WC/PZ (PRJ-07).
      const want = trustedValue(ctx.facts, fact);
      add("spec " + key + " = " + fact, want !== undefined && String(p.specs[key]).toLowerCase() === String(want).toLowerCase(),
        p.specs[key] + " vs " + want, "FR-08");
    });
    Object.entries(s.spec_gte || {}).forEach(([key, e]) => {
      let want;
      try { want = evalExpr(e, ctx); } catch (_) { want = undefined; }
      add("spec " + key + " ≥", want !== undefined && typeof p.specs[key] === "number" && p.specs[key] >= want,
        p.specs[key] + " vs " + want, "FR-08");
    });

    if (s.use_case_by_wall) {
      const uc = s.use_case_by_wall[wall];
      add("use_case", !!uc && p.use_cases.includes(uc), uc || "no rule for wall " + wall, "R-09");
    }
    return checks;
  }

  function round(n) { return Math.round(n * 100) / 100; }

  /** prefer: ["price_eur"] ascending; "-spec.volume_l" = descending, "spec.x" = from specs. */
  function sortByPrefer(list, prefer) {
    const value = (p, key) => {
      const v = key.startsWith("spec.") ? p.specs[key.slice(5)] : p[key];
      return typeof v === "number" ? v : null;
    };
    return list.slice().sort((a, b) => {
      for (const raw of prefer || []) {
        const desc = raw.startsWith("-");
        const key = desc ? raw.slice(1) : raw;
        let va = value(a, key), vb = value(b, key);
        va = va === null ? Infinity : desc ? -va : va;
        vb = vb === null ? Infinity : desc ? -vb : vb;
        if (va !== vb) return va - vb;
      }
      return a.product_nr < b.product_nr ? -1 : 1; // deterministic tie-break
    });
  }

  function conditionMet(role, ctx) {
    if (!role.when) return true;
    try { return condTrue(role.when, ctx); } catch (_) { return false; } // fail safe: role not silently added
  }

  /**
   * Resolves one role. Returns null if the role does not apply.
   * status: ok | none (no catalogue product passes) | incompatible (customer
   * override fails a check, RB-03) | unknown_product (G2).
   */
  function resolveRole(role, ctx, overrideNr) {
    if (!conditionMet(role, ctx)) return null;
    const base = { role: role.role, section: role.section, label: role.label, rule_ids: role.rule_ids || [], on_none: role.on_none, quantityRule: role.quantity };

    if (overrideNr) {
      const p = ctx.catalogue.get(overrideNr);
      if (!p) {
        log(ctx, "R-16", "G2 product " + overrideNr + " in catalogue", "not found", "catalogue");
        return Object.assign(base, { status: "unknown_product", product: null, checks: [] });
      }
      const checks = checkCandidate(p, role, ctx);
      const ok = checks.every((c) => c.ok);
      log(ctx, (role.rule_ids || []).join(","), "customer changed " + role.role + " to " + p.product_nr,
        ok ? "compatible" : "NOT compatible: " + checks.filter((c) => !c.ok).map((c) => c.check).join(", "),
        catalogueSource(p));
      return Object.assign(base, { status: ok ? "ok" : "incompatible", product: p, checks, overridden: true });
    }

    const pool = rolePool(role, ctx.catalogue);
    const evaluated = pool.map((p) => ({ p, checks: checkCandidate(p, role, ctx) }));
    const passing = evaluated.filter((e) => e.checks.every((c) => c.ok)).map((e) => e.p);
    const chosen = sortByPrefer(passing, (role.select || {}).prefer)[0];
    if (!chosen) {
      const reasons = evaluated.map((e) => e.p.product_nr + ": " +
        e.checks.filter((c) => !c.ok).map((c) => c.check + " (" + c.detail + ")").join("; "));
      log(ctx, (role.rule_ids || []).join(","), "select " + role.role, "no suitable catalogue product",
        "template:" + ctx.template.template_id, reasons);
      const candidates = evaluated.map((e) => ({ product_nr: e.p.product_nr, size: e.p.size,
        failed: e.checks.filter((c) => !c.ok).map((c) => c.check) }));
      return Object.assign(base, { status: "none", product: null, checks: [], reasons, candidates });
    }
    const checks = evaluated.find((e) => e.p === chosen).checks;
    log(ctx, (role.rule_ids || []).join(","), "select " + role.role, chosen.product_nr + " – all checks passed",
      catalogueSource(chosen), checks.map((c) => c.check + ": " + c.detail));
    return Object.assign(base, { status: "ok", product: chosen, checks });
  }

  // ---------------------------------------------------------------------
  // Main entry: evaluate a template with the current facts
  // ---------------------------------------------------------------------
  /**
   * @param template   project template (DR-04)
   * @param facts      { key: {value, status, source} }
   * @param catalogue  from BBData.buildCatalogue
   * @param safetyRules data/safety-rules.json
   * @param options    { overrides: {role: product_nr}, generatedHints: {role: text},
   *                     owned: [role, …] – parts the customer already has (C-8, SR-15) }
   */
  function evaluate(template, facts, catalogue, safetyRules, options) {
    options = options || {};
    const ctx = { template, facts, catalogue, resolved: {}, vars: {}, evidence: [] };
    const tplSource = "template:" + template.template_id + "@" + template.version +
      " (review: " + ((template.review && template.review.status) || "none") + ")";
    const result = {
      template_id: template.template_id,
      template_version: template.version,
      review: template.review || null,
      state: null,
      missing_facts: [],
      blocked: null,
      method: null,
      items: [],
      notices: [],
      total: { amount: null, reason: null },
      evidence: ctx.evidence
    };

    // --- G1: required facts confirmed? (SR-01, SR-03, SR-11, R-01) --------
    const unknown = [];
    (template.required_facts || []).forEach((key) => {
      const f = facts[key];
      if (f && f.value === UNKNOWN_VALUE) unknown.push(key);
      else if (!f || f.value === null || f.value === "" || f.value === undefined) result.missing_facts.push(key);
      else if (!TRUSTED.has(f.status)) result.missing_facts.push(key); // a guess is not enough
      log(ctx, "R-01", "fact " + key, f ? (f.value + " [" + f.status + "]") : "missing", f ? ("fact:" + f.source) : "-");
    });
    if (unknown.length) {
      result.state = "safety_blocked";
      result.blocked = { reason: "fact_unknown", rule_id: "R-01", facts: unknown };
      log(ctx, "SR-06", "stop", "unknown: " + unknown.join(", "), tplSource);
      return finalise(result);
    }
    if (result.missing_facts.length) {
      result.state = "needs_clarification";
      log(ctx, "SR-03", "mounting gate", "waiting for confirmed: " + result.missing_facts.join(", "), tplSource);
      return finalise(result);
    }

    // --- Stop rules of the project (DR-04 project catalogue, sheet "Stop rules") --
    // A rule whose values cannot be evaluated stops as well (fail safe).
    for (const stop of template.stops || []) {
      let hit;
      try { hit = condTrue(stop.when, ctx); } catch (e) { hit = true; }
      if (!hit) continue;
      let limit = null;
      if (stop.limit) { try { limit = round(evalExpr(stop.limit, ctx)); } catch (_) { limit = null; } }
      result.state = "safety_blocked";
      result.blocked = {
        reason: "stop_rule", rule_id: stop.rule_id, stop_id: stop.id || stop.rule_id,
        message: stop.message, help: stop.help || null, hand_off: stop.hand_off || "staff", limit_kg: limit
      };
      log(ctx, stop.rule_id, "stop rule " + (stop.id || stop.rule_id), "stop → " + (stop.hand_off || "staff"), tplSource);
      return finalise(result);
    }

    // --- Value sanity and hard limits (R-12, R-08) – only for projects with a load question
    const needsLoad = (template.required_facts || []).includes("load_kg");
    const load = Number(trustedValue(facts, "load_kg"));
    const wall = trustedValue(facts, "wall_type");
    if (needsLoad && (!Number.isFinite(load) || load <= 0)) {
      result.state = "safety_blocked";
      result.blocked = { reason: "invalid_value", rule_id: "SR-06", facts: ["load_kg"] };
      return finalise(result);
    }
    if (needsLoad && load > template.max_load_kg) {
      result.state = "safety_blocked";
      result.blocked = { reason: "load_over_limit", rule_id: "R-12", limit_kg: template.max_load_kg, load_kg: load };
      log(ctx, "R-12", "load limit", load + " kg > " + template.max_load_kg + " kg → professional", tplSource);
      return finalise(result);
    }
    const wl = (template.wall_limits || {})[wall];
    if (needsLoad && wl && load > wl.max_load_kg) {
      result.state = "safety_blocked";
      result.blocked = { reason: "wall_limit", rule_id: wl.rule_id, wall, limit_kg: wl.max_load_kg, load_kg: load };
      log(ctx, wl.rule_id, "wall limit " + wall, load + " kg > " + wl.max_load_kg + " kg", tplSource);
      return finalise(result);
    }

    // --- Methods: first method whose stop-roles all resolve (R-15) ----------
    const overrides = options.overrides || {};
    const failures = [];
    let chosen = null;
    for (const method of template.methods) {
      ctx.resolved = {};
      ctx.vars = {};
      const items = [];
      let failed = null;
      let customerMismatch = false; // an override that does not fit (RB-03)
      for (const role of method.roles.concat(template.common_roles || [])) {
        const item = resolveRole(role, ctx, overrides[role.role]);
        if (!item) continue;
        if (item.status === "incompatible" || item.status === "unknown_product") customerMismatch = true;
        // After a customer mismatch, dependent parts stay "unresolved" in the
        // list (shown, not final) instead of hiding the mismatch behind a stop.
        if (item.status === "none" && role.on_none === "stop" && !customerMismatch) { failed = item; break; }
        ctx.resolved[role.role] = item;
        items.push(item);
      }
      if (failed) {
        failures.push({ method_id: method.method_id, role: failed.role, label: failed.label, reasons: failed.reasons, candidates: failed.candidates || [] });
        log(ctx, method.rule_id, "method " + method.method_id, "not possible: no " + failed.role, tplSource);
        continue;
      }
      chosen = { method, items };
      log(ctx, method.rule_id, "method " + method.method_id, "chosen", tplSource);
      break;
    }
    if (!chosen) {
      result.state = "safety_blocked";
      result.blocked = { reason: "no_suitable_system", rule_id: "R-07", failures, message: template.no_system_message || null,
        cause: sizeCause(failures[failures.length - 1]) };
      return finalise(result);
    }

    // --- Quantities (R-14) and pack sizes (RB-13) ---------------------------
    result.method = {
      method_id: chosen.method.method_id, rule_id: chosen.method.rule_id,
      label: chosen.method.label, drilling: !!chosen.method.drilling,
      penetrates_wall: !!chosen.method.penetrates_wall
    };
    const hints = options.generatedHints || {};
    // C-8 / SR-15: parts the customer already has. Plugs and screws are always new
    // (role.ownable false). A used load-bearing part with a reported defect is not
    // accepted – it stays on the list (ST-06).
    const ownedWanted = new Set(options.owned || []);
    const defect = template.defect_fact ? defectReported(facts, template.defect_fact) : false;
    const roleDefs = {};
    chosen.method.roles.concat(template.common_roles || []).forEach((r) => { roleDefs[r.role] = r; });
    result.items = chosen.items.map((it) => {
      const def = roleDefs[it.role] || {};
      let autoOwned = false;
      if (def.owned_when) { try { autoOwned = condTrue(def.owned_when, ctx); } catch (_) { autoOwned = false; } }
      const ownable = !!def.ownable;
      const loadBearing = !!def.load_bearing;
      let owned = false, ownedRefused = false;
      if (autoOwned || (ownable && ownedWanted.has(it.role))) {
        if (loadBearing && defect) ownedRefused = true;
        else owned = true;
      }
      if (owned || ownedRefused) {
        log(ctx, ownedRefused ? "ST-06" : "C-8", "customer has " + it.role,
          ownedRefused ? "not accepted – defect reported, new part stays on the list" : "taken off the list (not counted)",
          "fact:customer");
      }
      const q = { rule_id: it.quantityRule.rule_id, units: null, packs: null, pack_qty: null, clear: false, estimate: true };
      try { q.units = evalExpr(it.quantityRule.units, ctx); } catch (_) { q.units = null; }
      if (it.product) {
        q.pack_qty = it.product.pack_qty;
        if (q.units !== null && q.pack_qty) {
          q.packs = Math.ceil(q.units / q.pack_qty);
          q.clear = true;
        }
        log(ctx, q.rule_id, "quantity " + it.role,
          q.clear ? q.units + " pcs → " + q.packs + " pack(s) of " + q.pack_qty : "pack size unclear – no line total",
          tplSource + " + " + catalogueSource(it.product));
      }
      // SR-07: generated hint text never weakens the manufacturer note.
      const g = guardGeneratedText(hints[it.role], it.product ? it.product.safety_note : "", safetyRules);
      if (g.discarded) log(ctx, "SR-07", "generated hint for " + it.role, "discarded – " + g.reason, "generated text");
      const linePrice = q.clear && it.product.price_eur !== null ? round(q.packs * it.product.price_eur) : null;
      return {
        role: it.role, section: it.section, label: it.label, rule_ids: it.rule_ids,
        status: it.status, on_none: it.on_none, overridden: !!it.overridden,
        ownable, load_bearing: loadBearing, owned, owned_auto: owned && autoOwned, owned_refused: ownedRefused,
        // SR-15: an owned load-bearing part must be rated for the whole load × factor.
        required_rating_kg: loadBearing && Number.isFinite(load) && needsLoad ? round(load * template.safety_factor) : null,
        product: it.product,
        // SR-07: shown unchanged, straight from the catalogue.
        safety_note: it.product ? it.product.safety_note : "",
        hint: g.text,
        checks: it.checks,
        failed_checks: it.checks.filter((c) => !c.ok),
        quantity: q,
        line_price: linePrice
      };
    });

    // --- Notices (SR-02, SR-05, NFR-05) -------------------------------------
    result.notices.push({ id: "estimates", rule_id: "NFR-05" });
    if (result.method.penetrates_wall) {
      result.notices.push({ id: "detector_limits", rule_id: "SR-05" });
      result.notices.push({ id: "no_wall_certification", rule_id: "SR-02" });
    }
    if (result.items.some((i) => i.owned_refused)) result.notices.push({ id: "owned_defect", rule_id: "ST-06" });
    if (result.items.some((i) => i.owned && i.load_bearing && i.required_rating_kg !== null)) result.notices.push({ id: "owned_load_bearing", rule_id: "SR-15" });
    // Project warnings that do not stop (e.g. ST-14 switch covers), text from the template.
    (template.warnings || []).forEach((w) => {
      let on;
      try { on = w.when ? condTrue(w.when, ctx) : true; } catch (_) { on = true; } // missing value → show the warning
      if (on) {
        result.notices.push({ id: w.id, rule_id: w.rule_id, text: w.text });
        log(ctx, w.rule_id, "warning " + w.id, "shown", tplSource);
      }
    });

    // --- State and total (RB-13) – parts the customer has are not counted -----
    const buy = result.items.filter((i) => !i.owned);
    const notOk = buy.filter((i) => i.status !== "ok");
    const unclear = buy.filter((i) => i.status === "ok" && !i.quantity.clear);
    if (notOk.some((i) => i.status === "incompatible" || i.status === "unknown_product")) {
      result.state = "incomplete";
      result.total.reason = "incompatible";
    } else if (notOk.length) {
      result.state = "incomplete";
      result.total.reason = "unresolved_items";
    } else if (unclear.length || buy.some((i) => i.line_price === null)) {
      result.state = "validated";
      result.total.reason = "unclear_pack";
    } else {
      result.state = "validated";
      result.total.amount = round(buy.reduce((s, i) => s + i.line_price, 0));
    }
    log(ctx, "SR-03", "final state", result.state + (result.total.reason ? " (" + result.total.reason + ")" : ""), tplSource);
    return finalise(result);
  }

  /**
   * If a part fails ONLY because of its size (e.g. 100 cm shelf, boards are 80 cm),
   * the stop must say so – not blame the load. Returns {kind:"size", label, sizes} or null.
   */
  function sizeCause(failure) {
    if (!failure || !failure.candidates || !failure.candidates.length) return null;
    const sizeOnly = failure.candidates.some((c) => c.failed.length > 0 && c.failed.every((x) => /^spec /.test(x)));
    if (!sizeOnly) return null;
    const sizes = Array.from(new Set(failure.candidates.map((c) => c.size).filter(Boolean)));
    return { kind: "size", role: failure.role, label: failure.label, sizes };
  }

  /** Used-item checklist (C-7): any ticked defect other than "none". */
  function defectReported(facts, key) {
    const v = trustedValue(facts, key);
    return Array.isArray(v) ? v.some((x) => x !== "none") : false;
  }

  function finalise(result) {
    result.evidence = Object.freeze(result.evidence.slice());
    return result;
  }

  // ---------------------------------------------------------------------
  // Store information (FR-11, FR-30, RB-06, RB-15, RB-17)
  // ---------------------------------------------------------------------
  /**
   * Stock and aisle/shelf ONLY from the selected store. No fallback to any
   * other store, no default values. Missing value -> null ("not available").
   */
  function storeInfo(stockIndex, storeId, productNr) {
    if (!storeId) return { status: "no_store", stock_qty: null, aisle_nr: null, aisle_name: "", shelf_nr: null };
    const row = stockIndex && stockIndex.get(storeId + "|" + productNr);
    if (!row) return { status: "not_listed", stock_qty: null, aisle_nr: null, aisle_name: "", shelf_nr: null };
    return {
      status: "ok",
      stock_qty: row.stock_qty,
      aisle_nr: row.aisle_nr,
      aisle_name: row.aisle_nr === null ? "" : row.aisle_name,
      shelf_nr: row.aisle_nr === null ? null : row.shelf_nr
    };
  }

  // ---------------------------------------------------------------------
  // Store selection by PLZ (FR-29, RB-16, SR-06, NFR-04) – runs on the device
  // ---------------------------------------------------------------------
  /**
   * PLZ check in code: exactly 5 digits AND present in the reference table.
   * The PLZ is never logged, never put into the evidence log and never sent.
   */
  function checkPlz(input, plzTable) {
    const plz = String(input == null ? "" : input).trim();
    if (!/^\d{5}$/.test(plz)) return { valid: false, reason: "format" };
    if (!plzTable) return { valid: false, reason: "no_table" };
    const point = plzTable.get(plz);
    if (!point) return { valid: false, reason: "unknown" };
    return { valid: true, point };
  }

  /** Straight-line distance in km (haversine). */
  function distanceKm(a, b) {
    const R = 6371, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  /**
   * Returns the stores to offer. NEVER selects a store (RB-16, SR-06):
   * the customer always taps one.
   *  status "nearby"        – valid PLZ, stores within range, sorted by distance
   *  status "none_in_range" – valid PLZ, nearest store too far → full list
   *  status "invalid"       – format / unknown PLZ / no table → full list
   */
  function findStores(input, plzTable, stores, cfg) {
    const all = (stores || []).filter((s) => s.store_id).slice()
      .sort((a, b) => (a.city + a.name).localeCompare(b.city + b.name));
    const check = checkPlz(input, plzTable);
    if (!check.valid) return { status: "invalid", reason: check.reason, stores: all.map((s) => ({ store: s, km: null })) };
    const withKm = all
      .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lon))
      .map((s) => ({ store: s, km: Math.round(distanceKm(check.point, s) * 10) / 10 }))
      .sort((a, b) => a.km - b.km || (a.store.store_id < b.store.store_id ? -1 : 1));
    const near = withKm.filter((x) => x.km <= cfg.maxDistanceKm).slice(0, cfg.maxStoresShown);
    if (!near.length) return { status: "none_in_range", reason: "too_far", stores: withKm };
    return { status: "nearby", reason: null, stores: near };
  }

  /**
   * FR-31 / RB-21: availability of one list item in the selected store.
   * The item ALWAYS stays on the list – this only adds a marking and, if the
   * selected store cannot supply it, a referral to the nearest other sample
   * store that has it in stock (qty > 0), measured from `origin` (the centre of
   * the entered PLZ, else the selected store). No store in range → ask staff.
   * Never a substitute product. The referral names only store and distance –
   * no aisle, shelf or stock of the other store (RB-15 exception, labelled).
   *
   * status: no_store | in_stock | out_of_stock | not_carried
   */
  function availability(stockIndex, stores, storeId, productNr, origin, cfg) {
    if (!storeId) return { status: "no_store", referral: null, ask_staff: false };
    const here = storeInfo(stockIndex, storeId, productNr);
    let status;
    if (here.status !== "ok" || here.aisle_nr === null) status = "not_carried";
    else if (here.stock_qty === null || here.stock_qty <= 0) status = "out_of_stock";
    else status = "in_stock";
    if (status === "in_stock") return { status, referral: null, ask_staff: false };

    const selected = (stores || []).find((s) => s.store_id === storeId);
    const from = origin && Number.isFinite(origin.lat) ? origin : selected;
    const candidates = (stores || [])
      .filter((s) => s.store_id !== storeId && Number.isFinite(s.lat) && Number.isFinite(s.lon))
      .filter((s) => {
        const row = stockIndex && stockIndex.get(s.store_id + "|" + productNr);
        return row && row.aisle_nr !== null && row.stock_qty !== null && row.stock_qty > 0;
      })
      .map((s) => ({ store: s, km: from && Number.isFinite(from.lat) ? Math.round(distanceKm(from, s) * 10) / 10 : null }))
      .filter((x) => x.km !== null && x.km <= cfg.maxDistanceKm)
      .sort((a, b) => a.km - b.km || (a.store.store_id < b.store.store_id ? -1 : 1));
    return candidates.length
      ? { status, referral: candidates[0], ask_staff: false }
      : { status, referral: null, ask_staff: true };
  }

  /** Variants the customer may switch to for a role (same pool as the rule). */
  function variantOptions(template, roleName, catalogue) {
    const all = [].concat(...template.methods.map((m) => m.roles), template.common_roles || []);
    const role = all.find((r) => r.role === roleName);
    return role ? rolePool(role, catalogue).filter((p) => !p.requires_professional) : [];
  }

  root.BBRules = Object.freeze({
    STATUS, UNKNOWN_VALUE, makeFact, trustedValue,
    evaluate, storeInfo, availability, variantOptions, compatible, checkPlz, distanceKm, findStores,
    guardGeneratedText, impliesClearance, checkScope, findPhrase
  });
})(typeof window !== "undefined" ? window : globalThis);
