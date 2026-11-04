#!/usr/bin/env node
/*
 * Builds ONE self-contained HTML file of the app for testers:
 *   node tools/build_trial.js            → trial/Baumarkt-Buddy-Trial.html
 *
 * The tester double-clicks the file. No server, no git, no install:
 * all scripts, styles, fonts and data files (workbook, templates, PLZ table)
 * are embedded, and fetch() of those files is answered from the embedded copy.
 * The D-13/D-14 preview is always on in this copy (no "?preview=d13" needed).
 * The normal app in app/ is not changed by this script.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const APP = path.join(ROOT, "app");
const OUT_DIR = path.join(ROOT, "trial");
const OUT = path.join(OUT_DIR, "Baumarkt-Buddy-Trial.html");

const read = (p) => fs.readFileSync(p, "utf8");
const b64 = (p) => fs.readFileSync(p).toString("base64");
const safeScript = (s) => s.replace(/<\/script/gi, "<\\/script");

// 1. Data files the app fetches, keyed by the URL used in app/config.js.
global.window = {};
new Function("window", read(path.join(APP, "config.js")))(global.window);
const C = global.window.BB_CONFIG;
const urls = new Set([
  C.data.workbook, C.data.safetyRules, C.data.lexicon, C.data.mockResponses, C.data.plzTable,
  ...C.data.templates, ...(C.data.inactiveTemplates || []),
  C.preview && C.preview.d13 && C.preview.d13.workbook
].filter(Boolean));
const files = {};
for (const u of urls) {
  const p = path.resolve(APP, u);
  if (!fs.existsSync(p)) throw new Error("Missing data file: " + u);
  files[u] = /\.xlsx$/i.test(u) ? { b64: b64(p) } : { text: read(p) };
}

// 2. fetch() shim: embedded files first, everything else as before.
const shim = `
(function () {
  var FILES = ${JSON.stringify(files)};
  var realFetch = window.fetch ? window.fetch.bind(window) : null;
  function key(u) { return String(u && u.url || u).replace(/^\\.\\//, "").split("?")[0]; }
  window.fetch = function (input, opts) {
    var f = FILES[key(input)];
    if (!f) return realFetch ? realFetch(input, opts) : Promise.reject(new Error("offline"));
    var body;
    if (f.b64) { var s = atob(f.b64), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); body = a; }
    else body = f.text;
    return Promise.resolve(new Response(body, { status: 200 }));
  };
})();`;

// 3. Styles with the fonts as data URIs.
const css = ["style.css", "preview-d13.css"].map((f) => read(path.join(APP, f))).join("\n")
  .replace(/url\("(fonts\/[^"]+\.woff2)"\)/g, (_, f) => `url("data:font/woff2;base64,${b64(path.join(APP, f))}")`);

// 4. index.html with every script inlined.
let html = read(path.join(APP, "index.html"));
html = html.replace(/\s*<meta http-equiv="Content-Security-Policy"[^>]*>/, "");
html = html.replace(/<title>[^<]*<\/title>/, "<title>Baumarkt-Buddy – Trial</title>");
html = html.replace('<link rel="stylesheet" href="style.css">', `<style>\n${css}\n</style>`);
let first = true;
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, src) => {
  let js = read(path.join(APP, src));
  if (src === "preview-d13.js") {
    const before = js;
    js = js.replace(/const active = [^;]+;/, "const active = true; // trial file: D-13/D-14 preview always on");
    if (js === before) throw new Error("preview-d13.js: activation line not found");
  }
  // The preview stylesheet is already inlined above: mark it as loaded so no file is requested.
  if (src === "preview-d13.js") js = js.replace('if (!document.getElementById("pv-style"))', "if (false)");
  const pre = first ? `<script>${safeScript(shim)}</script>\n  ` : "";
  first = false;
  return `${pre}<script>/* ${src} */\n${safeScript(js)}\n</script>`;
});
if (/<script src=/.test(html)) throw new Error("A script was not inlined");

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, html);
console.log("Written " + path.relative(ROOT, OUT) + " (" + Math.round(fs.statSync(OUT).size / 1024) + " KB)");
