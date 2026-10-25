/*
 * Baumarkt-Buddy – voice input (FR-25, FR-27, SR-11, NFR-04).
 *
 * Uses the browser's built-in Web Speech API (no paid external API).
 * Speech only produces TEXT: the transcript is written into the free-text
 * field, stays editable and must be confirmed by tapping "Continue" before
 * it is processed – exactly like typed text (no special path for speech).
 * Spoken "commands" are never interpreted; they are just words in the text.
 *
 * The app never reads, keeps or sends audio. The browser's speech service
 * (e.g. Google for Chrome, Apple for Safari, Microsoft for Edge) may receive
 * the audio to turn it into text – this is named in the privacy notice.
 *
 * Unsupported browser (e.g. Firefox), denied or failing microphone → the
 * caller shows a hint; typing and project buttons always keep working
 * (NFR-03, RB-19).
 */
(function (root) {
  "use strict";

  const LANGS = Object.freeze({ de: "de-DE", en: "en-US" });

  // Web Speech API error codes → our message keys (i18n: speech_error_*).
  const ERROR_KEYS = Object.freeze({
    "not-allowed": "denied",
    "service-not-allowed": "denied",
    "audio-capture": "no_microphone",
    "network": "network",
    "no-speech": "no_speech",
    "language-not-supported": "language",
    "aborted": null // our own abort – no message
  });

  /** Returns the SpeechRecognition constructor of this browser, or null. */
  function nativeRecognition() {
    return root.SpeechRecognition || root.webkitSpeechRecognition || null;
  }

  /**
   * @param opts {
   *   Recognition: constructor (injectable for tests; default: browser API),
   *   lang: "en" | "de",
   *   onText(text, isFinal) – live transcript of this recording,
   *   onState(state) – "listening" | "idle",
   *   onError(key) – message key, see ERROR_KEYS
   * }
   */
  function create(opts) {
    const Ctor = opts.Recognition === undefined ? nativeRecognition() : opts.Recognition;
    let rec = null;
    let finalText = "";
    let active = false;

    function emitText(interim, isFinal) {
      opts.onText && opts.onText((finalText + " " + interim).replace(/\s+/g, " ").trim(), isFinal);
    }

    function start() {
      if (!Ctor) { opts.onError && opts.onError("unsupported"); return false; }
      if (active) return true;
      finalText = "";
      try {
        rec = new Ctor();
      } catch (_) {
        opts.onError && opts.onError("unsupported");
        return false;
      }
      rec.lang = LANGS[opts.lang] || LANGS.en; // NFR-09: de-DE / en-US
      rec.interimResults = true;              // live transcript (NFR-02: < 3 s)
      rec.continuous = false;                 // one utterance; customer can tap again
      rec.maxAlternatives = 1;

      rec.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const r = event.results[i];
          const txt = r[0] && typeof r[0].transcript === "string" ? r[0].transcript : "";
          if (r.isFinal) finalText = (finalText + " " + txt).trim();
          else interim += " " + txt;
        }
        emitText(interim.trim(), event.results[event.results.length - 1].isFinal === true);
      };
      rec.onerror = (event) => {
        const key = event && event.error in ERROR_KEYS ? ERROR_KEYS[event.error] : "failed";
        if (key) opts.onError && opts.onError(key);
      };
      rec.onend = () => {
        active = false;
        rec = null;
        opts.onState && opts.onState("idle");
      };
      try {
        rec.start(); // the browser asks for microphone permission here
      } catch (_) {
        rec = null;
        opts.onError && opts.onError("failed");
        return false;
      }
      active = true;
      opts.onState && opts.onState("listening");
      return true;
    }

    /** Stop and keep what was recognised so far. */
    function stop() { if (rec) { try { rec.stop(); } catch (_) { /* already stopped */ } } }

    /** Cancel immediately (e.g. language switch, leaving the screen). */
    function abort() { if (rec) { try { rec.abort(); } catch (_) { /* already stopped */ } } }

    return Object.freeze({
      supported: !!Ctor,
      start, stop, abort,
      isActive: () => active
    });
  }

  root.BBSpeech = Object.freeze({ create, nativeRecognition, LANGS, ERROR_KEYS });
})(typeof window !== "undefined" ? window : globalThis);
