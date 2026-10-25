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
    screen: "loading",       // loading | error | start | choose | recognized | high_risk | question | result
    ai: null,                // AI adapter (ai-adapter.js), mode from config
    inputText: "",           // free text – kept on every fallback (NFR-03)
    chooseNotice: null,      // unsupported | unclear | ai_failed | too_long | empty
    recognized: null,        // { template, facts } – AI/keyword result, all facts "observed"
    pendingGuesses: {},      // guesses kept for a template chosen after a fallback
    busy: false,
    speech: {                // FR-25: voice input state (no audio is ever kept)
      Recognition: undefined, // injectable for tests; undefined = browser API
      consented: false,       // in-app consent before the first recording (this tab only)
      askConsent: false,
      listening: false,
      transcribed: false,     // text came from speech and still needs the customer's tap
      error: null,            // message key, see speech.js ERROR_KEYS
      base: ""                // text that was in the field before recording
    },
    recognizer: null,
    plzInput: "",            // FR-29: only in memory, cleared after a store is chosen (NFR-04)
    storeSearch: null,       // result of BBRules.findStores – never selects a store itself
    storeReturn: "choose",   // where to go after choosing/skipping a store
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
    const screens = { loading: viewLoading, error: viewError, start: viewStart, store: viewStore, choose: viewChoose, recognized: viewRecognized, high_risk: viewHighRisk, question: viewQuestion, result: viewResult };
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
        el("li", { "data-notice": "ai", text: t("notice_ai_" + state.ai.mode) }),
        el("li", { text: t("notice_sample") }),
        el("li", { text: t("notice_privacy") }),
        el("li", { "data-notice": "speech", text: t("notice_speech") }),
        el("li", { class: "muted", text: t("notice_stage") })
      ]),
      el("button", { class: "btn primary block", text: t("start"), onclick: () => openStoreSearch("choose") })
    ]);
  }

  // Optional store selection by PLZ (FR-29, RB-16, NFR-04)
  function viewStore() {
    const box = el("section", { class: "card", "data-screen": "store" }, [
      el("h2", { text: t("store_title") }),
      el("p", { class: "muted", text: t("store_help") })
    ]);
    const hasStores = state.data.stores.length > 0;
    if (!hasStores) {
      box.appendChild(el("p", { class: "hint warn-hint", role: "status", "data-store-notice": "unavailable", text: t("store_unavailable") }));
    } else {
      const input = el("input", {
        id: "plz-input", class: "input plz", type: "text", inputmode: "numeric", autocomplete: "off",
        maxlength: "5", "aria-label": t("store_plz_label"), placeholder: t("store_plz_placeholder")
      });
      input.value = state.plzInput;
      input.addEventListener("input", () => { state.plzInput = input.value; });
      const form = el("form", { class: "plz-form", novalidate: true }, [
        el("label", { for: "plz-input", class: "field-label", text: t("store_plz_label") }),
        el("div", { class: "number-row" }, [input, el("button", { type: "submit", class: "btn primary", id: "plz-submit", text: t("store_search") })]),
        el("p", { class: "muted small", text: t("store_privacy") })
      ]);
      form.addEventListener("submit", (e) => { e.preventDefault(); searchStores(input.value); });
      box.appendChild(form);
    }
    const res = state.storeSearch;
    if (res && hasStores) {
      const notice = res.status === "nearby" ? t("store_nearby")
        : res.status === "none_in_range" ? t("store_none_in_range", { km: CFG.store.maxDistanceKm })
        : t("store_invalid_" + res.reason);
      box.appendChild(el("p", { class: "hint" + (res.status === "nearby" ? "" : " warn-hint"), role: "status", "data-store-notice": res.status, text: notice }));
      const ul = el("ul", { class: "store-list" });
      res.stores.forEach((x) => ul.appendChild(el("li", {}, [
        el("button", { class: "btn store" + (x.store.store_id === state.storeId ? " selected" : ""), "data-store": x.store.store_id, onclick: () => chooseStore(x.store.store_id) }, [
          el("span", { class: "store-name", text: x.store.name }),
          el("span", { class: "muted small", text: x.store.city + (x.km !== null ? " · " + t("store_km", { km: formatKm(x.km) }) : "") }),
          el("span", { class: "tag sample", text: t("sample_note") })
        ])
      ])));
      box.appendChild(ul);
    }
    box.appendChild(el("div", { class: "actions" }, [
      el("button", { class: "btn", id: "store-skip", text: state.storeId ? t("store_keep") : t("store_skip"), onclick: () => leaveStoreSearch() })
    ]));
    return box;
  }

  function formatKm(km) {
    return new Intl.NumberFormat(window.BBI18n.getLang() === "de" ? "de-DE" : "en-GB", { maximumFractionDigits: km < 10 ? 1 : 0 }).format(km);
  }

  // Project entry: free text (FR-02, FR-03) plus project buttons (DR-04)
  function viewChoose() {
    const wrap = el("section", { class: "card" }, [
      el("h2", { text: t("choose_title") })
    ]);
    if (state.chooseNotice) {
      wrap.appendChild(el("p", { class: "hint warn-hint", role: "status", "data-notice": state.chooseNotice, text: t("choose_notice_" + state.chooseNotice) }));
    }
    const area = el("textarea", {
      id: "project-text", class: "input textarea", rows: "3", maxlength: String(CFG.ai.maxTextLength),
      placeholder: t("text_placeholder"), "aria-label": t("text_label")
    });
    area.value = state.inputText;
    area.addEventListener("input", () => { state.inputText = area.value; });
    const sp = state.speech;
    const supported = speechSupported();
    const mic = supported ? el("button", {
      type: "button", id: "mic-button", class: "btn mic" + (sp.listening ? " recording" : ""),
      "aria-pressed": sp.listening ? "true" : "false",
      "aria-label": sp.listening ? t("mic_stop") : t("mic_start"),
      onclick: micTap
    }, [el("span", { "aria-hidden": "true", text: sp.listening ? "■" : "🎤" }), el("span", { class: "mic-label", text: sp.listening ? t("mic_stop_short") : t("mic_start_short") })]) : null;
    const form = el("form", { class: "text-entry", novalidate: true }, [
      el("label", { for: "project-text", class: "field-label", text: t("text_label") }),
      el("div", { class: "entry-row" }, [area, mic]),
      viewSpeechStatus(supported),
      el("p", { class: "muted small", text: t("text_help") }),
      el("button", { type: "submit", class: "btn primary block", id: "text-submit", disabled: state.busy || sp.listening,
        text: state.busy ? t("text_busy") : t("text_submit") })
    ]);
    // FR-25: dictated text is only processed after this explicit tap.
    form.addEventListener("submit", (e) => { e.preventDefault(); submitText(area.value, sp.transcribed ? "speech" : "text"); });
    wrap.appendChild(form);
    wrap.appendChild(el("p", { class: "muted or", text: t("or_choose") }));
    const grid = el("div", { class: "template-grid" });
    state.data.templates.forEach((tpl) => {
      const reviewed = tpl.review && tpl.review.status === "reviewed";
      grid.appendChild(el("button", {
        class: "btn template", "data-template": tpl.template_id,
        onclick: () => startTemplate(tpl, state.pendingGuesses)
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

  // Voice input status: consent, recording indicator, check hint, errors (FR-25, NFR-04, RB-19)
  function viewSpeechStatus(supported) {
    const sp = state.speech;
    const box = el("div", { class: "speech-status", "aria-live": "polite" });
    if (!supported) {
      box.appendChild(el("p", { class: "muted small", "data-speech": "unsupported", text: t("speech_error_unsupported") }));
      return box;
    }
    if (sp.askConsent) {
      box.appendChild(el("div", { class: "consent", role: "dialog", "aria-labelledby": "consent-title", "data-speech": "consent" }, [
        el("p", { id: "consent-title", class: "strong", text: t("speech_consent_title") }),
        el("p", { class: "small", text: t("speech_consent_text") }),
        el("div", { class: "actions" }, [
          el("button", { type: "button", class: "btn", id: "consent-decline", text: t("cancel"), onclick: consentDecline }),
          el("button", { type: "button", class: "btn primary", id: "consent-accept", text: t("speech_consent_accept"), onclick: consentAccept })
        ])
      ]));
    }
    if (sp.listening) {
      box.appendChild(el("p", { class: "recording-indicator", role: "status", "data-speech": "listening" }, [
        el("span", { class: "rec-dot", "aria-hidden": "true" }), el("span", { text: t("speech_listening") })
      ]));
    } else if (sp.transcribed) {
      box.appendChild(el("p", { class: "hint", "data-speech": "check", text: t("speech_check") }));
    }
    if (sp.error) box.appendChild(el("p", { class: "hint warn-hint", role: "alert", "data-speech": "error-" + sp.error, text: t("speech_error_" + sp.error) }));
    return box;
  }

  // What we understood – everything is a guess until confirmed (FR-03, NFR-05, SR-01)
  function viewRecognized() {
    const rec = state.recognized;
    const box = el("section", { class: "card", "data-screen": "recognized" }, [
      el("h2", { text: t("recognized_title") }),
      el("p", {}, [el("span", { text: t("recognized_project") + ": " }), el("strong", { text: pick(rec.template.title) }),
        el("span", { class: "fact-status observed", text: t("status_observed") })])
    ]);
    const keys = Object.keys(rec.facts);
    if (keys.length) {
      box.appendChild(el("p", { text: t("recognized_values") }));
      const ul = el("ul", { class: "guess-list" });
      keys.forEach((k) => ul.appendChild(el("li", { "data-fact": k }, [
        el("span", { text: t("fact_" + k) + ": " }), el("strong", { text: factLabel(k, rec.facts[k]) }),
        el("span", { class: "fact-status observed", text: t("status_observed") })
      ])));
      box.appendChild(ul);
    }
    box.appendChild(el("p", { class: "muted small", text: t("recognized_confirm_note") }));
    box.appendChild(el("p", { class: "muted small", text: t("recognized_source_" + state.ai.mode) }));
    box.appendChild(el("div", { class: "actions" }, [
      el("button", { class: "btn", text: t("recognized_other"), onclick: () => { state.recognized = null; go("choose"); } }),
      el("button", { class: "btn primary", id: "recognized-continue", text: t("recognized_continue"), onclick: () => startTemplate(rec.template, rec.facts) })
    ]));
    return box;
  }

  // High-risk work: clear stop and professional hand-off (SR-09, FR-15)
  function viewHighRisk() {
    return el("section", { class: "card stop", role: "alert", "data-state": "high_risk" }, [
      el("h2", { text: t("high_risk_title") }),
      el("p", { class: "stop-main", text: t("high_risk_text") }),
      el("p", { class: "muted small", text: t("rule") + ": SR-09" }),
      el("div", { class: "actions" }, [el("button", { class: "btn", text: t("new_project"), onclick: () => { state.inputText = ""; state.chooseNotice = null; go("choose"); } })])
    ]);
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
    const fact = state.facts[f.fact];
    const current = fact ? fact.value : null;
    const box = el("div", { class: "field" });
    if (inGroup) box.appendChild(el("p", { class: "field-label", id: "lbl-" + f.fact, text: pick(f.label) }));
    // SR-11 read-back: a recognised value is shown as a guess and must be confirmed by tap.
    if (fact && fact.status === R.STATUS.OBSERVED) {
      box.appendChild(el("p", { class: "guess", "data-guess": f.fact }, [
        el("span", { class: "fact-status observed", text: t("status_observed") }),
        el("span", { text: " " + t("guess_read_back", { value: factLabel(f.fact, fact) }) })
      ]));
    }

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
    // FR-30: without a store the list is complete, only aisle/shelf/stock are "not available".
    const store = state.storeId ? state.data.stores.find((x) => x.store_id === state.storeId) : null;
    box.appendChild(el("div", { class: "store-bar", "data-store-bar": store ? store.store_id : "none" }, store
      ? [el("span", { text: t("store_selected") + ": " }), el("strong", { text: store.name + " (" + store.city + ")" }),
        el("span", { class: "tag sample", text: t("sample_note") }),
        el("button", { class: "btn small", id: "change-store", text: t("store_change"), onclick: () => openStoreSearch("result") })]
      : [el("p", { class: "hint", text: t("no_store_hint") }),
        el("button", { class: "btn small", id: "add-plz", text: t("store_add_plz"), onclick: () => openStoreSearch("result") })]));

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
    // NFR-05 / SR-10: how this list was made and the template's review status
    const rv = r.review || {};
    box.appendChild(el("p", { class: "transparency", "data-transparency": "list" }, [
      el("span", { text: t("list_transparency") + " " }),
      el("span", { text: t("list_template_status", {
        version: r.template_version,
        status: rv.status === "reviewed" ? t("template_reviewed") + (rv.review_date ? " (" + rv.review_date + ")" : "") : t("template_unreviewed")
      }) })
    ]));
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
  function go(screen) {
    if (screen !== "choose") stopRecognizer(true);
    state.screen = screen;
    render();
  }

  // ---------------------------------------------------------------------
  // Voice input (speech.js) – produces text only, never decisions
  // ---------------------------------------------------------------------
  function speechCtor() {
    return state.speech.Recognition === undefined ? window.BBSpeech.nativeRecognition() : state.speech.Recognition;
  }
  function speechSupported() { return !!speechCtor(); }

  function micTap() {
    const sp = state.speech;
    if (sp.listening) { stopRecognizer(false); return; }
    sp.error = null;
    // NFR-04: explain the browser speech service before the microphone is used.
    if (!sp.consented) { sp.askConsent = true; render(); return; }
    startRecognizer();
  }

  function consentAccept() {
    state.speech.consented = true;
    state.speech.askConsent = false;
    startRecognizer();
  }

  function consentDecline() {
    state.speech.askConsent = false;
    render();
  }

  function startRecognizer() {
    const sp = state.speech;
    sp.base = state.inputText.trim();
    sp.error = null;
    state.recognizer = window.BBSpeech.create({
      Recognition: speechCtor(),
      lang: window.BBI18n.getLang(),
      onText: (text) => {
        // Live transcript into the editable field (interim results).
        state.inputText = (sp.base ? sp.base + " " : "") + text;
        const area = document.getElementById("project-text");
        if (area) area.value = state.inputText;
        if (text) sp.transcribed = true;
      },
      onState: (st) => {
        sp.listening = st === "listening";
        if (!sp.listening) state.recognizer = null;
        render();
      },
      onError: (key) => {
        sp.error = key;
        sp.listening = false;
        render();
      }
    });
    if (!state.recognizer.start()) { sp.listening = false; render(); }
  }

  /** Stops recording; abort=true discards nothing typed, only ends the microphone. */
  function stopRecognizer(abort) {
    const r = state.recognizer;
    if (!r) return;
    if (abort) r.abort(); else r.stop();
  }

  /** Starts a template; guesses (from text) become "observed" facts – never confirmed (SR-01). */
  function startTemplate(tpl, guesses) {
    state.template = tpl;
    state.facts = {};
    Object.entries(guesses || {}).forEach(([k, f]) => {
      if ((tpl.required_facts || []).includes(k)) state.facts[k] = R.makeFact(f.value, R.STATUS.OBSERVED, f.source);
    });
    state.recognized = null;
    state.pendingGuesses = {};
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
    stopRecognizer(true); // leaving the entry screen ends any recording
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

  // ---------------------------------------------------------------------
  // Store selection (FR-29): code only, on the device; never automatic
  // ---------------------------------------------------------------------
  function openStoreSearch(returnTo) {
    state.storeReturn = returnTo;
    state.storeSearch = null;
    state.plzInput = "";
    go("store");
  }

  /** NFR-07: the PLZ is checked in code; NFR-04: it is never logged or sent to the AI. */
  function searchStores(input) {
    state.storeSearch = R.findStores(input, state.data.plzTable, state.data.stores, CFG.store);
    render();
    return state.storeSearch;
  }

  /** Only a tap by the customer selects a store (RB-16). */
  function chooseStore(storeId) {
    if (!state.data.stores.some((x) => x.store_id === storeId)) return;
    state.storeId = storeId;
    leaveStoreSearch();
  }

  function leaveStoreSearch() {
    state.plzInput = "";      // the PLZ is not kept
    state.storeSearch = null;
    // D-3: a store change only looks up aisle/shelf again – checks stay identical (RB-17).
    go(state.storeReturn === "result" && state.result ? "result" : "choose");
  }

  /** Turns validated adapter facts into guesses for the template's required facts. */
  function guessesFor(tpl, facts, source) {
    const out = {};
    Object.entries(facts || {}).forEach(([k, v]) => {
      if (v !== null && (tpl.required_facts || []).includes(k)) out[k] = { value: v, source };
    });
    return out;
  }

  /**
   * Free text → G0 scope check (code) → AI adapter (understanding only) →
   * recognised project with guesses, or fallback to the templates (NFR-03).
   * The same function is used for typed and (stage 3) dictated text.
   */
  async function submitText(text, origin) {
    const clean = String(text || "").trim();
    state.inputText = String(text || "");
    state.speech.transcribed = false; // the customer's tap confirmed the transcript (FR-25)
    state.chooseNotice = null;
    state.pendingGuesses = {};
    if (!clean) { state.chooseNotice = "empty"; go("choose"); return state.screen; }
    if (clean.length > CFG.ai.maxTextLength) { state.chooseNotice = "too_long"; go("choose"); return state.screen; }

    // G0 – deterministic high-risk check BEFORE and independent of the AI (SR-09).
    if (R.checkScope(clean, state.data.safetyRules).highRisk) { go("high_risk"); return state.screen; }

    state.busy = true;
    render();
    let res;
    try { res = await state.ai.understand(clean, window.BBI18n.getLang()); } catch (_) { res = { ok: false, reason: "error" }; }
    state.busy = false;
    const source = (origin || "text") + ":" + (res.source || state.ai.mode);
    const templates = state.data.templates;

    if (!res.ok) {
      // NFR-03: AI failed → templates; keep the text and the keyword guesses.
      const local = window.BBAI.templateUnderstand(clean, state.data.lexicon, templates.map((x) => x.template_id));
      templates.forEach((tpl) => Object.assign(state.pendingGuesses, guessesFor(tpl, local.facts, (origin || "text") + ":template")));
      state.chooseNotice = "ai_failed";
      go("choose");
      return state.screen;
    }
    const out = res.output;
    if (out.high_risk) { go("high_risk"); return state.screen; }
    const tpl = templates.find((x) => x.template_id === out.intent);
    if (!tpl) {
      state.chooseNotice = out.intent === "unsupported" ? "unsupported" : "unclear";
      templates.forEach((x) => Object.assign(state.pendingGuesses, guessesFor(x, out.facts, source)));
      go("choose");
      return state.screen;
    }
    state.recognized = { template: tpl, facts: guessesFor(tpl, out.facts, source) };
    go("recognized");
    return state.screen;
  }

  function resetProject() {
    state.inputText = ""; state.chooseNotice = null; state.pendingGuesses = {}; state.recognized = null;
    state.template = null; state.facts = {}; state.overrides = {}; state.checked = new Set(); state.result = null;
    go("choose");
  }

  async function boot() {
    state.screen = "loading";
    render();
    try {
      state.data = await window.BBData.loadAll(CFG);
      state.ai = createAdapter(CFG.aiMode);
      state.screen = "start";
    } catch (e) {
      state.error = e && e.message ? e.message : String(e);
      state.screen = "error";
    }
    render();
  }

  /** AI mode from config; "?ai=mock" or "?ai=template" in the URL may override it for demos. */
  function createAdapter(mode) {
    const q = new URLSearchParams(window.location.search).get("ai");
    const m = q === "mock" || q === "template" ? q : mode;
    return window.BBAI.create({
      mode: m,
      lexicon: state.data.lexicon,
      templateIds: state.data.templates.map((x) => x.template_id),
      proxyUrl: CFG.ai.proxyUrl,
      timeoutMs: CFG.ai.timeoutMs,
      mockResponses: state.data.mockResponses
    });
  }

  // Exposed for tests.html only (UI-level release-blocking tests).
  window.BBApp = Object.freeze({
    state, viewResult, viewItem, viewQuestion, viewChoose, viewRecognized, viewHighRisk,
    recompute, startTemplate, submitText, micTap, consentAccept, consentDecline,
    viewStore, viewList, openStoreSearch, searchStores, chooseStore, leaveStoreSearch
  });

  document.addEventListener("DOMContentLoaded", () => {
    if (document.body.dataset.autoboot === "false") return; // tests.html drives the app itself
    window.BBI18n.setLang(CFG.defaultLanguage);
    document.getElementById("lang-toggle").addEventListener("click", () => {
      stopRecognizer(true); // recognition language follows the UI language
      window.BBI18n.setLang(window.BBI18n.getLang() === "en" ? "de" : "en");
      render();
    });
    // Recording can always be cancelled with Escape (FR-25).
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") stopRecognizer(false); });
    boot();
  });
})();
