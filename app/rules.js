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
      } else {
        throw new Error("Unknown expression: " + JSON.stringify(expr)); // fail safe
      }
    } else throw new Error("Invalid expression");
    if (!Number.isFinite(v)) throw new MissingValue("not a number");
    return v;
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
    const load = Number(trustedValue(ctx.facts, "load_kg"));

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
      add("wall_type", typeof wall === "string" && p.suitable_wall_types.includes(wall),
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

  function sortByPrefer(list, prefer) {
    return list.slice().sort((a, b) => {
      for (const key of prefer || []) {
        const va = a[key] === null ? Infinity : a[key];
        const vb = b[key] === null ? Infinity : b[key];
        if (va !== vb) return va - vb;
      }
      return a.product_nr < b.product_nr ? -1 : 1; // deterministic tie-break
    });
  }

  function conditionMet(role, ctx) {
    if (!role.when) return true;
    if (role.when.wall_in) return role.when.wall_in.includes(trustedValue(ctx.facts, "wall_type"));
    return false; // unknown condition -> fail safe (role not silently added)
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
      return Object.assign(base, { status: "none", product: null, checks: [], reasons });
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
   * @param options    { overrides: {role: product_nr}, generatedHints: {role: text} }
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

    // --- Value sanity and hard limits (R-12, R-08) --------------------------
    const load = Number(trustedValue(facts, "load_kg"));
    const wall = trustedValue(facts, "wall_type");
    if (!Number.isFinite(load) || load <= 0) {
      result.state = "safety_blocked";
      result.blocked = { reason: "invalid_value", rule_id: "SR-06", facts: ["load_kg"] };
      return finalise(result);
    }
    if (load > template.max_load_kg) {
      result.state = "safety_blocked";
      result.blocked = { reason: "load_over_limit", rule_id: "R-12", limit_kg: template.max_load_kg, load_kg: load };
      log(ctx, "R-12", "load limit", load + " kg > " + template.max_load_kg + " kg → professional", tplSource);
      return finalise(result);
    }
    const wl = (template.wall_limits || {})[wall];
    if (wl && load > wl.max_load_kg) {
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
        failures.push({ method_id: method.method_id, role: failed.role, reasons: failed.reasons });
        log(ctx, method.rule_id, "method " + method.method_id, "not possible: no " + failed.role, tplSource);
        continue;
      }
      chosen = { method, items };
      log(ctx, method.rule_id, "method " + method.method_id, "chosen", tplSource);
      break;
    }
    if (!chosen) {
      result.state = "safety_blocked";
      result.blocked = { reason: "no_suitable_system", rule_id: "R-07", failures };
      return finalise(result);
    }

    // --- Quantities (R-14) and pack sizes (RB-13) ---------------------------
    result.method = {
      method_id: chosen.method.method_id, rule_id: chosen.method.rule_id,
      label: chosen.method.label, drilling: !!chosen.method.drilling,
      penetrates_wall: !!chosen.method.penetrates_wall
    };
    const hints = options.generatedHints || {};
    result.items = chosen.items.map((it) => {
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

    // --- State and total (RB-13) --------------------------------------------
    const notOk = result.items.filter((i) => i.status !== "ok");
    const unclear = result.items.filter((i) => i.status === "ok" && !i.quantity.clear);
    if (notOk.some((i) => i.status === "incompatible" || i.status === "unknown_product")) {
      result.state = "incomplete";
      result.total.reason = "incompatible";
    } else if (notOk.length) {
      result.state = "incomplete";
      result.total.reason = "unresolved_items";
    } else if (unclear.length || result.items.some((i) => i.line_price === null)) {
      result.state = "validated";
      result.total.reason = "unclear_pack";
    } else {
      result.state = "validated";
      result.total.amount = round(result.items.reduce((s, i) => s + i.line_price, 0));
    }
    log(ctx, "SR-03", "final state", result.state + (result.total.reason ? " (" + result.total.reason + ")" : ""), tplSource);
    return finalise(result);
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

  /** Variants the customer may switch to for a role (same pool as the rule). */
  function variantOptions(template, roleName, catalogue) {
    const all = [].concat(...template.methods.map((m) => m.roles), template.common_roles || []);
    const role = all.find((r) => r.role === roleName);
    return role ? rolePool(role, catalogue).filter((p) => !p.requires_professional) : [];
  }

  root.BBRules = Object.freeze({
    STATUS, UNKNOWN_VALUE, makeFact, trustedValue,
    evaluate, storeInfo, variantOptions, compatible,
    guardGeneratedText, impliesClearance, checkScope, findPhrase
  });
})(typeof window !== "undefined" ? window : globalThis);
