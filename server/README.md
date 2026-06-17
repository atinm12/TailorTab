# Smart Homepage — backend (Cloudflare Workers)

A tiny proxy that holds your OpenAI key so the extension ships with **no secrets** and
**no `https://*/*` permission**. It exposes three endpoints, all rate-limited per device:

| Endpoint | Purpose | Calls OpenAI? |
|---|---|---|
| `POST /parse` | prompt → `{ widgets: [...] }` (gpt-4o-mini) | yes |
| `POST /shape` | API sample → generic-widget mapping (gpt-4o-mini) | yes |
| `POST /fetch` | server-side fetch of a keyless API (SSRF-guarded) | no |

Curated widgets (news, stocks, sports, weather) are fetched **client-side** and never touch this server.

## One-time setup

```sh
cd server
npm install
npx wrangler login

# Create the KV namespace, then paste both ids into wrangler.toml:
npx wrangler kv namespace create KV
npx wrangler kv namespace create KV --preview

# Store your OpenAI key as a secret (never in code/vars):
npx wrangler secret put OPENAI_API_KEY
```

## Run locally

```sh
npm run dev        # serves on http://localhost:8787
```
Point the extension at it by setting `BACKEND_URL` in `../src/backend.ts` to `http://localhost:8787`,
rebuild the extension, and reload it.

## Deploy

```sh
npm run deploy     # prints your https://smart-homepage-api.<subdomain>.workers.dev URL
```
Put that URL in `../src/backend.ts` (`BACKEND_URL`), rebuild, reload.

## After publishing the extension (optional hardening)

```sh
npx wrangler secret put EXTENSION_ID   # the chrome-extension id; locks the API to your extension
```

## Cost & limits

- Model is **gpt-4o-mini**; `/parse` results are cached 1h server-side.
- Per device: ~40 AI calls/day + a 12/min burst cap; `/fetch` allows 800/day.
- At ~1000 users this stays inside Cloudflare's free tier (100k req/day); OpenAI runs ~$20–40/mo.
- Tune the limits in `src/index.ts` (`checkLimits`).
