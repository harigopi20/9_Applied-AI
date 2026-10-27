#!/usr/bin/env node
/*
 * Baumarkt-Buddy – runs the automated test suite (app/tests.html) in a
 * headless Chromium and saves the result as a file.
 *
 *   node tools/run_tests.js                 → saves test/results/<date>_<commit>.md and .json
 *   node tools/run_tests.js --out <dir>     → saves into another folder (used by CI)
 *   node tools/run_tests.js --no-save       → only prints the summary
 *
 * Needs Playwright with Chromium: `npm install --prefix tools` and
 * `npx --prefix tools playwright install chromium` (once). Exit code 1 if a
 * test fails or the suite does not finish – so CI turns red.
 *
 * The script serves the repository root itself (like `python3 -m http.server`),
 * because the app reads ../data/ – nothing is sent anywhere else.
 */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const TIMEOUT_MS = 120000;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".csv": "text/csv; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".woff2": "font/woff2", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
};

function args() {
  const a = process.argv.slice(2);
  const i = a.indexOf("--out");
  return { save: !a.includes("--no-save"), out: i >= 0 && a[i + 1] ? path.resolve(a[i + 1]) : path.join(ROOT, "test", "results") };
}

function loadPlaywright() {
  try { return require("playwright"); } catch (_) { /* fall through */ }
  try { return require(path.join(__dirname, "node_modules", "playwright")); } catch (_) { /* fall through */ }
  console.error("Playwright not found. Run: npm install --prefix tools && npx --prefix tools playwright install chromium");
  process.exit(2);
}

/** Static file server for the repository root on a free local port. */
function serve() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const file = path.join(ROOT, path.normalize(rel));
    if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (err, body) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
      res.end(body);
    });
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

function git(cmd, fallback) {
  try { return execSync("git " + cmd, { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch (_) { return fallback; }
}

function md(text) { return String(text == null ? "" : text).replace(/\|/g, "\\|").replace(/\r?\n/g, " "); }

async function main() {
  const opt = args();
  const { chromium } = loadPlaywright();
  const server = await serve();
  const port = server.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  const started = new Date();
  let rows = [], summary = "", finished = false;
  try {
    await page.goto("http://127.0.0.1:" + port + "/app/tests.html");
    await page.waitForSelector('#summary[data-done="true"]', { timeout: TIMEOUT_MS });
    finished = true;
    summary = (await page.textContent("#summary")).trim();
    rows = await page.$$eval("#results tr", (trs) => trs.map((tr) => {
      const c = [...tr.children].map((td) => td.textContent.trim());
      return { id: c[0], name: c[1], status: (c[2] || "").toLowerCase(), details: c[3] || "" };
    }));
  } catch (e) {
    summary = "Suite did not finish: " + e.message.split("\n")[0];
  } finally {
    await browser.close();
    server.close();
  }

  const count = (s) => rows.filter((r) => r.status === s).length;
  const result = {
    date: started.toISOString(),
    commit: git("rev-parse --short HEAD", "unknown"),
    branch: process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || git("rev-parse --abbrev-ref HEAD", "unknown"),
    uncommitted_changes: git("status --porcelain", "") !== "",
    browser: "Chromium " + browser.version() + " (headless, Playwright)",
    finished, summary,
    passed: count("pass"), failed: count("fail"), pending: count("pending"), total: rows.length,
    page_errors: pageErrors,
    tests: rows
  };
  const ok = finished && result.failed === 0 && result.total > 0;

  console.log(summary);
  rows.filter((r) => r.status === "fail").forEach((r) => console.log("FAIL  " + r.id + " – " + r.name + " – " + r.details));
  pageErrors.forEach((e) => console.log("PAGE ERROR  " + e));

  if (opt.save) {
    fs.mkdirSync(opt.out, { recursive: true });
    const base = result.date.slice(0, 10) + "_" + result.commit + (result.uncommitted_changes ? "-dirty" : "");
    const lines = [
      "# Test result – " + result.date.slice(0, 10),
      "",
      "| | |",
      "|---|---|",
      "| **Result** | " + (ok ? "PASS" : "FAIL") + " – " + md(summary) + " |",
      "| **Date (UTC)** | " + result.date + " |",
      "| **Commit** | `" + result.commit + "`" + (result.uncommitted_changes ? " + uncommitted changes" : "") + " |",
      "| **Branch** | " + md(result.branch) + " |",
      "| **Browser** | " + md(result.browser) + " |",
      "| **Suite** | `app/tests.html` (run by `tools/run_tests.js`) |",
      "",
      "| # | ID | Test | Result | Details |",
      "|---|---|---|---|---|"
    ].concat(rows.map((r, i) => "| " + (i + 1) + " | " + md(r.id) + " | " + md(r.name) + " | " + r.status.toUpperCase() + " | " + md(r.details) + " |"));
    if (pageErrors.length) lines.push("", "**Page errors:** " + pageErrors.map(md).join("; "));
    fs.writeFileSync(path.join(opt.out, base + ".md"), lines.join("\n") + "\n");
    fs.writeFileSync(path.join(opt.out, base + ".json"), JSON.stringify(result, null, 2) + "\n");
    console.log("saved " + path.relative(ROOT, path.join(opt.out, base)) + ".md / .json");
  }
  process.exit(ok ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
