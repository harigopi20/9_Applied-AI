# Baumarkt-Buddy – AI proxy (optional)

A small Cloudflare Worker that lets the app use a commercial language model
**without the API key ever reaching the browser** (NFR-06).

> **Team decision (25 Oct 2026):** the proxy is built but **not active**. The app
> runs in AI mode `"template"` (keyword matching, free, no AI). Switch it on only
> if you want the AI layer in the demo.

## What it does
- Accepts `POST /understand` with `{"text": "...", "lang": "en"|"de"}` – only the
  project description. The app removes postcodes, e-mail addresses and phone
  numbers before sending (NFR-04). The PLZ field is never sent.
- Asks the model to **classify and extract only**, with a fixed JSON schema
  (structured output, DR-05). The app validates the answer again and discards
  anything invalid (`app/ai-adapter.js`).
- Customer text is passed as data inside `<customer_text>`, never as an
  instruction (NFR-07). No catalogue data is sent.
- Rate limit: 10 requests per minute per client IP (`[[ratelimits]]` binding;
  in-memory fallback). Only origins in `ALLOWED_ORIGINS` may call it (CORS).
- Logs are switched off (`[observability] enabled = false`); the Worker code
  logs nothing.
- Model: `MODEL` in `wrangler.toml` (default `claude-opus-5-5`; for a cheaper
  demo set `claude-haiku-5-5`). Effort `low`, server-side refusal fallback on.

## Set up (about 10 minutes, free Cloudflare plan)
1. Create a Cloudflare account and an Anthropic API key (console.anthropic.com).
   Set a monthly spend limit on the key.
2. In this folder:
   ```bash
   npm install
   npx wrangler login
   npx wrangler secret put ANTHROPIC_API_KEY   # paste the key – never commit it
   ```
3. Check `ALLOWED_ORIGINS` in `wrangler.toml` (your GitHub Pages origin, e.g.
   `https://st854d2gpb-create.github.io`; add `http://localhost:8000` for local tests).
4. Deploy: `npx wrangler deploy` → note the URL, e.g.
   `https://baumarkt-buddy-proxy.<account>.workers.dev`.
5. In `app/config.js` set
   `aiMode: "proxy"` and `ai.proxyUrl: "https://…workers.dev/understand"`.
6. `app/index.html` already allows `connect-src https://*.workers.dev` in its
   Content-Security-Policy. To be stricter, replace it with your exact Worker URL.

## Test locally
```bash
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .dev.vars   # git-ignored
npx wrangler dev
curl -X POST http://localhost:8787/understand \
  -H 'Origin: http://localhost:8000' -H 'Content-Type: application/json' \
  -d '{"text":"Ich will ein Regal für zwölf Kilo an die Betonwand hängen","lang":"de"}'
```

## If something fails
Timeouts, rate limits, refusals or invalid answers never block the customer:
the app falls back to the two project templates and keeps the text and any
values already recognised (NFR-03).
