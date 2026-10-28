/*
 * Baumarkt-Buddy – AI adapter (AI layer: UNDERSTANDING ONLY).
 *
 * The adapter may only (a) classify the project intent and (b) extract
 * candidate values (FR-03, FR-27, DR-05). It never chooses products,
 * quantities or safety outcomes – that is rules.js (architecture point 3).
 *
 * Three exchangeable modes (config.js → aiMode):
 *   "template" – default, no AI: keyword matching with data/understanding-lexicon.json
 *   "proxy"    – commercial model behind a serverless proxy (proxy/), API key server-side (NFR-06)
 *   "mock"     – fixed answers for automated tests (data/ai-mock-responses.json)
 *
 * Every answer – from every mode – goes through validateOutput() against one
 * fixed schema. Invalid answers are discarded (DR-05); the app then offers the
 * project templates and keeps what the customer already typed (NFR-03).
 *
 * NFR-07: user text is data. It is sent as a JSON string value, never mixed
 * into instructions; no catalogue text is ever sent. The PLZ is never sent
 * (it is not part of the request) and 5-digit numbers are redacted (NFR-04).
 */
(function (root) {
  "use strict";

  // -------------------------------------------------------------------
  // Output schema (DR-05) – the only shape any mode may return
  // -------------------------------------------------------------------
  const FACT_RULES = Object.freeze({
    wall_type: { type: "enum", values: ["concrete", "solid_brick", "brick", "plasterboard", "aerated_concrete"] },
    load_kg: { type: "number", min: 0.01, max: 1000 },
    shelf_length_cm: { type: "number", min: 1, max: 1000 },
    shelf_depth_cm: { type: "number", min: 1, max: 200 },
    picture_count: { type: "integer", min: 1, max: 50 },
    points_per_picture: { type: "integer", min: 1, max: 10 }
  });
  const FACT_NAMES = Object.freeze(Object.keys(FACT_RULES));
  const NON_TEMPLATE_INTENTS = Object.freeze(["unsupported", "unclear"]);

  /**
   * Strict validation in code. Anything unexpected → the whole answer is
   * rejected (no partial use of a doubtful answer).
   * @returns {ok:true, output} | {ok:false, errors:[...]}
   */
  function validateOutput(obj, templateIds) {
    const errors = [];
    const isObj = (o) => o !== null && typeof o === "object" && !Array.isArray(o);
    if (!isObj(obj)) return { ok: false, errors: ["not an object"] };
    const keys = Object.keys(obj).sort();
    if (JSON.stringify(keys) !== JSON.stringify(["facts", "high_risk", "intent"])) {
      errors.push("unexpected keys: " + keys.join(","));
    }
    const intents = templateIds.concat(NON_TEMPLATE_INTENTS);
    if (!intents.includes(obj.intent)) errors.push("invalid intent: " + String(obj.intent));
    if (typeof obj.high_risk !== "boolean") errors.push("high_risk must be boolean");
    if (!isObj(obj.facts)) errors.push("facts must be an object");
    else {
      const fk = Object.keys(obj.facts).sort();
      if (JSON.stringify(fk) !== JSON.stringify(FACT_NAMES.slice().sort())) errors.push("unexpected fact keys: " + fk.join(","));
      FACT_NAMES.forEach((name) => {
        const v = obj.facts[name];
        if (v === null || v === undefined) return;
        const r = FACT_RULES[name];
        if (r.type === "enum" && !r.values.includes(v)) errors.push(name + " invalid: " + String(v));
        if (r.type !== "enum") {
          const okNum = typeof v === "number" && Number.isFinite(v) && v >= r.min && v <= r.max;
          if (!okNum || (r.type === "integer" && !Number.isInteger(v))) errors.push(name + " out of range: " + String(v));
        }
      });
    }
    if (errors.length) return { ok: false, errors };
    const facts = {};
    FACT_NAMES.forEach((n) => { facts[n] = obj.facts[n] === undefined ? null : obj.facts[n]; });
    return { ok: true, output: Object.freeze({ intent: obj.intent, high_risk: obj.high_risk, facts: Object.freeze(facts) }) };
  }

  /** NFR-04: remove postcodes, e-mail addresses and phone numbers before sending text anywhere. */
  function redact(text) {
    return String(text)
      .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[removed]")
      .replace(/\+?\d[\d\s/().-]{7,}\d/g, "[removed]")
      .replace(/\b\d{5}\b/g, "[removed]");
  }

  // -------------------------------------------------------------------
  // Mode "template": deterministic keyword matching (no AI)
  // -------------------------------------------------------------------
  function normalise(text) {
    return String(text == null ? "" : text)
      .normalize("NFKC")
      .toLowerCase()
      .replace(/(\d),(\d)/g, "$1.$2")             // 2,5 kg → 2.5 kg
      .replace(/(\d)([a-zäöüß]+)/g, "$1 $2")      // 12kg → 12 kg
      .replace(/(\d)\s*[x×*]\s*(\d)/g, "$1 x $2") // 80x25 → 80 x 25
      .replace(/[^\p{L}\p{N}.\s]+/gu, " ")
      .replace(/(?<!\d)\.|\.(?!\d)/g, " ")
      .split(/\s+/)
      .filter(Boolean);
  }

  const ARTICLES = new Set(["a", "an", "ein", "eine", "einen", "einem"]);

  /** Converts number words (EN/DE, incl. "fünfundzwanzig", "twenty five") into numbers. */
  function wordsToNumbers(tokens, lex) {
    const words = Object.assign({}, lex.number_words.en, lex.number_words.de);
    const unitWords = new Set([].concat(...Object.values(lex.units)));
    const countWords = new Set([].concat(...Object.values(lex.count_words).map((g) => [].concat(g.en, g.de))));
    const deUnits = { ein: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9 };
    const out = [];
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      const m = tok.match(/^(ein|zwei|drei|vier|fünf|sechs|sieben|acht|neun)und(zwanzig|dreißig|vierzig|fünfzig|sechzig|siebzig|achtzig|neunzig)$/);
      if (m) { out.push(deUnits[m[1]] + lex.number_words.de[m[2]]); continue; }
      if (ARTICLES.has(tok)) {
        // "a"/"ein" only count as 1 directly before a unit or count word
        const next = tokens[i + 1];
        out.push(next && (unitWords.has(next) || countWords.has(next)) ? 1 : tok);
        continue;
      }
      if (tok in words && typeof words[tok] === "number") {
        let n = words[tok];
        const next = tokens[i + 1];
        if (next === "hundred" || next === "hundert") { n *= 100; i++; }
        else if (n >= 20 && n % 10 === 0 && n < 100 && next in words && words[next] > 0 && words[next] < 10 && !ARTICLES.has(next)) { n += words[next]; i++; }
        out.push(n);
        continue;
      }
      if (/^\d+(\.\d+)?$/.test(tok)) { out.push(Number(tok)); continue; }
      out.push(tok);
    }
    return out;
  }

  function unitOf(tok, lex) {
    if (typeof tok !== "string") return null;
    return Object.keys(lex.units).find((u) => lex.units[u].includes(tok)) || null;
  }

  /** Exact match of a word or phrase from the list. */
  function hasAny(tokens, list) {
    const text = " " + tokens.filter((t) => typeof t === "string").join(" ") + " ";
    return (list || []).some((w) => text.includes(" " + w.toLowerCase() + " "));
  }

  /**
   * Tolerant match for project and wall keywords – only a GUESS that the
   * customer confirms on the next screens (SR-01):
   *  - word forms and compounds: "regale", "regals", "eckregal", "regalbretter"
   *    (single keywords of 5+ letters at the start or end of a word)
   *  - spelling mistakes: "regla", "reagl", "regall", "gipskarten" (BBRules.typoMatch)
   */
  function hasLike(tokens, list, exceptions, corrections) {
    if (hasAny(tokens, list)) return true;
    const all = tokens.filter((t) => typeof t === "string");
    const words = all.filter((t) => t.length >= 4);
    const R = root.BBRules;
    const notTypos = new Set(exceptions || []);
    return (list || []).some((kw) => {
      const k = kw.toLowerCase();
      // Phrases with a spelling mistake ("gipskarton wnad"), word by word
      if (k.includes(" ")) {
        const typed = R && R.phraseTypoMatch(all, k);
        if (typed && corrections) corrections.push({ typed, understood: k });
        return !!typed;
      }
      if (k.length < 5) return false;
      if (words.some((w) => w.startsWith(k) || w.endsWith(k))) return true; // word forms, compounds
      const typed = R && words.find((w) => !notTypos.has(w) && R.typoMatch(w, k));
      if (typed && corrections) corrections.push({ typed, understood: k });
      return !!typed;
    });
  }

  function langLists(group) { return [].concat(group.en || [], group.de || []); }

  /** Template mode: returns an object in the schema above (still validated afterwards). */
  /**
   * @param corrections optional array – receives {typed, understood} for every
   *        spelling mistake that was tolerated (shown as "understood as" on the
   *        recognised screen, NFR-05). Not part of the validated output.
   */
  function templateUnderstand(text, lex, templateIds, corrections) {
    const raw = normalise(text);
    const tokens = wordsToNumbers(raw, lex);
    const notTypos = ((lex.typo_exceptions || {}).words || []).map((w) => w.toLowerCase());
    const facts = {};
    FACT_NAMES.forEach((n) => { facts[n] = null; });

    // Intent
    // Exact keywords first; only if none matches, word forms and spelling
    // mistakes are tried. Two or more possible projects → "unclear" (buttons).
    let hits = templateIds.filter((id) => lex.intents[id] && hasAny(raw, langLists(lex.intents[id])));
    if (hits.length === 0) hits = templateIds.filter((id) => lex.intents[id] && hasLike(raw, langLists(lex.intents[id]), notTypos, corrections));
    let intent = hits.length === 1 ? hits[0] : "unclear";
    if (hits.length === 0 && hasLike(raw, langLists(lex.diy_words), notTypos)) intent = "unsupported";

    // Wall type (only if exactly one is mentioned)
    let walls = Object.keys(lex.wall_types).filter((w) => hasAny(raw, langLists(lex.wall_types[w])));
    if (walls.length === 0) walls = Object.keys(lex.wall_types).filter((w) => hasLike(raw, langLists(lex.wall_types[w]), notTypos, corrections));
    const over = lex.wall_type_overrides || {};
    walls = walls.filter((w) => !walls.some((o) => Array.isArray(over[o]) && over[o].includes(w)));
    if (walls.length === 1) facts.wall_type = walls[0];

    const dimWord = (tok) => {
      if (typeof tok !== "string") return null;
      if (langLists(lex.dimension_words.length).includes(tok)) return "length";
      if (langLists(lex.dimension_words.depth).includes(tok)) return "depth";
      return null;
    };
    const toCm = (n, unit) => unit === "m" ? n * 100 : unit === "mm" ? n / 10 : n;
    const lengths = [];
    for (let i = 0; i < tokens.length; i++) {
      const n = tokens[i];
      if (typeof n !== "number") continue;
      // "80 x 25 cm" → length × depth
      if (tokens[i + 1] === "x" && typeof tokens[i + 2] === "number") {
        const u = unitOf(tokens[i + 3], lex);
        if (u === "cm" || u === "m" || u === "mm") {
          lengths.push({ value: toCm(n, u), kind: "length" }, { value: toCm(tokens[i + 2], u), kind: "depth" });
          i += 3;
          continue;
        }
      }
      const u = unitOf(tokens[i + 1], lex);
      if ((u === "kg" || u === "g") && facts.load_kg === null) facts.load_kg = u === "g" ? n / 1000 : n;
      else if (u === "cm" || u === "m" || u === "mm") {
        const kind = dimWord(tokens[i + 2]) || dimWord(tokens[i - 1]) || null;
        lengths.push({ value: toCm(n, u), kind });
      } else if (Number.isInteger(n) && langLists(lex.count_words.pictures).includes(tokens[i + 1])) {
        facts.picture_count = n;
      } else if (Number.isInteger(n) && langLists(lex.count_words.points).includes(tokens[i + 1])) {
        facts.points_per_picture = n;
      }
    }
    const len = lengths.find((l) => l.kind === "length") || lengths.find((l) => l.kind === null);
    const dep = lengths.find((l) => l.kind === "depth");
    if (len) facts.shelf_length_cm = round(len.value);
    if (dep) facts.shelf_depth_cm = round(dep.value);
    return { intent, high_risk: false, facts };
  }

  function round(n) { return Math.round(n * 10) / 10; }

  // -------------------------------------------------------------------
  // Adapter factory
  // -------------------------------------------------------------------
  /**
   * @param opts { mode, lexicon, templateIds, proxyUrl, timeoutMs, fetchImpl, mockResponses }
   */
  function create(opts) {
    const mode = opts.mode || "template";
    const templateIds = opts.templateIds;
    const fetchImpl = opts.fetchImpl || (typeof fetch !== "undefined" ? fetch.bind(root) : null);
    const maxAttempts = 2; // design §5: retry max. 2, then fallback

    function finish(source, candidate) {
      const v = validateOutput(candidate, templateIds);
      return v.ok ? { ok: true, source, output: v.output } : { ok: false, source, reason: "invalid_output", errors: v.errors };
    }

    async function viaProxy(text, lang) {
      if (!opts.proxyUrl || !fetchImpl) return { ok: false, source: "proxy", reason: "not_configured" };
      let last = null;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
        const timer = ctrl ? setTimeout(() => ctrl.abort(), opts.timeoutMs || 8000) : null;
        try {
          // Only the (redacted) project text and the UI language are sent.
          const res = await fetchImpl(opts.proxyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: redact(text), lang: lang === "de" ? "de" : "en" }),
            signal: ctrl ? ctrl.signal : undefined,
            credentials: "omit",
            referrerPolicy: "no-referrer"
          });
          if (!res.ok) { last = { ok: false, source: "proxy", reason: "http_" + res.status }; if (res.status === 429) break; continue; }
          const body = await res.json();
          last = finish("proxy", body && body.output);
          if (last.ok) return last;
        } catch (e) {
          last = { ok: false, source: "proxy", reason: e && e.name === "AbortError" ? "timeout" : "network" };
        } finally {
          if (timer) clearTimeout(timer);
        }
      }
      return last;
    }

    function viaMock(text) {
      const list = (opts.mockResponses && opts.mockResponses.responses) || [];
      const hit = list.find((r) => String(text).includes(r.match));
      const raw = hit ? hit.raw : opts.mockResponses && opts.mockResponses.default;
      if (raw === "__network_error__") return { ok: false, source: "mock", reason: "network" };
      let parsed;
      try { parsed = typeof raw === "string" ? JSON.parse(raw) : raw; } catch (_) {
        return { ok: false, source: "mock", reason: "invalid_json" };
      }
      return finish("mock", parsed);
    }

    return Object.freeze({
      mode,
      /** @returns Promise<{ok, source, output?, reason?}> */
      async understand(text, lang) {
        if (mode === "proxy") return viaProxy(text, lang);
        if (mode === "mock") return viaMock(text);
        return finish("template", templateUnderstand(text, opts.lexicon, templateIds));
      }
    });
  }

  root.BBAI = Object.freeze({ FACT_NAMES, validateOutput, redact, templateUnderstand, create });
})(typeof window !== "undefined" ? window : globalThis);
