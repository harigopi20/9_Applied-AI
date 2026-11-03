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
    storeOrigin: null,       // FR-31: centre of the entered PLZ (coordinates only, in memory)
    storeReturn: "choose",   // where to go after choosing/skipping a store
    leaveAsk: false,         // issue #101: "Leave your list?" shown after back on the first step
    template: null,
    facts: {},
    questionId: null,
    editOnly: false,         // true when the customer changes one answer (SR-08)
    overrides: {},           // role -> product_nr chosen by the customer
    owned: new Set(),        // roles the customer already has (C-8) – rules.js decides if allowed
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

  // Line icons (presentation only, static SVG paths – never built from data)
  const ICONS = {
    home: ["M3 11.5 12 4l9 7.5", "M5.5 9.5V20h13V9.5"],
    store: ["M3 9h18", "M4 9l1.5-5h13L20 9", "M5 9v11h14V9", "M9 20v-6h6v6"],
    list: ["M3 5h2l2.2 10.2a1 1 0 0 0 1 .8h9.6a1 1 0 0 0 1-.8L20 8H6.2", "M9 20.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1", "M17 20.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1"],
    shelf: ["M3 9h18", "M3 15h18", "M6 9v3", "M18 9v3", "M6 15v3", "M18 15v3"],
    picture: ["M4 5h16v14H4z", "M4 15l4.5-4.5 4 4 2.5-2.5L20 17"],
    cabinet: ["M5 4h14v11H5z", "M12 4v11", "M10 9.5v1", "M14 9.5v1", "M3 19h18"],
    anchor: ["M5 21V8h9v13", "M14 10l4-3", "M19 3v18"],
    paint: ["M4 4h13v5H4z", "M17 6.5h3v6h-8v3", "M11 15.5h2v5h-2z"],
    glass_door: ["M6 3h12v18H6z", "M9 7l3-2.5", "M9 11l6-5", "M15 12v3"],
    lock: ["M6 11h12v10H6z", "M8.5 11V8a3.5 3.5 0 0 1 7 0v3", "M12 15v2"],
    sliding_door: ["M3 4h18", "M5 6h8v15H5z", "M13 6h6v15h-6", "M7 13h2"],
    wallpaper: ["M5 3h10v18H5z", "M15 5h3a1 1 0 0 1 1 1v3", "M8 7l4 4", "M8 12l4 4"],
    mic: ["M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z", "M5 11a7 7 0 0 0 14 0", "M12 18v3"],
    stop: ["M7 7h10v10H7z"]
  };
  const ACCENTS = { shelf: "M14 4h6v5h-6z", picture: "M15 7h3v3h-3z", store: "M15 2h6v4h-6z" };
  function icon(name, accent) {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("class", "icon icon-" + name);
    if (accent && ACCENTS[name]) {
      const a = document.createElementNS(NS, "path");
      a.setAttribute("d", ACCENTS[name]);
      a.setAttribute("class", "icon-accent");
      svg.appendChild(a);
    }
    (ICONS[name] || []).forEach((d) => {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", d);
      svg.appendChild(p);
    });
    return svg;
  }

  /**
   * Flag for the language button (own inline SVG, no image file or emoji – emoji flags
   * do not show on Windows). "DE" = Germany, "EN" = United Kingdom (Union Jack).
   */
  function flag(code) {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("class", "flag flag-" + code.toLowerCase());
    svg.setAttribute("data-flag", code);
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    const add = (tag, attrs) => {
      const n = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      svg.appendChild(n);
    };
    if (code === "DE") {
      svg.setAttribute("viewBox", "0 0 5 3");
      add("rect", { width: 5, height: 1, y: 0, fill: "#000000" });
      add("rect", { width: 5, height: 1, y: 1, fill: "#DD0000" });
      add("rect", { width: 5, height: 1, y: 2, fill: "#FFCE00" });
    } else {
      svg.setAttribute("viewBox", "0 0 60 30");
      add("rect", { width: 60, height: 30, fill: "#012169" });
      add("path", { d: "M0,0 L60,30 M60,0 L0,30", stroke: "#FFFFFF", "stroke-width": 6 });
      add("path", { d: "M0,0 L60,30 M60,0 L0,30", stroke: "#C8102E", "stroke-width": 2 });
      add("path", { d: "M30,0 V30 M0,15 H60", stroke: "#FFFFFF", "stroke-width": 10 });
      add("path", { d: "M30,0 V30 M0,15 H60", stroke: "#C8102E", "stroke-width": 6 });
    }
    return svg;
  }

  /** Price with small cents, e.g. 14,⁹⁹ € (display only; amount from the catalogue). */
  function priceEl(amount, cls) {
    const lang = window.BBI18n.getLang();
    const parts = new Intl.NumberFormat(lang === "de" ? "de-DE" : "en-GB", { style: "currency", currency: "EUR" }).formatToParts(amount);
    const box = el("span", { class: "price-value" + (cls ? " " + cls : ""), "aria-label": window.BBI18n.formatPrice(amount) });
    parts.forEach((pt) => {
      if (pt.type === "fraction") box.appendChild(el("sup", { class: "cents", text: pt.value }));
      else if (pt.type === "currency") box.appendChild(el("span", { class: "cur", text: pt.value }));
      else if (pt.type !== "literal" || pt.value.trim()) box.appendChild(el("span", { text: pt.value }));
    });
    return box;
  }

  const main = () => document.getElementById("main");

  /** Product name in the UI language (catalogue v2 has product_name_de); text from data, never translated by code. */
  function productName(p) {
    return window.BBI18n.getLang() === "de" && p.name_de ? p.name_de : p.name;
  }

  function render() {
    syncHistory();
    if (!document.getElementById("main")) return; // headless use in tests.html
    document.documentElement.lang = window.BBI18n.getLang();
    renderHeader();
    const m = main();
    m.replaceChildren();
    const screens = { loading: viewLoading, error: viewError, start: viewStart, store: viewStore, choose: viewChoose, recognized: viewRecognized, high_risk: viewHighRisk, question: viewQuestion, result: viewResult, shopping: viewShopping };
    m.appendChild(state.leaveAsk ? viewLeave() : screens[state.screen]());
    renderNav();
    renderProgress();
    document.getElementById("footer-text").textContent = t("footer");
    m.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function renderHeader() {
    document.getElementById("app-title").textContent = t("app_title");
    document.getElementById("app-tagline").textContent = t("app_tagline");
    document.getElementById("sample-badge").textContent = t("sample_badge");
    const btn = document.getElementById("lang-toggle");
    // Flag of the language the button switches to (EN screen → German flag), text only for screen readers
    btn.replaceChildren(flag(t("lang_toggle_short")), el("span", { class: "sr-only", text: t("lang_toggle") }));
    btn.setAttribute("aria-label", t("lang_toggle_aria"));
    btn.setAttribute("title", t("lang_toggle"));
  }

  // Progress bar over the flow: Store → Project → Questions → List → Shopping (NFR-01, NFR-05)
  const STEPS = ["store", "project", "questions", "list", "shopping"];

  /** Which step a screen belongs to, and whether the flow stopped there (safety stop). */
  function progressStep() {
    const sc = state.screen;
    if (["loading", "error", "start"].includes(sc)) return null;
    if (sc === "store") return { step: "store", stop: false };
    if (sc === "choose" || sc === "recognized") return { step: "project", stop: false };
    if (sc === "high_risk") return { step: "project", stop: true };
    if (sc === "question") return { step: "questions", stop: false };
    if (sc === "result") {
      const blocked = state.result && state.result.state === "safety_blocked";
      return blocked ? { step: "questions", stop: true } : { step: "list", stop: false };
    }
    if (sc === "shopping") return { step: "shopping", stop: false };
    return null;
  }

  function renderProgress() {
    const bar = document.getElementById("progress");
    if (!bar) return;
    const p = progressStep();
    bar.hidden = !p;
    if (!p) return;
    bar.replaceChildren(viewProgress(p));
  }

  function viewProgress(p) {
    const at = STEPS.indexOf(p.step);
    const ol = el("ol", { class: "progress-steps", "data-step": p.step, "data-stop": p.stop ? "1" : "0" });
    STEPS.forEach((s, i) => {
      const status = i < at ? "done" : i === at ? (p.stop ? "stop" : "current") : "todo";
      ol.appendChild(el("li", { class: "progress-step " + status, "data-progress": s, "aria-current": i === at ? "step" : null }, [
        el("span", { class: "progress-seg", "aria-hidden": "true" }),
        el("span", { class: "progress-label", text: t("step_" + s) }),
        el("span", { class: "sr-only", text: " – " + t("step_status_" + status) })
      ]));
    });
    return ol;
  }

  // Bottom tab bar (NFR-01: one-handed use in the store)
  function renderNav() {
    const nav = document.getElementById("tab-bar");
    if (!nav) return;
    const hidden = ["loading", "error", "start"].includes(state.screen);
    nav.hidden = hidden;
    document.body.classList.toggle("has-nav", !hidden);
    if (hidden) return;
    const active = state.screen === "store" ? "store" : ["result", "shopping"].includes(state.screen) ? "list" : "home";
    const items = [
      { id: "home", label: t("nav_start"), action: resetProject },
      { id: "store", label: t("nav_store"), action: () => openStoreSearch(state.screen === "shopping" ? "shopping" : state.result ? "result" : "choose") },
      { id: "list", label: t("nav_list"), action: () => go("result"), disabled: !state.result }
    ];
    nav.replaceChildren(...items.map((it) => el("button", {
      type: "button", class: "tab" + (it.id === active ? " active" : ""), "data-tab": it.id,
      "aria-current": it.id === active ? "page" : null, disabled: it.disabled,
      onclick: it.action
    }, [icon(it.id), el("span", { text: it.label })])));
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
          el("span", { class: "muted small", text: [x.store.street, (x.store.plz + " " + x.store.city).trim()].filter(Boolean).join(", ") + (x.km !== null ? " · " + t("store_km", { km: formatKm(x.km) }) : "") }),
          x.store.opening_hours ? el("span", { class: "muted small", text: x.store.opening_hours }) : null,
          el("span", { class: "tag sample", text: t("sample_note") })
        ])
      ])));
      box.appendChild(ul);
      box.appendChild(el("p", { class: "muted small", "data-store-disclaimer": "1", text: t("store_disclaimer") }));
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
    }, [icon(sp.listening ? "stop" : "mic"), el("span", { class: "mic-label", text: sp.listening ? t("mic_stop_short") : t("mic_start_short") })]) : null;
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
    // Project buttons grouped as in the project catalogue (Wall mounting, Decorating, Doors & locks).
    const groups = [];
    state.data.templates.forEach((tpl) => {
      const key = tpl.group ? tpl.group.en : "";
      let g = groups.find((x) => x.key === key);
      if (!g) { g = { key, label: tpl.group, list: [] }; groups.push(g); }
      g.list.push(tpl);
    });
    groups.forEach((g) => {
      if (g.label) wrap.appendChild(el("h3", { class: "template-group", text: pick(g.label) }));
      const grid = el("div", { class: "template-grid" });
      g.list.forEach((tpl) => {
        grid.appendChild(el("button", {
          class: "btn template", "data-template": tpl.template_id,
          onclick: () => startTemplate(tpl, state.pendingGuesses)
        }, [
          el("span", { class: "template-icon", "aria-hidden": "true" }, [icon(ICONS[tpl.icon] ? tpl.icon : "shelf", true)]),
          el("span", { class: "template-title", text: pick(tpl.title) })
          // Safety level and template version are shown on the list only, not on the tiles (user request 3 Nov 2026).
        ]));
      });
      wrap.appendChild(grid);
    });
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
        el("span", { text: factName(k, rec.template) + ": " }), el("strong", { text: factLabel(k, rec.facts[k], rec.template) }),
        el("span", { class: "fact-status observed", text: t("status_observed") })
      ])));
      box.appendChild(ul);
    }
    if (rec.corrections && rec.corrections.length) {
      const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
      const ul = el("ul", { class: "typo-list", "data-corrections": String(rec.corrections.length) });
      rec.corrections.forEach((c) => ul.appendChild(el("li", { text: t("recognized_typo", { typed: c.typed, understood: cap(c.understood) }) })));
      box.appendChild(el("div", { class: "hint", role: "note" }, [el("p", { class: "strong", text: t("recognized_typo_title") }), ul]));
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
    const live = { values: {}, updaters: [], q };
    fields.forEach((f) => getters.push(renderField(form, f, q.type === "group", live)));
    const refresh = () => { const facts = liveFacts(live); live.updaters.forEach((u) => u(facts)); };
    form.addEventListener("input", refresh);
    form.addEventListener("click", refresh);

    const error = el("p", { class: "error", role: "alert", "aria-live": "polite" });
    form.appendChild(error);
    form.appendChild(el("p", { class: "muted small", text: t("confirmed_note") }));

    const submit = (e) => {
      e.preventDefault();
      const values = [];
      for (const g of getters) {
        const v = g();
        if (v.skip) continue; // field not shown (show_when)
        if (v.error) { error.textContent = v.error; return; }
        values.push(v);
      }
      // Every answer given by tap is "user-confirmed" (SR-01).
      values.forEach((v) => {
        state.facts[v.fact] = R.makeFact(v.value, R.STATUS.CONFIRMED, v.source || "question:" + q.id);
        // D-2: a value typed for the estimate (e.g. shelf length) is confirmed too
        (v.extra || []).forEach((x) => { state.facts[x.fact] = R.makeFact(x.value, R.STATUS.CONFIRMED, "question:" + q.id); });
      });
      afterFactsChanged();
    };
    form.addEventListener("submit", submit);

    const actions = el("div", { class: "actions" }, [
      el("button", { type: "button", class: "btn", text: state.editOnly ? t("cancel") : t("back"), onclick: questionBack }),
      el("button", { type: "submit", class: "btn primary", text: t("next") })
    ]);
    form.appendChild(actions);
    refresh();
    return form;
  }

  /** Renders one field; returns a getter that validates the value in code. */
  function renderField(form, f, inGroup, live) {
    live = live || { values: {}, updaters: [], q: { type: "single", fact: f.fact } };
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

    if (f.type === "multi") return renderMulti(form, box, f, current, inGroup);

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
      live.values[f.fact] = () => (selected === null || selected === undefined ? undefined : selected);
      // SHELF-S1: the split choice shows the plan ("3 boards of 100 cm") while typing the length
      const sg = state.template.segments;
      if (sg && sg.layout_fact === f.fact) {
        const plan = el("p", { class: "guess", "data-segment-plan": "1" });
        box.appendChild(plan);
        live.updaters.push((facts) => {
          const p = R.segmentPlan(state.template, Number(R.trustedValue(facts, sg.length_fact)));
          plan.textContent = p ? segText("plan", { count: p.count, length: fmtNum(p.length) + " " + p.unit }) : "";
        });
      }
      if (f.show_when) live.updaters.push((facts) => { box.hidden = !showWhenMet(f, facts); });
      form.appendChild(box);
      return () => {
        if (box.hidden) return { skip: true };
        return selected === null || selected === undefined
          ? { error: t("choose_option") }
          : { fact: f.fact, value: selected };
      };
    }

    // number
    const input = el("input", {
      type: "text", inputmode: "decimal", autocomplete: "off", class: "input",
      id: "in-" + f.fact, "aria-labelledby": inGroup ? "lbl-" + f.fact : "q-text",
      value: current !== null && current !== R.UNKNOWN_VALUE ? String(current) : ""
    });
    const row = el("div", { class: "number-row" }, [input, f.unit ? el("span", { class: "unit", text: f.unit }) : null]);
    // D-2 (FR-04, SR-14): weight answers "I know it" / "weigh it" / "estimate for me" / "I don't know"
    const weight = f.fact === "load_kg" && f.allow_unknown ? weightHelp(f, input, box) : null;
    box.appendChild(row);
    live.values[f.fact] = () => {
      const n = Number(input.value.trim().replace(",", "."));
      return input.value.trim() !== "" && Number.isFinite(n) ? n : undefined;
    };
    const hints = fieldHints(f, state.template, live.q, live);
    if (hints) box.appendChild(hints);
    if (weight) box.appendChild(weight.after);
    let unknown = false;
    if (f.allow_unknown) {
      box.appendChild(el("button", {
        type: "button", class: "btn choice", "data-value": "unknown", text: t("dont_know"),
        onclick: () => { unknown = true; form.requestSubmit(); }
      }));
    }
    form.appendChild(box);
    return () => {
      if (unknown) return { fact: f.fact, value: R.UNKNOWN_VALUE, source: "question:answer:dont_know" };
      // Validation in code: comma or dot decimal, within template range.
      const raw = input.value.trim().replace(",", ".");
      const n = Number(raw);
      const ok = raw !== "" && Number.isFinite(n) && n >= f.min && n <= f.max && (!f.integer || Number.isInteger(n));
      if (!ok) return { error: t("value_required", { min: f.min, max: f.max }) };
      const est = weight && weight.estimate();
      return est && est.value === n
        ? { fact: f.fact, value: n, source: "question:estimate:" + est.rule_id, extra: est.extra }
        : { fact: f.fact, value: n, source: weight && weight.mode() === "weigh" ? "question:weighed" : undefined };
    };
  }

  /**
   * D-2: help for the weight question. Returns { after, mode(), estimate() }.
   * "Estimate for me" is offered only where the template has an estimate rule
   * (shelf: books per cm, team decision 31 Oct 2026). The estimate fills the
   * field, is labelled as an estimate and counts only after "Confirm".
   */
  function weightHelp(f, input, box) {
    let mode = "know", est = null;
    const tip = el("p", { class: "hint", "data-weight-tip": "1", hidden: true, text: t("weight_weigh_tip") });
    const estBox = el("div", { class: "estimate-box", "data-estimate-box": "1", hidden: true });
    const estNote = el("p", { class: "guess", "data-estimate-note": "1" });
    const rule = f.estimate || null;
    if (rule) {
      const known = state.facts[rule.basis_fact];
      const basis = el("input", { type: "text", inputmode: "decimal", autocomplete: "off", class: "input", id: "in-estimate-basis",
        "aria-label": pick(rule.label), value: known && known.value !== R.UNKNOWN_VALUE ? String(known.value) : "" });
      const calc = () => {
        const n = Number(basis.value.trim().replace(",", "."));
        if (!Number.isFinite(n) || n < rule.basis_min || n > rule.basis_max) {
          est = null;
          estNote.textContent = t("value_required", { min: rule.basis_min, max: rule.basis_max });
          return;
        }
        const kg = Math.ceil(n * rule.kg_per_unit);
        est = { value: kg, rule_id: rule.rule_id, extra: [{ fact: rule.basis_fact, value: n }] };
        input.value = String(kg);
        estNote.replaceChildren(el("span", { class: "tag estimate", text: t("qty_estimate") }),
          el("span", { text: " " + t("weight_estimate_result", { kg, basis: n, unit: rule.basis_unit, rule: rule.rule_id }) + " " + pick(rule.explain) }));
      };
      estBox.append(el("label", { for: "in-estimate-basis", class: "field-label", text: pick(rule.label) }),
        el("div", { class: "number-row" }, [basis, el("span", { class: "unit", text: rule.basis_unit }),
          el("button", { type: "button", class: "btn small", id: "estimate-run", text: t("weight_estimate_run"), onclick: calc })]),
        estNote);
    }
    input.addEventListener("input", () => { if (est && Number(input.value.replace(",", ".")) !== est.value) est = null; });
    const modes = [["know", t("weight_know")], ["weigh", t("weight_weigh")]].concat(rule ? [["estimate", t("weight_estimate")]] : []);
    const group = el("div", { class: "choices weight-modes", role: "radiogroup", "aria-label": t("weight_how") });
    const set = (m) => {
      mode = m;
      tip.hidden = m !== "weigh";
      estBox.hidden = m !== "estimate";
      if (m !== "estimate") est = null;
      group.querySelectorAll(".choice").forEach((c) => {
        const on = c.getAttribute("data-mode") === m;
        c.classList.toggle("selected", on);
        c.setAttribute("aria-checked", on ? "true" : "false");
      });
    };
    modes.forEach(([m, label]) => group.appendChild(el("button", { type: "button", class: "btn choice" + (m === "know" ? " selected" : ""),
      role: "radio", "aria-checked": m === "know" ? "true" : "false", "data-mode": m, text: label, onclick: () => set(m) })));
    box.appendChild(group);
    return { after: el("div", {}, [tip, estBox]), mode: () => mode, estimate: () => (mode === "estimate" ? est : null) };
  }

  /**
   * Checklist field (e.g. used-item defects C-7, wall condition). The customer
   * must tick at least one box – "none" is an explicit answer, never a default.
   * Value: array of ticked options ([] = none).
   */
  function renderMulti(form, box, f, current, inGroup) {
    const ticked = new Set(Array.isArray(current) ? current : []);
    let none = Array.isArray(current) && current.length === 0;
    const list = el("div", { class: "checklist", role: "group", "aria-labelledby": inGroup ? "lbl-" + f.fact : "q-text" });
    const boxes = [];
    const mk = (value, label) => {
      const id = "ms-" + f.fact + "-" + value;
      const input = el("input", { type: "checkbox", id, class: "check", "data-value": value,
        checked: value === "none" ? none : ticked.has(value) });
      input.addEventListener("change", () => {
        if (value === "none") {
          none = input.checked;
          if (none) { ticked.clear(); boxes.forEach((b) => { if (b !== input) b.checked = false; }); }
        } else {
          if (input.checked) ticked.add(value); else ticked.delete(value);
          if (input.checked) { none = false; boxes.filter((b) => b.getAttribute("data-value") === "none").forEach((b) => { b.checked = false; }); }
        }
      });
      boxes.push(input);
      return el("label", { for: id, class: "check-option" }, [input, el("span", { text: label })]);
    };
    f.options.forEach((opt) => list.appendChild(mk(opt, optionLabel(f, opt))));
    list.appendChild(mk("none", pick(f.none_label) || t("dont_know")));
    box.appendChild(list);
    form.appendChild(box);
    return () => {
      if (!none && ticked.size === 0) {
        return f.optional ? { fact: f.fact, value: [] } : { error: t("choose_option_multi") };
      }
      return { fact: f.fact, value: none ? [] : f.options.filter((o) => ticked.has(o)) };
    };
  }

  /** Number in the UI language (2.5 → "2,5" in German). */
  function fmtNum(v) {
    return new Intl.NumberFormat(window.BBI18n.getLang() === "de" ? "de-DE" : "en-GB", { maximumFractionDigits: 1 }).format(v);
  }

  /** Texts of the split option (SHELF-S1, CAB-S1) come from the project template. */
  function segText(key, vars, tpl) {
    const sg = (tpl || state.template || {}).segments;
    const txt = sg && sg.texts && sg.texts[key] ? pick(sg.texts[key]) : "";
    return txt.replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? String(vars[k]) : m));
  }

  function noticeText(n) {
    if (n.text) return pick(n.text);
    if (n.id === "segments") {
      const v = { count: n.count, length: fmtNum(n.length), total: fmtNum(n.total), kg: fmtNum(n.load_kg), cut: n.cut_from !== null ? fmtNum(n.cut_from) : "" };
      return [segText("notice", v), segText("load_" + n.load_from, v), n.cut_from !== null ? segText("cut", v) : ""].filter(Boolean).join(" ");
    }
    return t("notice_" + n.id, n);
  }

  // ---------------------------------------------------------------------
  // Proposal A (3 Nov 2026): show the guide's size limits before input
  // ---------------------------------------------------------------------
  function limitUnit(facts, tpl) {
    const units = facts.map((k) => { const f = fieldDef(k, tpl); return f && f.unit ? f.unit : ""; });
    if (units.length === 1) return units[0];
    return units.every((u) => u && u === units[0]) ? units[0] + "²" : units.filter(Boolean).join("·");
  }

  /** "up to 120 cm", "30–100 cm", "only 55 mm", "for Bathroom (WC): only 78 mm", "Width × Height up to 60 m²" */
  function limitCore(l, tpl) {
    const unit = limitUnit(l.facts, tpl);
    const v = (x) => fmtNum(x) + (unit ? " " + unit : "");
    return l.min !== null && l.max !== null
      ? (l.min === l.max ? t("guide_eq", { value: v(l.min) }) : t("guide_range", { min: fmtNum(l.min), max: v(l.max) }))
      : l.max !== null ? t("guide_max", { value: v(l.max) }) : t("guide_min", { value: v(l.min) });
  }

  function limitText(l, tpl) {
    let txt = limitCore(l, tpl);
    if (l.facts.length > 1) txt = l.facts.map((k) => factName(k, tpl)).join(" × ") + " " + txt;
    if (l.when) {
      const wf = fieldDef(l.when.fact, tpl) || {};
      txt = t("guide_when", { cond: l.when.values.map((o) => optionLabel(wf, o)).join(", ") }) + " " + txt;
    }
    return txt;
  }

  /** Limits shown at a field: own limits, and product limits at the last of their facts. */
  function limitsForField(fact, tpl) {
    return R.guideLimits(tpl).filter((l) => l.facts.includes(fact) && (l.facts.length === 1 || l.facts[l.facts.length - 1] === fact));
  }

  /** Facts as they are on the screen right now (typed or tapped, not yet sent) – only for hints. */
  function liveFacts(live) {
    const facts = {};
    Object.entries(state.facts).forEach(([k, f]) => { facts[k] = f; });
    Object.entries(live.values).forEach(([k, get]) => {
      const v = get();
      if (v === undefined || v === null) delete facts[k];
      else facts[k] = R.makeFact(v, R.STATUS.CONFIRMED, "live");
    });
    return facts;
  }

  function showWhenMet(f, facts) {
    if (!f.show_when) return true;
    // Fail safe: a missing value hides nothing that is needed – the rule engine asks again.
    try { return R.guideLimits({ stops: [{ rule_id: "show", when: f.show_when }] }).some((l) => { const c = R.limitCheck(l, facts); return c && c.violated; }); }
    catch (_) { return false; }
  }

  /** Hints under a field: guide limits, catalogue sizes, the split option (SHELF-S1). */
  function fieldHints(f, tpl, q, live) {
    const wrap = el("div", { class: "field-hints" });
    const sg = tpl.segments;
    const splitField = !!(sg && sg.length_fact === f.fact);
    const limits = limitsForField(f.fact, tpl);
    if (limits.length && !splitField) {
      const rules = Array.from(new Set(limits.map((l) => l.rule_id))).join(", ");
      wrap.appendChild(el("p", { class: "hint", "data-guide-hint": f.fact,
        text: t("guide_hint", { limits: limits.map((l) => limitText(l, tpl)).join(" · "), rules }) }));
    }
    if (splitField) wrap.appendChild(el("p", { class: "hint", "data-split-hint": f.fact, text: segText("split_hint", { max: fmtNum(sg.max_length) + " " + (sg.unit || ""), rules: Array.from(new Set(limits.map((l) => l.rule_id))).join(", ") || sg.rule_id }) }));
    // Catalogue sizes at the first field of this screen that drives the part's size
    const qFacts = q.type === "group" ? q.fields.map((x) => x.fact) : [q.fact];
    R.catalogueSizes(tpl, state.data.catalogue).forEach((c) => {
      if (!c.sizes.length || qFacts.find((k) => c.facts.includes(k)) !== f.fact) return;
      wrap.appendChild(el("p", { class: "muted small", "data-catalogue-hint": c.role, text: t("catalogue_sizes", {
        part: pick(c.label), sizes: c.sizes.map((d) => d.map(fmtNum).join(" × ")).join(" · ") + (c.unit ? " " + c.unit : ""),
        dims: c.dims.map(pick).join(" × ") }) }));
    });
    // Live warning while typing: outside the guide → the app will stop (the rule engine decides).
    if (limits.length && !splitField) {
      const warn = el("p", { class: "warn-text", "data-guide-warn": f.fact, role: "status", hidden: true, text: t("guide_live_warn") });
      wrap.appendChild(warn);
      live.updaters.push((facts) => { warn.hidden = !limits.some((l) => { const c = R.limitCheck(l, facts); return c && c.violated; }); });
    }
    return wrap.childNodes.length ? wrap : null;
  }

  function optionLabel(f, opt) {
    if (f.option_labels && f.option_labels[opt]) return pick(f.option_labels[opt]);
    if (f.fact === "wall_type") return t("wall_" + opt);
    if (opt === R.UNKNOWN_VALUE) return t("dont_know");
    return f.unit ? opt + " " + f.unit : String(opt);
  }

  /** Field definition of a fact in the template (questions or group fields). */
  function fieldDef(key, tpl) {
    for (const q of ((tpl || state.template) || {}).questions || []) {
      if (q.type === "group") { const f = q.fields.find((x) => x.fact === key); if (f) return f; }
      else if (q.fact === key) return q;
    }
    return null;
  }

  function factName(key, tpl) {
    const f = fieldDef(key, tpl);
    return f && f.label ? pick(f.label) : t("fact_" + key);
  }

  function factLabel(key, fact, tpl) {
    if (!fact) return "–";
    const v = fact.value;
    const f = fieldDef(key, tpl);
    if (Array.isArray(v)) {
      if (!v.length) return f && f.none_label ? pick(f.none_label) : "–";
      return v.map((o) => (f ? optionLabel(f, o) : String(o))).join(", ");
    }
    if (key === "wall_type") return t("wall_" + v);
    if (key === "load_kg" && v === R.UNKNOWN_VALUE) return t("load_unknown_worst");
    if (v === R.UNKNOWN_VALUE) return t("dont_know");
    if (key === "load_kg" && String(fact.source || "").includes(":estimate:")) return v + " kg (" + t("qty_estimate") + ")";
    if (f && f.option_labels && f.option_labels[v]) return pick(f.option_labels[v]);
    const units = { load_kg: "kg", shelf_length_cm: "cm", shelf_depth_cm: "cm" };
    const unit = f && f.unit ? f.unit : units[key];
    return v + (unit ? " " + unit : "");
  }

  // Facts summary with status label and "Change" (SR-01, SR-08)
  function viewFacts() {
    const tpl = state.template;
    const box = el("section", { class: "card facts" }, [el("h2", { text: t("facts_title") })]);
    const dl = el("dl", { class: "fact-list" });
    tpl.questions.forEach((q) => {
      const keys = (q.type === "group" ? q.fields : [q]).filter((fd) => showWhenMet(fd, state.facts)).map((fd) => fd.fact);
      keys.forEach((key) => {
        const f = state.facts[key];
        dl.appendChild(el("div", { class: "fact-row" }, [
          el("dt", { text: factName(key) }),
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
    const factNames = (b.facts || []).map((k) => factName(k)).join(", ");
    // Stop rules from the project catalogue bring their own text ({limit} filled in by code).
    // A part that only fails because of its size: name the part and the catalogue sizes.
    const size = b.reason === "no_suitable_system" && b.cause && b.cause.kind === "size" ? b.cause : null;
    const own = size ? sizeText(size)
      : b.message ? pick(b.message).split("{limit}").join(b.limit_kg === null || b.limit_kg === undefined ? "–" : String(b.limit_kg)) : null;
    const mainText = own || {
      fact_unknown: t("stop_fact_unknown", { facts: factNames }),
      load_over_limit: t("stop_load_over_limit", { load: b.load_kg, limit: b.limit_kg }),
      wall_limit: t("stop_wall_limit", { load: b.load_kg, limit: b.limit_kg, wall: t("wall_" + b.wall) }),
      no_suitable_system: t("stop_no_suitable_system"),
      invalid_value: t("stop_invalid_value"),
      worst_case_over_limit: t("stop_worst_case", { kg: b.load_kg })
    }[b.reason];
    const help = size ? t("stop_no_size_help") : b.help ? pick(b.help) : {
      fact_unknown: t("stop_fact_unknown_help"),
      wall_limit: t("stop_wall_limit_help"),
      no_suitable_system: t("stop_no_suitable_system_help"),
      worst_case_over_limit: t("stop_worst_case_help")
    }[b.reason];
    box.appendChild(el("p", { class: "stop-main", text: mainText }));
    // Proposal A: name the crossed limit – value given vs. this guide's limit
    if (b.limits && b.limits.length) {
      const ul = el("ul", { class: "stop-limits", "data-stop-limits": String(b.limits.length) });
      b.limits.forEach((l) => {
        const unit = limitUnit(l.facts, state.template);
        ul.appendChild(el("li", { "data-limit-fact": l.facts.join("*"), text: t("stop_limit_line", {
          name: l.facts.map((k) => factName(k)).join(" × "), value: fmtNum(l.value) + (unit ? " " + unit : ""), limit: limitCore(l, state.template) }) }));
      });
      box.appendChild(ul);
    }
    // Proposal B (SHELF-S1): too long for one board → offer boards side by side
    const sg = state.template.segments;
    const lenFact = sg ? state.facts[sg.length_fact] : null;
    const plan = sg && lenFact && (b.limits || []).some((l) => l.facts.includes(sg.length_fact)) ? R.segmentPlan(state.template, Number(lenFact.value)) : null;
    if (plan) {
      box.appendChild(el("div", { class: "split-tip", "data-split-tip": "1" }, [
        el("p", { class: "strong", text: segText("tip", { count: plan.count, length: fmtNum(plan.length) + " " + plan.unit }) }),
        el("button", { type: "button", class: "btn primary", id: "use-split", text: segText("use", { count: plan.count }),
          onclick: () => {
            // The customer's tap is the confirmation (SR-01).
            state.facts[sg.layout_fact] = R.makeFact(sg.split_value, R.STATUS.CONFIRMED, "stop:split_tip");
            afterFactsChanged();
          } })
      ]));
    }
    if (help) box.appendChild(el("p", { text: help }));
    box.appendChild(el("p", { class: "strong", "data-handoff": b.hand_off || "default",
      text: b.hand_off ? t("handoff_" + b.hand_off) : t("stop_professional") }));
    box.appendChild(el("p", { class: "muted small", text: t("rule") + ": " + b.rule_id }));
    box.appendChild(viewEvidence(r));
    return box;
  }

  /**
   * Size stop: "you need … – our catalogue has …" in the unit of the question
   * (role.size_check), numbers formatted for the UI language.
   */
  function sizeText(size) {
    const lang = window.BBI18n.getLang();
    let part = pick(size.label);
    if (lang === "en") part = part.charAt(0).toLowerCase() + part.slice(1);
    const n = size.need;
    if (!n || !n.available.length) return t("stop_no_size", { part, sizes: size.sizes.join(" · ") });
    const num = (v) => new Intl.NumberFormat(lang === "de" ? "de-DE" : "en-GB", { maximumFractionDigits: 1 }).format(v);
    const u = n.unit ? " " + n.unit : "";
    const need = [];
    n.dims.forEach((d) => {
      const label = pick(d.label);
      if (d.eq !== null) need.push(t("size_eq", { label, value: num(d.eq) + u }));
      if (d.min !== null) need.push(t("size_min", { label, value: num(d.min) + u }));
      if (d.max !== null) need.push(t("size_max", { label, value: num(d.max) + u }));
    });
    const available = n.available.map((a) => a.map(num).join(" × ") + u).join(" · ");
    return t("stop_need_size", { part, need: need.join(", "), available });
  }

  // Shopping list (FR-06, FR-08, FR-09, FR-11, FR-30)
  function viewList(r) {
    const box = el("section", { class: "card list", "data-state": r.state });
    box.appendChild(el("h2", { text: t("list_title") + " – " + pick(state.template.title) }));
    if (state.template.safety_level) {
      box.appendChild(el("p", { class: "muted small", "data-level": state.template.safety_level,
        text: t("safety_level") + ": " + t("level_" + state.template.safety_level) }));
    }
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

    // FR-31: summary of items the chosen store cannot supply
    if (state.storeId) {
      const missing = r.items.filter((it) => it.product && !it.owned &&
        R.availability(state.data.stock, state.data.stores, state.storeId, it.product.product_nr, state.storeOrigin, CFG.store).status !== "in_stock").length;
      if (missing) box.appendChild(el("p", { class: "state-banner warn", "data-missing": String(missing), text: t("avail_summary", { n: missing }) }));
    }

    // Safety notices first (SR-05, SR-02)
    r.notices.filter((n) => n.id !== "estimates").forEach((n) => {
      box.appendChild(el("p", { class: "notice safety", "data-notice": n.id, text: noticeText(n) }));
    });

    ["materials", "tools", "safety"].forEach((section) => {
      const items = r.items.filter((i) => i.section === section);
      if (!items.length) return;
      box.appendChild(el("h3", { text: t("section_" + section) }));
      const ul = el("ul", { class: "items" });
      items.forEach((i) => ul.appendChild(viewItem(i)));
      box.appendChild(ul);
      // FR-34 (D-3): subtotal per section; owned parts are not counted
      const st = r.subtotals && r.subtotals[section];
      if (st) {
        box.appendChild(el("p", { class: "subtotal", "data-subtotal": section, "data-amount": st.amount === null ? "none" : String(st.amount) },
          st.amount !== null
            ? [el("span", { class: "subtotal-label", text: t("subtotal", { section: t("section_" + section) }) }), priceEl(st.amount, "subtotal-value")]
            : [el("span", { class: "muted", text: t("subtotal_none", { section: t("section_" + section) }) })]));
      }
    });

    // Total only when every pack size and price is clear (RB-13)
    box.appendChild(el("p", { class: "total", "data-total": r.total.amount === null ? "none" : String(r.total.amount) },
      r.total.amount !== null
        ? [el("span", { class: "total-label", text: t("total") }), priceEl(r.total.amount, "total-value")]
        : [el("span", { text: t("total_" + r.total.reason) })]));
    box.appendChild(el("p", { class: "notice", text: t("notice_estimates") }));
    // Shopping by aisle: the same list, sorted for the walk through the store
    box.appendChild(el("button", { type: "button", class: "btn brand block", id: "start-shopping", text: t("shopping_start"), onclick: () => go("shopping") }));
    box.appendChild(viewSave(r));
    const howto = viewHowto(state.template);
    if (howto) box.appendChild(howto);
    // NFR-05: how this list was made and the template version (review status not shown – user request 3 Nov 2026)
    box.appendChild(el("p", { class: "transparency", "data-transparency": "list" }, [
      el("span", { text: t("list_transparency") + " " }),
      el("span", { text: t("list_template_status", { version: r.template_version }) })
    ]));
    box.appendChild(viewEvidence(r));
    return box;
  }

  /** "I already have this" (C-8). Plugs and screws are never ownable (SR-15); rules.js decides. */
  function ownedButton(i) {
    if (!i.ownable || i.owned_auto) return null;
    return el("button", { type: "button", class: "btn small owned-toggle", "data-owned": i.owned ? "yes" : "no",
      text: i.owned ? t("owned_need") : t("owned_have"),
      onclick: () => { if (i.owned) state.owned.delete(i.role); else state.owned.add(i.role); recompute(); } });
  }

  function viewItem(i) {
    const p = i.product;
    const li = el("li", { class: "item status-" + i.status + (i.owned ? " owned" : ""), "data-role": i.role, "data-product": p ? p.product_nr : "" });
    if (i.owned) {
      // Customer's own part: not counted, no store data; load-bearing parts get the check note (SR-15).
      li.appendChild(el("p", { class: "item-name" }, [
        el("span", { text: p ? productName(p) : pick(i.label) }),
        el("span", { class: "tag owned", text: t("owned_tag") })
      ]));
      if (i.load_bearing) {
        li.appendChild(el("p", { class: "warn-text", "data-owned-check": "1",
          text: i.required_rating_kg !== null ? t("owned_check_rating", { kg: i.required_rating_kg }) : t("owned_check_condition") }));
      }
      // SR-17 (D-3): own tools and safety gear
      if (i.section === "tools" || i.section === "safety") {
        li.appendChild(el("p", { class: "hint", "data-owned-gear-hint": "1", text: t("owned_gear_hint") }));
      }
      const b = ownedButton(i);
      if (b) li.appendChild(b);
      return li;
    }
    if (!p) {
      li.appendChild(el("p", { class: "item-name", text: pick(i.label) }));
      li.appendChild(el("p", { class: "warn-text", text: t("unresolved_item") }));
      li.appendChild(el("p", { class: "muted small", text: t("rule") + ": " + i.rule_ids.join(", ") }));
      const b = ownedButton(i);
      if (b) li.appendChild(b);
      return li;
    }
    // D-3 (29 Oct 2026): no tick box any more – only "I already have this" (FR-07).
    li.appendChild(el("p", { class: "item-name" }, [
      el("span", { text: productName(p) }), el("span", { class: "muted", text: " · " + p.size })
    ]));

    const q = i.quantity;
    const qtyText = qtyLabel(q);
    li.appendChild(el("p", { class: "qty" }, [
      el("span", { class: "tag estimate", text: t("qty_estimate") }),
      el("span", { text: " " + qtyText + " · " }),
      el("span", { class: "muted small", text: t("rule") + " " + q.rule_id + " / " + i.rule_ids.join(", ") })
    ]));

    li.appendChild(el("div", { class: "price" }, [
      p.price_eur !== null ? priceEl(p.price_eur) : el("span", { class: "muted", text: t("price_unknown") }),
      el("span", { class: "price-unit muted", text: p.price_eur !== null ? " " + t("per_pack") : "" }),
      el("span", { class: "tag sample", text: t("sample_note") }),
      i.line_price !== null ? el("span", { class: "line-price muted", text: t("line_total", { price: window.BBI18n.formatPrice(i.line_price) }) }) : null
    ]));

    // Store data ONLY for the selected store (RB-06, RB-15, FR-30)
    const s = R.storeInfo(state.data.stock, state.storeId, p.product_nr);
    const na = t("not_available");
    const avail = s.stock_qty === null ? "unknown" : s.stock_qty > 0 ? "in" : "out";
    const av = R.availability(state.data.stock, state.data.stores, state.storeId, p.product_nr, state.storeOrigin, CFG.store);
    li.setAttribute("data-availability", av.status);
    li.appendChild(el("p", { class: "store-info", "data-aisle": s.aisle_nr === null ? "none" : String(s.aisle_nr), "data-avail": avail }, [
      el("span", { class: "dot " + avail, "aria-hidden": "true" }),
      el("span", { text: t("stock") + ": " + (s.stock_qty === null ? na : s.stock_qty) + " · " }),
      el("span", { text: t("aisle") + ": " + (s.aisle_nr === null ? na : s.aisle_nr + (s.aisle_name ? " (" + s.aisle_name + ")" : "")) + " · " }),
      el("span", { text: t("shelf") + ": " + (s.shelf_nr === null ? na : s.shelf_nr) })
    ]));

    // FR-31 / RB-21: not available here → stays on the list, marked, with referral or "ask staff"
    if (av.status === "out_of_stock" || av.status === "not_carried") {
      const here = state.data.stores.find((x) => x.store_id === state.storeId);
      const box = el("div", { class: "referral", role: "note", "data-referral": av.referral ? av.referral.store.store_id : "ask_staff" }, [
        el("p", { class: "referral-here", text: t(av.status === "out_of_stock" ? "avail_out_here" : "avail_not_carried_here", { store: here ? here.name : "" }) })
      ]);
      box.appendChild(av.referral
        ? el("p", { class: "referral-there" }, [
          el("span", { text: t("avail_referral", { store: av.referral.store.name, km: formatKm(av.referral.km) }) }),
          el("span", { class: "tag sample", text: t("sample_note") })
        ])
        : el("p", { class: "referral-there", text: t("avail_ask_staff") }));
      li.appendChild(box);
    }

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

    if (i.owned_refused) li.appendChild(el("p", { class: "warn-text", role: "note", "data-owned-refused": "1", text: t("owned_refused") }));
    const ob = ownedButton(i);
    if (ob && !i.owned_refused) li.appendChild(ob);

    // Product variant change → full re-check (SR-08, RB-03)
    const variants = R.variantOptions(state.template, i.role, state.data.catalogue);
    if (variants.length > 1) {
      const sel = el("select", { class: "input variant", "aria-label": t("change_variant") + " – " + pick(i.label),
        onchange: (e) => { state.overrides[i.role] = e.target.value; recompute(); } });
      variants.forEach((v) => {
        const o = el("option", { value: v.product_nr, text: productName(v) + " · " + v.size + " (" + v.product_nr + ")" });
        if (v.product_nr === p.product_nr) o.selected = true;
        sel.appendChild(o);
      });
      li.appendChild(el("label", { class: "variant-label" }, [el("span", { class: "muted small", text: t("change_variant") + " " }), sel]));
    }
    return li;
  }

  /**
   * How-to links from the project catalogue (sheet "How-to links"). Only links,
   * never copied content; https and an allow-listed host are checked in code (NFR-07).
   */
  function safeHowtoUrl(raw) {
    try {
      const u = new URL(String(raw));
      if (u.protocol !== "https:" || !(CFG.data.howtoHosts || []).includes(u.hostname)) return null;
      // English mode: ask YouTube for English subtitles (catalogue fallback, S-05).
      if (window.BBI18n.getLang() === "en" && u.hostname === "www.youtube.com") {
        u.searchParams.set("hl", "en"); u.searchParams.set("cc_load_policy", "1"); u.searchParams.set("cc_lang_pref", "en");
      }
      return u.toString();
    } catch (_) { return null; }
  }

  function viewHowto(tpl) {
    const links = ((tpl && tpl.howto) || []).map((h) => Object.assign({}, h, { safe: safeHowtoUrl(h.url) })).filter((h) => h.safe);
    if (!links.length) return null;
    const box = el("div", { class: "howto", "data-howto": String(links.length) }, [el("h3", { text: t("howto_title") })]);
    const ul = el("ul", { class: "howto-list" });
    links.forEach((h) => {
      const german = h.lang === "de" && window.BBI18n.getLang() !== "de";
      ul.appendChild(el("li", {}, [
        el("span", { class: "tag", text: t(h.type === "video" ? "howto_video" : "howto_article") }),
        el("a", { href: h.safe, target: "_blank", rel: "noopener noreferrer", referrerpolicy: "no-referrer", text: pick(h.title) }),
        el("span", { class: "muted small", text: " · " + (h.publisher || "") }),
        german ? el("p", { class: "muted small", text: t(h.type === "video" ? "howto_german_video" : "howto_german_article") }) : null
      ]));
    });
    box.appendChild(ul);
    box.appendChild(el("p", { class: "muted small", text: t("howto_note") }));
    return box;
  }

  // ---------------------------------------------------------------------
  // FR-17 / DR-06 (D-1): save the list as a file on the device
  // ---------------------------------------------------------------------
  /**
   * Plain text of the complete list, in the UI language: products, quantities,
   * prices, section subtotals and total, items marked "I already have this",
   * aisle/shelf/stock of the chosen store, product warnings, safety notes and
   * how-to links. The customer's PLZ is never included (the store address is
   * written without its postcode). Built on the device – nothing is sent.
   */
  function buildListText(r) {
    const fmt = (n) => window.BBI18n.formatPrice(n);
    const tpl = state.template;
    const store = state.storeId ? state.data.stores.find((x) => x.store_id === state.storeId) : null;
    const L = [];
    L.push("Baumarkt-Buddy – " + pick(tpl.title));
    L.push(new Date().toISOString().slice(0, 10) + " · " + t("save_sample_note"));
    L.push(store ? t("store_selected") + ": " + store.name + (store.street ? ", " + store.street : "") + (store.city ? ", " + store.city : "")
      : t("save_no_store"));
    L.push("");
    L.push(t("facts_title") + ":");
    tpl.questions.forEach((q) => (q.type === "group" ? q.fields.map((f) => f.fact) : [q.fact]).forEach((k) => {
      if (state.facts[k]) L.push("- " + factName(k, tpl) + ": " + factLabel(k, state.facts[k], tpl));
    }));
    ["materials", "tools", "safety"].forEach((section) => {
      const items = r.items.filter((i) => i.section === section);
      if (!items.length) return;
      L.push("");
      L.push("== " + t("section_" + section) + " ==");
      items.forEach((i) => {
        const p = i.product;
        if (!p) { L.push("- " + pick(i.label) + " – " + t("unresolved_item")); return; }
        let line = "- " + productName(p) + " · " + p.size + " (" + p.product_nr + ")";
        if (i.owned) {
          line += " – " + t("owned_tag") + " (" + t("save_not_counted") + ")";
          L.push(line);
          if (i.section === "tools" || i.section === "safety") L.push("  " + t("owned_gear_hint"));
          return;
        }
        const q = i.quantity;
        line += " – " + (q.clear ? t("qty_packs", { packs: q.packs }) + (q.pack_qty > 1 ? " (" + t("qty_need", { units: q.units }) + ")" : "") : t("qty_unclear"));
        line += " – " + (p.price_eur !== null ? fmt(p.price_eur) + " " + t("per_pack") : t("price_unknown"));
        if (i.line_price !== null) line += " – " + t("line_total", { price: fmt(i.line_price) });
        L.push(line);
        const si = R.storeInfo(state.data.stock, state.storeId, p.product_nr);
        const na = t("not_available");
        L.push("  " + t("aisle") + ": " + (si.aisle_nr === null ? na : si.aisle_nr + (si.aisle_name ? " (" + si.aisle_name + ")" : "")) +
          " · " + t("shelf") + ": " + (si.shelf_nr === null ? na : si.shelf_nr) + " · " + t("stock") + ": " + (si.stock_qty === null ? na : si.stock_qty));
        const av = R.availability(state.data.stock, state.data.stores, state.storeId, p.product_nr, state.storeOrigin, CFG.store);
        if (av.status === "out_of_stock" || av.status === "not_carried") {
          L.push("  " + (av.referral ? t("avail_referral", { store: av.referral.store.name, km: formatKm(av.referral.km) }) : t("avail_ask_staff")));
        }
        if (i.safety_note) L.push("  " + t("manufacturer_note") + ": " + i.safety_note); // SR-07: unchanged
      });
      const st = r.subtotals && r.subtotals[section];
      if (st) L.push(st.amount !== null ? t("subtotal", { section: t("section_" + section) }) + ": " + fmt(st.amount) : t("subtotal_none", { section: t("section_" + section) }));
    });
    L.push("");
    L.push(r.total.amount !== null ? t("total") + ": " + fmt(r.total.amount) : t("total_" + r.total.reason));
    const notes = r.notices.filter((n) => n.id !== "estimates").map((n) => (noticeText(n)));
    if (notes.length) { L.push(""); L.push(t("save_safety_title") + ":"); notes.forEach((n) => L.push("- " + n)); }
    const links = ((tpl && tpl.howto) || []).map((h) => ({ h, url: safeHowtoUrl(h.url) })).filter((x) => x.url);
    if (links.length) { L.push(""); L.push(t("howto_title") + ":"); links.forEach((x) => L.push("- " + pick(x.h.title) + ": " + x.url)); }
    L.push("");
    L.push(t("notice_estimates"));
    L.push(t("footer"));
    return L.join("\n") + "\n";
  }

  function saveFileName() {
    return "baumarkt-buddy_" + state.template.template_id + "_" + new Date().toISOString().slice(0, 10) + ".txt";
  }

  /** Download the list as a .txt file (no network, DR-06). */
  function saveList(r) {
    const blob = new Blob([buildListText(r)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = el("a", { href: url, download: saveFileName() });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  }

  /**
   * Shopping by aisle: groups the list items of the chosen store by aisle
   * (ascending), within an aisle by shelf. Owned items are left out; items the
   * store cannot supply and unresolved items go to "not on the route" with the
   * FR-31 referral. Only reorders the checked list – no new decision (RB-17).
   */
  function aisleRoute(r) {
    const aisles = new Map();
    const off = [];
    let owned = 0;
    r.items.forEach((i) => {
      if (i.owned) { owned++; return; }
      if (!i.product || !state.storeId) { off.push({ item: i, av: null }); return; }
      const av = R.availability(state.data.stock, state.data.stores, state.storeId, i.product.product_nr, state.storeOrigin, CFG.store);
      if (av.status !== "in_stock") { off.push({ item: i, av }); return; }
      const s = R.storeInfo(state.data.stock, state.storeId, i.product.product_nr);
      if (!aisles.has(s.aisle_nr)) aisles.set(s.aisle_nr, { aisle_nr: s.aisle_nr, aisle_name: s.aisle_name, stops: [] });
      aisles.get(s.aisle_nr).stops.push({ item: i, shelf_nr: s.shelf_nr });
    });
    const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : Infinity);
    const groups = [...aisles.values()].sort((a, b) => num(a.aisle_nr) - num(b.aisle_nr) || String(a.aisle_nr).localeCompare(String(b.aisle_nr)));
    groups.forEach((g) => g.stops.sort((a, b) => num(a.shelf_nr) - num(b.shelf_nr) || a.item.product.product_nr.localeCompare(b.item.product.product_nr)));
    return { groups, off, owned };
  }

  function qtyLabel(q) {
    return q.clear
      ? t("qty_packs", { packs: q.packs }) + (q.pack_qty > 1 ? " (" + t("qty_need", { units: q.units }) + ")" : "")
      : t("qty_unclear");
  }

  function viewShopping() {
    const r = state.result;
    const wrap = el("div", { class: "result" });
    const box = el("section", { class: "card shopping", "data-shopping": state.storeId || "none" });
    box.appendChild(el("h2", { text: t("shopping_title") + " – " + pick(state.template.title) }));
    const store = state.storeId ? state.data.stores.find((x) => x.store_id === state.storeId) : null;
    if (!store) {
      box.appendChild(el("p", { class: "hint", "data-shopping-nostore": "1", text: t("shopping_no_store") }));
      box.appendChild(el("button", { type: "button", class: "btn primary block", id: "shopping-add-plz", text: t("store_add_plz"), onclick: () => openStoreSearch("shopping") }));
    } else {
      box.appendChild(el("div", { class: "store-bar", "data-store-bar": store.store_id }, [
        el("span", { text: t("store_selected") + ": " }), el("strong", { text: store.name + " (" + store.city + ")" }),
        el("span", { class: "tag sample", text: t("sample_note") }),
        el("button", { class: "btn small", text: t("store_change"), onclick: () => openStoreSearch("shopping") })
      ]));
      const route = aisleRoute(r);
      box.appendChild(el("p", { class: "muted small", text: t("shopping_intro") }));
      const ol = el("ol", { class: "route" });
      route.groups.forEach((g, n) => {
        const li = el("li", { class: "route-aisle", "data-route-aisle": String(g.aisle_nr) }, [
          el("h3", {}, [el("span", { class: "route-no", "aria-hidden": "true", text: String(n + 1) }),
            el("span", { text: t("aisle") + " " + g.aisle_nr + (g.aisle_name ? " – " + g.aisle_name : "") })])
        ]);
        const ul = el("ul", { class: "items" });
        g.stops.forEach((st) => {
          const p = st.item.product;
          ul.appendChild(el("li", { class: "item route-stop", "data-role": st.item.role, "data-product": p.product_nr, "data-shelf": String(st.shelf_nr) }, [
            el("p", { class: "item-name" }, [el("span", { text: productName(p) }), el("span", { class: "muted", text: " · " + p.size })]),
            el("p", {}, [el("strong", { text: t("shelf") + " " + (st.shelf_nr === null ? t("not_available") : st.shelf_nr) }),
              el("span", { text: " · " + qtyLabel(st.item.quantity) + " " }), el("span", { class: "tag estimate", text: t("qty_estimate") })])
          ]));
        });
        li.appendChild(ul);
        ol.appendChild(li);
      });
      if (route.groups.length) box.appendChild(ol);
      else box.appendChild(el("p", { class: "hint", text: t("shopping_nothing_here") }));
      if (route.off.length) {
        box.appendChild(el("h3", { text: t("shopping_off_title") }));
        const ul = el("ul", { class: "items", "data-route-off": String(route.off.length) });
        route.off.forEach(({ item, av }) => {
          const p = item.product;
          const li = el("li", { class: "item", "data-role": item.role, "data-product": p ? p.product_nr : "" }, [
            el("p", { class: "item-name", text: p ? productName(p) + " · " + p.size : pick(item.label) })
          ]);
          if (!p) li.appendChild(el("p", { class: "warn-text", text: t("unresolved_item") }));
          else if (av && av.referral) li.appendChild(el("p", { class: "referral-there", text: t("avail_referral", { store: av.referral.store.name, km: formatKm(av.referral.km) }) }));
          else li.appendChild(el("p", { class: "referral-there", text: t("avail_ask_staff") }));
          ul.appendChild(li);
        });
        box.appendChild(ul);
      }
      if (route.owned) box.appendChild(el("p", { class: "muted small", "data-route-owned": String(route.owned), text: t("shopping_owned", { n: route.owned }) }));
    }
    // Safety notices stay visible while shopping (SR-05)
    r.notices.filter((n) => n.id !== "estimates").forEach((n) => {
      box.appendChild(el("p", { class: "notice safety", "data-notice": n.id, text: noticeText(n) }));
    });
    wrap.appendChild(box);
    wrap.appendChild(el("div", { class: "actions" }, [
      el("button", { type: "button", class: "btn", id: "back-to-list", text: t("shopping_back"), onclick: () => go("result") })
    ]));
    return wrap;
  }

  /** Share the same file via the phone's share sheet, where the browser supports it. */
  async function shareList(r) {
    const file = new File([buildListText(r)], saveFileName(), { type: "text/plain" });
    try { await navigator.share({ files: [file], title: "Baumarkt-Buddy – " + pick(state.template.title) }); } catch (_) { /* cancelled */ }
  }

  function viewSave(r) {
    let canShare = false;
    try { canShare = !!(navigator.canShare && navigator.canShare({ files: [new File(["x"], "x.txt", { type: "text/plain" })] })); } catch (_) { canShare = false; }
    return el("div", { class: "save-box", "data-save": "1" }, [
      el("div", { class: "actions" }, [
        el("button", { type: "button", class: "btn primary", id: "save-list", text: t("save_list"), onclick: () => saveList(r) }),
        canShare ? el("button", { type: "button", class: "btn", id: "share-list", text: t("share_list"), onclick: () => shareList(r) }) : null
      ]),
      el("p", { class: "muted small", text: t("save_privacy") })
    ]);
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
  // Browser back / back swipe (issue #101, 3 Nov 2026)
  // A: every real step gets a history entry, so "back" goes one step back inside
  //    the app. The entry holds only the screen and question id – no answers, no
  //    postcode (NFR-04); answers stay in memory as before.
  // B: one guard entry before the first step. Reaching it while a list exists
  //    asks "Leave your list?" instead of closing the app.
  // ---------------------------------------------------------------------
  const STEP_SCREENS = ["choose", "recognized", "high_risk", "store", "question", "result", "shopping"];
  const nav = {
    enabled: false, pos: 0, keys: [], restoring: false,
    go: (n) => window.history.go(n),       // replaceable in tests.html
    back: () => window.history.back(),
    forward: () => window.history.forward()
  };

  function navEntry() {
    const q = state.screen === "question";
    return { bb: "step", idx: nav.pos, screen: state.screen, questionId: q ? state.questionId : null, editOnly: q && !!state.editOnly };
  }
  const navKeyOf = (e) => e.screen + (e.questionId ? ":" + e.questionId : "") + (e.editOnly ? ":edit" : "");

  function initHistory() {
    nav.enabled = true;
    nav.pos = 0;
    nav.keys = ["guard"];
    window.history.replaceState({ bb: "guard", idx: 0 }, "");
    window.removeEventListener("popstate", onPopState);
    window.addEventListener("popstate", onPopState);
  }

  function disableHistory() {
    nav.enabled = false;
    window.removeEventListener("popstate", onPopState);
  }

  /** Called on every render: adds an entry only when the step changes (not for re-renders). */
  function syncHistory() {
    if (!nav.enabled || state.leaveAsk || !STEP_SCREENS.includes(state.screen)) return;
    const entry = navEntry();
    const key = navKeyOf(entry);
    if (nav.restoring) { window.history.replaceState(entry, ""); nav.keys[nav.pos] = key; return; }
    if (nav.keys[nav.pos] === key) return;
    // Leaving the store search: back must not return to it (replace, or step back if it is the same screen as before).
    if (nav.pos > 0 && nav.keys[nav.pos] === "store") {
      if (nav.keys[nav.pos - 1] === key) { nav.back(); return; }
      window.history.replaceState(entry, "");
      nav.keys[nav.pos] = key;
      return;
    }
    nav.pos += 1;
    entry.idx = nav.pos;
    window.history.pushState(entry, "");
    nav.keys.length = nav.pos;
    nav.keys[nav.pos] = key;
  }

  /** A list the customer could lose (not a stop screen). */
  function hasList() {
    return !!(state.template && state.result && state.result.state !== "safety_blocked" && state.result.method);
  }

  function onPopState(e) {
    const st = e.state;
    if (!st || !st.bb) return; // not one of ours
    nav.pos = st.idx;
    if (st.bb === "guard") {
      if (nav.leaving || !hasList()) { nav.leaving = false; nav.back(); return; } // nothing to lose → leave as usual
      state.leaveAsk = true;
      nav.forward(); // stay on the first step; the question is shown there
      return;
    }
    restoreStep(st);
  }

  /** Shows a step again. Results are never taken from history: the current answers are re-checked (SR-08). */
  function restoreStep(st) {
    nav.restoring = true;
    try {
      stopRecognizer(true);
      let sc = st.screen;
      const needsProject = ["question", "result", "shopping"].includes(sc);
      if (!state.data || (needsProject && !state.template)) sc = state.data ? "choose" : "start";
      if (sc === "recognized" && !state.recognized) sc = "choose";
      if (sc === "question") {
        const q = state.template.questions.find((x) => x.id === st.questionId);
        if (!q) { recompute(true); return; }
        state.questionId = q.id;
        state.editOnly = !!st.editOnly;
      }
      if (sc === "result" || sc === "shopping") {
        recompute(true); // a missing answer leads to its question, a stop to the stop screen
        if (sc === "shopping" && state.screen === "result" && state.result.state !== "safety_blocked") { state.screen = "shopping"; render(); }
        return;
      }
      if (sc === "store") { state.storeSearch = null; state.plzInput = ""; }
      state.screen = sc;
      render();
    } finally {
      nav.restoring = false;
    }
  }

  function viewLeave() {
    const box = el("section", { class: "card leave", role: "alertdialog", "aria-labelledby": "leave-title", "data-leave": "1" }, [
      el("h2", { id: "leave-title", text: t("leave_title") }),
      el("p", { text: t("leave_text") })
    ]);
    box.appendChild(el("div", { class: "actions" }, [
      el("button", { type: "button", class: "btn primary", id: "leave-save", text: t("save_list"), onclick: () => saveList(state.result) }),
      el("button", { type: "button", class: "btn", id: "leave-stay", text: t("leave_stay"), onclick: () => { state.leaveAsk = false; go("result"); } }),
      el("button", { type: "button", class: "btn", id: "leave-go", text: t("leave_go"), onclick: leaveApp })
    ]));
    return box;
  }

  function leaveApp() {
    state.leaveAsk = false;
    nav.leaving = true;
    nav.go(-(nav.pos + 1)); // past the guard to the page before the app
    // Opened directly (no page before): the browser cannot close the tab – start again instead.
    setTimeout(() => {
      if (document.visibilityState === "hidden") return;
      nav.leaving = false;
      resetProject();
    }, 600);
  }

  // ---------------------------------------------------------------------
  // Flow control (orchestrator)
  // ---------------------------------------------------------------------
  function go(screen) {
    state.leaveAsk = false;
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
    state.owned = new Set();
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
    const r = R.evaluate(state.template, state.facts, state.data.catalogue, state.data.safetyRules,
      { overrides: state.overrides, owned: Array.from(state.owned) });
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
    // FR-31: keep only the PLZ centre (not the PLZ) as origin for referral distances.
    const check = R.checkPlz(input, state.data.plzTable);
    state.storeOrigin = check.valid ? check.point : null;
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
    go(["result", "shopping"].includes(state.storeReturn) && state.result ? state.storeReturn : "choose");
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
    // NFR-05: in keyword mode, show which misspelled words were corrected ("Regla" → "Regal").
    let corrections = [];
    if (res.source === "template") {
      window.BBAI.templateUnderstand(clean, state.data.lexicon, templates.map((x) => x.template_id), corrections);
      const seen = new Set();
      corrections = corrections.filter((c) => !seen.has(c.typed + "|" + c.understood) && seen.add(c.typed + "|" + c.understood));
    }
    state.recognized = { template: tpl, facts: guessesFor(tpl, out.facts, source), corrections };
    go("recognized");
    return state.screen;
  }

  function resetProject() {
    state.inputText = ""; state.chooseNotice = null; state.pendingGuesses = {}; state.recognized = null;
    state.template = null; state.facts = {}; state.overrides = {}; state.owned = new Set(); state.checked = new Set(); state.result = null;
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
    renderHeader, viewLeave, initHistory, disableHistory, nav, go, viewStore, viewList, viewShopping, aisleRoute, viewProgress, progressStep, openStoreSearch, searchStores, chooseStore, leaveStoreSearch, buildListText, saveList
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
    initHistory(); // issue #101: browser back stays inside the app
    boot();
  });
})();
