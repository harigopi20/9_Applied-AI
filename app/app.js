/*
 * Baumarkt-Buddy – presentation + orchestration (stage 1: project buttons).
 *
 * The UI only shows what the rule engine (rules.js) has validated.
 * NFR-07: all catalogue and user text is inserted with textContent – never
 * as HTML – so text in product data can never act as markup or code.
 * NFR-04: nothing is stored or sent; state lives in memory only.
 */
(function () {
  "use strict";

  const { t, pick } = window.BBI18n;
  const R = window.BBRules;
  const CFG = window.BB_CONFIG;

  const state = {
    data: null,
    error: null,
    screen: "loading",       // loading | error | start | choose | question | result
    template: null,
    facts: {},
    questionId: null,
    editOnly: false,         // true when the customer changes one answer (SR-08)
    overrides: {},           // role -> product_nr chosen by the customer
    checked: new Set(),      // product_nr ticked off (FR: simple check-off)
    storeId: null,           // stage 4 – FR-30: no store = aisle/shelf "not available"
    result: null
  };

  // ---------------------------------------------------------------------
  // DOM helper: text is always set via textContent (NFR-07)
  // ---------------------------------------------------------------------
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (v === null || v === undefined || v === false) return;
      if (k === "text") node.textContent = v;
      else if (k === "class") node.className = v;
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? "" : v);
    });
    (children || []).forEach((c) => {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  const main = () => document.getElementById("main");

  function render() {
    if (!document.getElementById("main")) return; // headless use in tests.html
    document.documentElement.lang = window.BBI18n.getLang();
    renderHeader();
    const m = main();
    m.replaceChildren();
    const screens = { loading: viewLoading, error: viewError, start: viewStart, choose: viewChoose, question: viewQuestion, result: viewResult };
    m.appendChild(screens[state.screen]());
    document.getElementById("footer-text").textContent = t("footer");
    m.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function renderHeader() {
    document.getElementById("app-title").textContent = t("app_title");
    document.getElementById("app-tagline").textContent = t("app_tagline");
    document.getElementById("sample-badge").textContent = t("sample_badge");
    const btn = document.getElementById("lang-toggle");
    btn.textContent = t("lang_toggle");
    btn.setAttribute("aria-label", t("lang_toggle_aria"));
  }

  // ---------------------------------------------------------------------
  // Screens
  // ---------------------------------------------------------------------
  function viewLoading() {
    return el("section", { class: "card", "aria-busy": "true" }, [el("p", { text: t("loading") })]);
  }

  function viewError() {
    return el("section", { class: "card stop", role: "alert" }, [
      el("h2", { text: t("load_error_title") }),
      el("p", { text: t("load_error_text") }),
      el("p", { class: "muted small", text: String(state.error || "") }),
      el("button", { class: "btn primary", text: t("retry"), onclick: boot })
    ]);
  }

  // Start: AI notice, sample data, privacy (NFR-04, NFR-05)
  function viewStart() {
    return el("section", { class: "card" }, [
      el("h2", { text: t("notice_title") }),
      el("ul", { class: "notice-list" }, [
        el("li", { text: t("notice_ai") }),
        el("li", { text: t("notice_sample") }),
        el("li", { text: t("notice_privacy") }),
        el("li", { class: "muted", text: t("notice_stage") })
      ]),
      el("button", { class: "btn primary block", text: t("start"), onclick: () => go("choose") })
    ]);
  }

  // Project buttons (FR-02, DR-04)
  function viewChoose() {
    const wrap = el("section", { class: "card" }, [
      el("h2", { text: t("choose_title") }),
      el("p", { class: "muted", text: t("choose_help") })
    ]);
    const grid = el("div", { class: "template-grid" });
    state.data.templates.forEach((tpl) => {
      const reviewed = tpl.review && tpl.review.status === "reviewed";
      grid.appendChild(el("button", {
        class: "btn template", "data-template": tpl.template_id,
        onclick: () => startTemplate(tpl)
      }, [
        el("span", { class: "template-icon", "aria-hidden": "true", text: tpl.icon || "" }),
        el("span", { class: "template-title", text: pick(tpl.title) }),
        el("span", { class: "template-review " + (reviewed ? "ok" : "pending"),
          text: (reviewed ? t("template_reviewed") : t("template_unreviewed")) +
            (tpl.review && tpl.review.review_date ? " · " + tpl.review.review_date : "") +
            " · v" + tpl.version })
      ]));
    });
    wrap.appendChild(grid);
    return wrap;
  }

  // Follow-up questions: max. 3, only for facts not yet confirmed (FR-04, FR-05)
  function viewQuestion() {
    const tpl = state.template;
    const q = tpl.questions.find((x) => x.id === state.questionId);
    const idx = tpl.questions.indexOf(q);
    const form = el("form", { class: "card question", novalidate: true });
    form.appendChild(el("p", { class: "muted small", text: pick(tpl.title) + " · " + t("question_of", { n: idx + 1, total: tpl.questions.length }) }));
    form.appendChild(el("h2", { id: "q-text", text: pick(q.text) }));
    if (q.help) form.appendChild(el("p", { class: "muted", text: pick(q.help) }));

    const fields = q.type === "group" ? q.fields : [q];
    const getters = [];
    fields.forEach((f) => getters.push(renderField(form, f, q.type === "group")));

    const error = el("p", { class: "error", role: "alert", "aria-live": "polite" });
    form.appendChild(error);
    form.appendChild(el("p", { class: "muted small", text: t("confirmed_note") }));

    const submit = (e) => {
      e.preventDefault();
      const values = [];
      for (const g of getters) {
        const v = g();
        if (v.error) { error.textContent = v.error; return; }
        values.push(v);
      }
      // Every answer given by tap is "user-confirmed" (SR-01).
      values.forEach((v) => { state.facts[v.fact] = R.makeFact(v.value, R.STATUS.CONFIRMED, "question:" + q.id); });
      afterFactsChanged();
    };
    form.addEventListener("submit", submit);

    const actions = el("div", { class: "actions" }, [
      el("button", { type: "button", class: "btn", text: state.editOnly ? t("cancel") : t("back"), onclick: questionBack }),
      el("button", { type: "submit", class: "btn primary", text: t("next") })
    ]);
    form.appendChild(actions);
    return form;
  }

  /** Renders one field; returns a getter that validates the value in code. */
  function renderField(form, f, inGroup) {
    const current = state.facts[f.fact] ? state.facts[f.fact].value : null;
    const box = el("div", { class: "field" });
    if (inGroup) box.appendChild(el("p", { class: "field-label", id: "lbl-" + f.fact, text: pick(f.label) }));

    if (f.type === "choice") {
      let selected = current;
      const group = el("div", { class: "choices", role: "radiogroup", "aria-labelledby": inGroup ? "lbl-" + f.fact : "q-text" });
      f.options.forEach((opt) => {
        const label = optionLabel(f, opt);
        const b = el("button", {
          type: "button", class: "btn choice" + (opt === selected ? " selected" : ""),
          role: "radio", "aria-checked": opt === selected ? "true" : "false",
          "data-value": String(opt), text: label,
          onclick: () => {
            selected = opt;
            group.querySelectorAll(".choice").forEach((c) => {
              const on = c.getAttribute("data-value") === String(opt);
              c.classList.toggle("selected", on);
              c.setAttribute("aria-checked", on ? "true" : "false");
            });
          }
        });
        group.appendChild(b);
      });
      box.appendChild(group);
      form.appendChild(box);
      return () => selected === null || selected === undefined
        ? { error: t("choose_option") }
        : { fact: f.fact, value: selected };
    }

    // number
    const input = el("input", {
      type: "text", inputmode: "decimal", autocomplete: "off", class: "input",
      id: "in-" + f.fact, "aria-labelledby": inGroup ? "lbl-" + f.fact : "q-text",
      value: current !== null && current !== R.UNKNOWN_VALUE ? String(current) : ""
    });
    const row = el("div", { class: "number-row" }, [input, f.unit ? el("span", { class: "unit", text: f.unit }) : null]);
    box.appendChild(row);
    let unknown = false;
    if (f.allow_unknown) {
      box.appendChild(el("button", {
        type: "button", class: "btn choice", "data-value": "unknown", text: t("dont_know"),
        onclick: () => { unknown = true; form.requestSubmit(); }
      }));
    }
    form.appendChild(box);
    return () => {
      if (unknown) return { fact: f.fact, value: R.UNKNOWN_VALUE };
      // Validation in code: comma or dot decimal, within template range.
      const raw = input.value.trim().replace(",", ".");
      const n = Number(raw);
      const ok = raw !== "" && Number.isFinite(n) && n >= f.min && n <= f.max && (!f.integer || Number.isInteger(n));
      return ok ? { fact: f.fact, value: n } : { error: t("value_required", { min: f.min, max: f.max }) };
    };
  }

  function optionLabel(f, opt) {
    if (f.fact === "wall_type") return t("wall_" + opt);
    if (opt === R.UNKNOWN_VALUE) return t("dont_know");
    return f.unit ? opt + " " + f.unit : String(opt);
  }

  function factLabel(key, fact) {
    if (!fact) return "–";
    const v = fact.value;
    if (key === "wall_type") return t("wall_" + v);
    if (v === R.UNKNOWN_VALUE) return t("dont_know");
    const units = { load_kg: "kg", shelf_length_cm: "cm", shelf_depth_cm: "cm" };
    return v + (units[key] ? " " + units[key] : "");
  }

  // Facts summary with status label and "Change" (SR-01, SR-08)
  function viewFacts() {
    const tpl = state.template;
    const box = el("section", { class: "card facts" }, [el("h2", { text: t("facts_title") })]);
    const dl = el("dl", { class: "fact-list" });
    tpl.questions.forEach((q) => {
      const keys = q.type === "group" ? q.fields.map((f) => f.fact) : [q.fact];
      keys.forEach((key) => {
        const f = state.facts[key];
        dl.appendChild(el("div", { class: "fact-row" }, [
          el("dt", { text: t("fact_" + key) }),
          el("dd", {}, [
            el("span", { class: "fact-value", text: factLabel(key, f) }),
            f ? el("span", { class: "fact-status " + f.status, text: t("status_" + f.status.replace(/-/g, "_")) }) : null
          ]),
          el("button", { class: "btn small", text: t("change"), "data-edit": q.id, onclick: () => editQuestion(q.id) })
        ]));
      });
    });
    box.appendChild(dl);
    return box;
  }

  function viewResult() {
    const r = state.result;
    const wrap = el("div", { class: "result" });
    if (r.state === "safety_blocked") wrap.appendChild(viewStop(r));
    else wrap.appendChild(viewList(r));
    wrap.appendChild(viewFacts());
    wrap.appendChild(el("div", { class: "actions" }, [
      el("button", { class: "btn", text: t("new_project"), onclick: resetProject })
    ]));
    return wrap;
  }

  // Stop screen (SR-03, SR-06, FR-15)
  function viewStop(r) {
    const b = r.blocked;
    const box = el("section", { class: "card stop", role: "alert", "data-state": "safety_blocked", "data-reason": b.reason }, [
      el("h2", { text: t("stop_title") })
    ]);
    const factNames = (b.facts || []).map((k) => t("fact_" + k)).join(", ");
    const mainText = {
      fact_unknown: t("stop_fact_unknown", { facts: factNames }),
      load_over_limit: t("stop_load_over_limit", { load: b.load_kg, limit: b.limit_kg }),
      wall_limit: t("stop_wall_limit", { load: b.load_kg, limit: b.limit_kg }),
      no_suitable_system: t("stop_no_suitable_system"),
      invalid_value: t("stop_invalid_value")
    }[b.reason];
    const help = {
      fact_unknown: t("stop_fact_unknown_help"),
      wall_limit: t("stop_wall_limit_help"),
      no_suitable_system: t("stop_no_suitable_system_help")
    }[b.reason];
    box.appendChild(el("p", { class: "stop-main", text: mainText }));
    if (help) box.appendChild(el("p", { text: help }));
    box.appendChild(el("p", { class: "strong", text: t("stop_professional") }));
    box.appendChild(el("p", { class: "muted small", text: t("rule") + ": " + b.rule_id }));
    box.appendChild(viewEvidence(r));
    return box;
  }

  // Shopping list (FR-06, FR-08, FR-09, FR-11, FR-30)
  function viewList(r) {
    const box = el("section", { class: "card list", "data-state": r.state });
    box.appendChild(el("h2", { text: t("list_title") + " – " + pick(state.template.title) }));
    box.appendChild(el("p", {
      class: "state-banner " + (r.state === "validated" ? "ok" : "warn"), role: "status",
      text: r.state === "validated" ? t("state_validated") : t("state_incomplete")
    }));
    box.appendChild(el("p", { class: "muted small", text: t("method") + ": " + pick(r.method.label) + " · " + t("rule") + " " + r.method.rule_id }));
    if (!state.storeId) box.appendChild(el("p", { class: "hint", text: t("no_store_hint") }));

    // Safety notices first (SR-05, SR-02)
    r.notices.filter((n) => n.id !== "estimates").forEach((n) => {
      box.appendChild(el("p", { class: "notice safety", "data-notice": n.id, text: t("notice_" + n.id) }));
    });

    ["materials", "tools", "safety"].forEach((section) => {
      const items = r.items.filter((i) => i.section === section);
      if (!items.length) return;
      box.appendChild(el("h3", { text: t("section_" + section) }));
      const ul = el("ul", { class: "items" });
      items.forEach((i) => ul.appendChild(viewItem(i)));
      box.appendChild(ul);
    });

    // Total only when every pack size and price is clear (RB-13)
    box.appendChild(el("p", { class: "total", "data-total": r.total.amount === null ? "none" : String(r.total.amount) },
      r.total.amount !== null
        ? [el("span", { text: t("total") + ": " }), el("strong", { text: window.BBI18n.formatPrice(r.total.amount) })]
        : [el("span", { text: t("total_" + r.total.reason) })]));
    box.appendChild(el("p", { class: "notice", text: t("notice_estimates") }));
    box.appendChild(viewEvidence(r));
    return box;
  }

  function viewItem(i) {
    const p = i.product;
    const li = el("li", { class: "item status-" + i.status, "data-role": i.role, "data-product": p ? p.product_nr : "" });
    if (!p) {
      li.appendChild(el("p", { class: "item-name", text: pick(i.label) }));
      li.appendChild(el("p", { class: "warn-text", text: t("unresolved_item") }));
      li.appendChild(el("p", { class: "muted small", text: t("rule") + ": " + i.rule_ids.join(", ") }));
      return li;
    }
    const id = "chk-" + i.role;
    const head = el("div", { class: "item-head" }, [
      el("input", { type: "checkbox", id, class: "check", checked: state.checked.has(p.product_nr),
        onchange: (e) => { e.target.checked ? state.checked.add(p.product_nr) : state.checked.delete(p.product_nr); li.classList.toggle("done", e.target.checked); } }),
      el("label", { for: id, class: "item-name" }, [
        el("span", { text: p.name }), el("span", { class: "muted", text: " · " + p.size }),
        el("span", { class: "sr-only", text: " – " + t("checked_off") })
      ])
    ]);
    li.appendChild(head);
    if (state.checked.has(p.product_nr)) li.classList.add("done");

    const q = i.quantity;
    const qtyText = q.clear
      ? t("qty_packs", { packs: q.packs }) + (q.pack_qty > 1 ? " (" + t("qty_need", { units: q.units }) + ")" : "")
      : t("qty_unclear");
    li.appendChild(el("p", { class: "qty" }, [
      el("span", { class: "tag estimate", text: t("qty_estimate") }),
      el("span", { text: " " + qtyText + " · " }),
      el("span", { class: "muted small", text: t("rule") + " " + q.rule_id + " / " + i.rule_ids.join(", ") })
    ]));

    const price = p.price_eur !== null ? t("price_each", { price: window.BBI18n.formatPrice(p.price_eur) }) : t("price_unknown");
    li.appendChild(el("p", { class: "price" }, [
      el("span", { text: price }),
      i.line_price !== null ? el("span", { class: "muted", text: " · " + t("line_total", { price: window.BBI18n.formatPrice(i.line_price) }) }) : null,
      el("span", { class: "tag sample", text: t("sample_note") })
    ]));

    // Store data ONLY for the selected store (RB-06, RB-15, FR-30)
    const s = R.storeInfo(state.data.stock, state.storeId, p.product_nr);
    const na = t("not_available");
    li.appendChild(el("p", { class: "store-info", "data-aisle": s.aisle_nr === null ? "none" : String(s.aisle_nr) }, [
      el("span", { text: t("stock") + ": " + (s.stock_qty === null ? na : s.stock_qty) + " · " }),
      el("span", { text: t("aisle") + ": " + (s.aisle_nr === null ? na : s.aisle_nr + (s.aisle_name ? " (" + s.aisle_name + ")" : "")) + " · " }),
      el("span", { text: t("shelf") + ": " + (s.shelf_nr === null ? na : s.shelf_nr) })
    ]));

    // Manufacturer note unchanged (SR-07)
    if (i.safety_note) {
      li.appendChild(el("p", { class: "safety-note" }, [
        el("strong", { text: t("manufacturer_note") + ": " }),
        el("span", { class: "safety-note-text", text: i.safety_note })
      ]));
    }
    if (i.hint) li.appendChild(el("p", { class: "muted small", text: t("generated_hint") + ": " + i.hint }));

    if (i.status === "incompatible") {
      li.appendChild(el("p", { class: "warn-text", role: "alert",
        text: t("variant_incompatible", { checks: i.failed_checks.map((c) => c.check + " (" + c.detail + ")").join("; ") }) }));
    }

    // Product variant change → full re-check (SR-08, RB-03)
    const variants = R.variantOptions(state.template, i.role, state.data.catalogue);
    if (variants.length > 1) {
      const sel = el("select", { class: "input variant", "aria-label": t("change_variant") + " – " + pick(i.label),
        onchange: (e) => { state.overrides[i.role] = e.target.value; recompute(); } });
      variants.forEach((v) => {
        const o = el("option", { value: v.product_nr, text: v.name + " · " + v.size + " (" + v.product_nr + ")" });
        if (v.product_nr === p.product_nr) o.selected = true;
        sel.appendChild(o);
      });
      li.appendChild(el("label", { class: "variant-label" }, [el("span", { class: "muted small", text: t("change_variant") + " " }), sel]));
    }
    return li;
  }

  // Evidence log (DR-07)
  function viewEvidence(r) {
    const d = el("details", { class: "evidence" }, [el("summary", { text: t("evidence_title") })]);
    const table = el("table", {}, [el("thead", {}, [el("tr", {}, [
      el("th", { text: t("evidence_rule") }), el("th", { text: t("evidence_check") }),
      el("th", { text: t("evidence_result") }), el("th", { text: t("evidence_source") })
    ])])]);
    const tb = el("tbody");
    r.evidence.forEach((e) => tb.appendChild(el("tr", {}, [
      el("td", { text: e.rule_id }), el("td", { text: e.check }), el("td", { text: e.result }), el("td", { text: e.source })
    ])));
    table.appendChild(tb);
    d.appendChild(el("div", { class: "table-wrap" }, [table]));
    return d;
  }

  // ---------------------------------------------------------------------
  // Flow control (orchestrator)
  // ---------------------------------------------------------------------
  function go(screen) { state.screen = screen; render(); }

  function startTemplate(tpl) {
    state.template = tpl;
    state.facts = {};
    state.overrides = {};
    state.checked = new Set();
    state.editOnly = false;
    afterFactsChanged();
  }

  function questionFacts(q) { return q.type === "group" ? q.fields.map((f) => f.fact) : [q.fact]; }

  /** Re-evaluates after every answer; asks the next open question or shows the result. */
  function afterFactsChanged() {
    // SR-08: any change of facts → product choice is re-derived and re-checked.
    state.overrides = {};
    state.editOnly = false;
    recompute(true);
  }

  function recompute(askNext) {
    const r = R.evaluate(state.template, state.facts, state.data.catalogue, state.data.safetyRules, { overrides: state.overrides });
    state.result = r;
    if (askNext && r.state === "needs_clarification") {
      const next = state.template.questions.find((q) => questionFacts(q).some((k) => r.missing_facts.includes(k)));
      state.questionId = next.id;
      state.screen = "question";
    } else {
      state.screen = "result";
    }
    render();
  }

  function editQuestion(id) {
    state.questionId = id;
    state.editOnly = true;
    go("question");
  }

  function questionBack() {
    if (state.editOnly) { state.editOnly = false; go("result"); return; }
    const qs = state.template.questions;
    const idx = qs.findIndex((q) => q.id === state.questionId);
    if (idx <= 0) { go("choose"); return; }
    state.questionId = qs[idx - 1].id;
    render();
  }

  function resetProject() {
    state.template = null; state.facts = {}; state.overrides = {}; state.checked = new Set(); state.result = null;
    go("choose");
  }

  async function boot() {
    state.screen = "loading";
    render();
    try {
      state.data = await window.BBData.loadAll(CFG);
      state.screen = "start";
    } catch (e) {
      state.error = e && e.message ? e.message : String(e);
      state.screen = "error";
    }
    render();
  }

  // Exposed for tests.html only (UI-level release-blocking tests).
  window.BBApp = Object.freeze({ state, viewResult, viewItem, viewQuestion, recompute, startTemplate });

  document.addEventListener("DOMContentLoaded", () => {
    if (document.body.dataset.autoboot === "false") return; // tests.html drives the app itself
    window.BBI18n.setLang(CFG.defaultLanguage);
    document.getElementById("lang-toggle").addEventListener("click", () => {
      window.BBI18n.setLang(window.BBI18n.getLang() === "en" ? "de" : "en");
      render();
    });
    boot();
  });
})();
