/*
 * Baumarkt-Buddy – UI texts in English (default) and German (NFR-09).
 * Product names, sizes and safety notes come from the catalogue and are
 * shown exactly as delivered (SR-07); they are not translated.
 *
 * Safety texts (detector, no certification) are checked by RB-07 tests:
 * they must never contain a clearance phrase from data/safety-rules.json.
 */
(function (root) {
  "use strict";

  const TEXTS = {
    en: {
      app_title: "Baumarkt-Buddy",
      app_tagline: "Your DIY shopping list – checked by fixed rules",
      lang_toggle: "Deutsch",
      lang_toggle_aria: "Switch language to German",
      sample_badge: "Sample data",
      loading: "Loading catalogue …",
      load_error_title: "The catalogue could not be loaded",
      load_error_text: "Without the catalogue we cannot check any product, so we do not show a list. Please reload the page or ask a store associate.",
      retry: "Try again",

      // Start / transparency (NFR-04, NFR-05)
      notice_title: "Before you start",
      notice_ai: "This app uses AI only to understand your project description. Every product, quantity and safety check is decided by fixed, tested rules – not by the AI.",
      notice_stage: "In this version you choose your project with a button; free text and voice follow in the next stages.",
      notice_sample: "All prices, stock levels, stores, aisles and shelves are sample data for a university prototype. They are not real offers.",
      notice_privacy: "No login, no personal data. Your answers stay in this browser tab and are deleted when you close it.",
      start: "Start",

      // Project choice
      choose_title: "What do you want to do?",
      choose_help: "Choose a project.",
      template_unreviewed: "Template not yet reviewed by the team",
      template_reviewed: "Template reviewed",

      // Questions (FR-04, FR-05)
      question_of: "Question {n} of {total}",
      dont_know: "I don't know",
      next: "Confirm",
      back: "Back",
      cancel: "Cancel",
      value_required: "Please enter a value between {min} and {max}.",
      choose_option: "Please choose one option.",
      confirmed_note: "Only values you confirm here are used.",

      wall_concrete: "Concrete",
      wall_brick: "Brick",
      wall_plasterboard: "Plasterboard (drywall)",
      wall_unknown: "I don't know",

      // Facts summary (SR-01, SR-08)
      facts_title: "Your details",
      fact_wall_type: "Wall",
      fact_load_kg: "Weight",
      fact_shelf_length_cm: "Length",
      fact_shelf_depth_cm: "Depth",
      fact_picture_count: "Pictures",
      fact_points_per_picture: "Hanging points per picture",
      status_user_confirmed: "confirmed by you",
      status_observed: "guess – please confirm",
      status_manufacturer_supported: "manufacturer data",
      status_unknown: "unknown",
      change: "Change",
      new_project: "New project",

      // List (FR-06, FR-08, FR-09, FR-11)
      list_title: "Your shopping list",
      state_validated: "All parts checked against the catalogue and the rules.",
      state_incomplete: "Not complete: some parts are unresolved or do not fit. Please ask a store associate before buying.",
      method: "Method",
      section_materials: "Materials",
      section_tools: "Tools",
      section_safety: "Safety gear",
      qty_estimate: "Estimate",
      qty_packs: "{packs} × pack",
      qty_need: "you need about {units} pcs",
      qty_unclear: "Pack size unclear – ask in store",
      rule: "Rule",
      price_each: "{price} per pack",
      price_unknown: "Price not available",
      line_total: "Line: {price}",
      stock: "Stock",
      aisle: "Aisle",
      shelf: "Shelf",
      not_available: "not available",
      no_store_hint: "No store selected – add your postcode to see aisle, shelf and stock (coming in stage 4).",
      manufacturer_note: "Manufacturer note",
      sample_note: "sample",
      checked_off: "In basket",
      change_variant: "Other variant",
      variant_incompatible: "Does not fit: {checks}. This item stays unresolved.",
      unresolved_item: "No suitable product found in our catalogue. Please ask a store associate.",
      generated_hint: "Tip",
      total: "Total (sample prices)",
      total_unclear_pack: "No total: at least one pack size or price is unclear.",
      total_unresolved_items: "No total: some items are unresolved.",
      total_incompatible: "No total: a selected item does not fit.",
      evidence_title: "Why these products? (evidence log)",
      evidence_rule: "Rule",
      evidence_check: "Check",
      evidence_result: "Result",
      evidence_source: "Source",

      // Notices (SR-02, SR-05, NFR-05)
      notice_estimates: "Quantities are estimates based on the rules shown. Prices and stock are sample data.",
      notice_detector_limits: "Cable and stud detectors help, but they have limits: they often do not find plastic water pipes, deep cables or cables without current. A \"nothing found\" result is not a clearance to drill. Plan holes away from sockets, switches and the areas directly above, below and beside them. If in doubt, ask a qualified person.",
      notice_no_wall_certification: "We cannot see or test your wall. This app does not confirm what your wall is made of, how much it can hold or where cables and pipes run.",

      // Stop screens (SR-03, SR-06, SR-09, FR-15)
      stop_title: "We stop here – for your safety",
      stop_fact_unknown: "We need to know {facts} before we can suggest any wall plugs or fixings. We will not guess.",
      stop_fact_unknown_help: "How to find out: knock on the wall (hollow sound = often plasterboard), look at a drill hole or ask your landlord or a store associate. Then change your answer.",
      stop_load_over_limit: "{load} kg is more than this app supports ({limit} kg). Heavy loads need a fixing system checked by a professional.",
      stop_wall_limit: "{load} kg on plasterboard is more than this app supports ({limit} kg).",
      stop_wall_limit_help: "Alternatives: a free-standing shelf, or ask a store associate about fixing into the studs. Do not add up the ratings of several plugs.",
      stop_no_suitable_system: "Our catalogue has no product combination rated for this load and wall (we never add up plug ratings).",
      stop_no_suitable_system_help: "Try a lighter load, a different size, or ask a store associate.",
      stop_invalid_value: "One of your values is not valid. Please change it.",
      stop_professional: "Please ask a store associate or a qualified professional.",
      high_risk_title: "This job needs a professional",
      high_risk_text: "Work on electrics, gas, load-bearing walls or hidden pipes and cables is dangerous. Baumarkt-Buddy does not plan this work. Please contact a qualified professional (e.g. a licensed electrician or gas fitter).",
      change_answers: "Change my answers",

      footer: "University prototype (MBA Applied AI). Sample data only. AI is used to understand text; decisions are made by fixed rules."
    },

    de: {
      app_title: "Baumarkt-Buddy",
      app_tagline: "Ihre Heimwerker-Einkaufsliste – geprüft nach festen Regeln",
      lang_toggle: "English",
      lang_toggle_aria: "Sprache auf Englisch umstellen",
      sample_badge: "Beispieldaten",
      loading: "Katalog wird geladen …",
      load_error_title: "Der Katalog konnte nicht geladen werden",
      load_error_text: "Ohne Katalog können wir kein Produkt prüfen und zeigen daher keine Liste. Bitte laden Sie die Seite neu oder fragen Sie eine Fachkraft im Markt.",
      retry: "Erneut versuchen",

      notice_title: "Bevor Sie starten",
      notice_ai: "Diese App nutzt KI nur, um Ihre Projektbeschreibung zu verstehen. Alle Produkte, Mengen und Sicherheitsprüfungen entscheiden feste, getestete Regeln – nicht die KI.",
      notice_stage: "In dieser Version wählen Sie Ihr Projekt per Button; Freitext und Sprache folgen in den nächsten Etappen.",
      notice_sample: "Alle Preise, Bestände, Märkte, Gänge und Regale sind Beispieldaten eines Hochschul-Prototyps. Es sind keine echten Angebote.",
      notice_privacy: "Kein Login, keine personenbezogenen Daten. Ihre Angaben bleiben in diesem Browser-Tab und werden beim Schließen gelöscht.",
      start: "Los geht's",

      choose_title: "Was möchten Sie machen?",
      choose_help: "Wählen Sie ein Projekt.",
      template_unreviewed: "Vorlage noch nicht vom Team geprüft",
      template_reviewed: "Vorlage geprüft",

      question_of: "Frage {n} von {total}",
      dont_know: "Weiß ich nicht",
      next: "Bestätigen",
      back: "Zurück",
      cancel: "Abbrechen",
      value_required: "Bitte geben Sie einen Wert zwischen {min} und {max} ein.",
      choose_option: "Bitte wählen Sie eine Option.",
      confirmed_note: "Es zählen nur Werte, die Sie hier bestätigen.",

      wall_concrete: "Beton",
      wall_brick: "Ziegel / Mauerwerk",
      wall_plasterboard: "Gipskarton (Trockenbau)",
      wall_unknown: "Weiß ich nicht",

      facts_title: "Ihre Angaben",
      fact_wall_type: "Wand",
      fact_load_kg: "Gewicht",
      fact_shelf_length_cm: "Länge",
      fact_shelf_depth_cm: "Tiefe",
      fact_picture_count: "Bilder",
      fact_points_per_picture: "Aufhängepunkte je Bild",
      status_user_confirmed: "von Ihnen bestätigt",
      status_observed: "Vermutung – bitte bestätigen",
      status_manufacturer_supported: "Herstellerangabe",
      status_unknown: "unbekannt",
      change: "Ändern",
      new_project: "Neues Projekt",

      list_title: "Ihre Einkaufsliste",
      state_validated: "Alle Teile sind gegen Katalog und Regeln geprüft.",
      state_incomplete: "Nicht vollständig: Einige Teile sind ungeklärt oder passen nicht. Bitte vor dem Kauf eine Fachkraft im Markt fragen.",
      method: "Vorgehen",
      section_materials: "Materialien",
      section_tools: "Werkzeug",
      section_safety: "Schutzausrüstung",
      qty_estimate: "Schätzung",
      qty_packs: "{packs} × Packung",
      qty_need: "Sie brauchen ca. {units} Stück",
      qty_unclear: "Packungsgröße unklar – bitte im Markt fragen",
      rule: "Regel",
      price_each: "{price} je Packung",
      price_unknown: "Preis nicht verfügbar",
      line_total: "Position: {price}",
      stock: "Bestand",
      aisle: "Gang",
      shelf: "Regal",
      not_available: "nicht verfügbar",
      no_store_hint: "Kein Markt gewählt – geben Sie Ihre PLZ ein, um Gang, Regal und Bestand zu sehen (folgt in Etappe 4).",
      manufacturer_note: "Herstellerhinweis",
      sample_note: "Beispiel",
      checked_off: "Im Korb",
      change_variant: "Andere Variante",
      variant_incompatible: "Passt nicht: {checks}. Diese Position bleibt ungeklärt.",
      unresolved_item: "Kein passendes Produkt in unserem Katalog gefunden. Bitte eine Fachkraft im Markt fragen.",
      generated_hint: "Tipp",
      total: "Summe (Beispielpreise)",
      total_unclear_pack: "Keine Summe: Mindestens eine Packungsgröße oder ein Preis ist unklar.",
      total_unresolved_items: "Keine Summe: Einige Positionen sind ungeklärt.",
      total_incompatible: "Keine Summe: Eine gewählte Position passt nicht.",
      evidence_title: "Warum diese Produkte? (Nachweis-Protokoll)",
      evidence_rule: "Regel",
      evidence_check: "Prüfung",
      evidence_result: "Ergebnis",
      evidence_source: "Quelle",

      notice_estimates: "Mengen sind Schätzungen nach den angezeigten Regeln. Preise und Bestände sind Beispieldaten.",
      notice_detector_limits: "Leitungssucher helfen, haben aber Grenzen: Kunststoff-Wasserrohre, tief liegende oder stromlose Leitungen werden oft nicht gefunden. „Nichts gefunden“ ist keine Freigabe zum Bohren. Planen Sie Bohrlöcher nicht über, unter oder neben Steckdosen und Schaltern. Im Zweifel fragen Sie eine Fachkraft.",
      notice_no_wall_certification: "Wir können Ihre Wand weder sehen noch prüfen. Diese App bestätigt nicht, woraus Ihre Wand besteht, wie viel sie trägt oder wo Leitungen und Rohre verlaufen.",

      stop_title: "Wir stoppen hier – zu Ihrer Sicherheit",
      stop_fact_unknown: "Wir müssen {facts} kennen, bevor wir Dübel oder Befestigungen vorschlagen. Wir raten nicht.",
      stop_fact_unknown_help: "So finden Sie es heraus: An die Wand klopfen (hohl = oft Gipskarton), ein vorhandenes Bohrloch ansehen oder Vermieter bzw. Fachkraft im Markt fragen. Danach Ihre Antwort ändern.",
      stop_load_over_limit: "{load} kg ist mehr, als diese App unterstützt ({limit} kg). Schwere Lasten brauchen ein von einer Fachkraft geprüftes Befestigungssystem.",
      stop_wall_limit: "{load} kg an Gipskarton ist mehr, als diese App unterstützt ({limit} kg).",
      stop_wall_limit_help: "Alternativen: ein frei stehendes Regal, oder fragen Sie eine Fachkraft nach Befestigung im Ständerwerk. Zählen Sie die Werte mehrerer Dübel nicht zusammen.",
      stop_no_suitable_system: "Unser Katalog hat keine Produktkombination, die für diese Last und Wand zugelassen ist (Dübel-Werte werden nie addiert).",
      stop_no_suitable_system_help: "Versuchen Sie eine geringere Last oder eine andere Größe, oder fragen Sie eine Fachkraft im Markt.",
      stop_invalid_value: "Einer Ihrer Werte ist ungültig. Bitte ändern Sie ihn.",
      stop_professional: "Bitte fragen Sie eine Fachkraft im Markt oder einen Fachbetrieb.",
      high_risk_title: "Diese Arbeit gehört in Fachhände",
      high_risk_text: "Arbeiten an Elektrik, Gas, tragenden Wänden oder verdeckten Leitungen sind gefährlich. Baumarkt-Buddy plant diese Arbeiten nicht. Bitte wenden Sie sich an einen Fachbetrieb (z. B. Elektro- oder Gasinstallateur).",
      change_answers: "Antworten ändern",

      footer: "Hochschul-Prototyp (MBA Applied AI). Nur Beispieldaten. KI wird zum Verstehen von Text genutzt; Entscheidungen treffen feste Regeln."
    }
  };

  let lang = "en";

  function setLang(l) { if (TEXTS[l]) lang = l; return lang; }
  function getLang() { return lang; }

  /** t("key", {name: value}) – missing keys fall back to English, then the key. */
  function t(key, vars) {
    let s = (TEXTS[lang] && TEXTS[lang][key]) || TEXTS.en[key] || key;
    if (vars) Object.keys(vars).forEach((k) => { s = s.split("{" + k + "}").join(String(vars[k])); });
    return s;
  }

  /** Picks the current language from a {en, de} object in data files. */
  function pick(obj) {
    if (obj == null) return "";
    if (typeof obj === "string") return obj;
    return obj[lang] || obj.en || "";
  }

  function formatPrice(n) {
    return new Intl.NumberFormat(lang === "de" ? "de-DE" : "en-GB", { style: "currency", currency: "EUR" }).format(n);
  }

  root.BBI18n = Object.freeze({ TEXTS, t, pick, setLang, getLang, formatPrice });
})(typeof window !== "undefined" ? window : globalThis);
