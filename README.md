# TailorTab

An AI-powered personal dashboard that replaces Chrome's new tab page (Manifest V3, React, TypeScript). Pick a profile to get a curated set of live widgets, or type a natural-language prompt — *"show me Steelers news"*, *"TSLA stock price"*, *"weather in Austin"*, *"price of bitcoin"* — and a small AI agent turns it into a live widget. Everything persists in localStorage and refreshes on every new tab.

## How it works

TailorTab is split into two parts:

- **The extension (this repo root)** — a static React app that overrides the new tab page. It renders widgets and fetches most data directly from keyless public APIs. It ships with **no secrets**.
- **A tiny backend (`/server`)** — a Cloudflare Worker that holds the OpenAI key and runs the AI calls (prompt parsing and response mapping). The extension talks to it for AI features only.

Data sources are keyless and fetched client-side: ESPN (sports), Yahoo Finance (stocks/indices), Google News (news), Open-Meteo (weather), plus the agent's sources (Coinbase, Frankfurter, GitHub, Wikipedia, etc.). Backgrounds are bundled images. The only thing that needs a key is the AI prompt bar, and that key lives on the backend.

## Features

- **Profiles** — nine ready-made dashboards (Finance Bro, Athlete, Techie, The Minimalist, Entrepreneur, Politician, News Paper, Local, Custom). Each keeps its own widgets and rotates a themed background. The bottom bar has **Settings**, **Change background**, **Change profile**, and **Reset profile**.
- **Built-in widget types** — News, Stocks (with charts), Sports, Weather, plus a **Watchlist** in the Finance Bro profile where you add/remove tickers and see price + daily movement.
- **AI prompt bar** — type anything; the agent figures out the widget. Compound prompts ("tesla news and the world cup schedule") create one widget per request.
- **Dynamic "any API" agent** — for requests not covered by the built-in types, the agent plans a real public API call, fetches it, and auto-maps the response into a widget (see below).
- **Settings** — font size, 12/24-hour time and time-zone, and a key manager for gated agent sources. All persisted in localStorage.

## Setup

### 1. Backend (for the AI prompt bar)

The curated widgets and profiles work without a backend. To enable the prompt bar and the agent, deploy the Worker:

```sh
cd server
npm install
npx wrangler login
npx wrangler kv namespace create KV          # paste id into wrangler.toml
npx wrangler kv namespace create KV --preview # paste preview_id into wrangler.toml
npx wrangler secret put OPENAI_API_KEY        # your OpenAI key (held server-side only)
npm run deploy                                # prints your Worker URL
```

See [`server/README.md`](server/README.md) for details. Then set `BACKEND_URL` in [`src/backend.ts`](src/backend.ts) and replace the placeholder Worker domain in [`public/manifest.json`](public/manifest.json) with your real one.

### 2. Extension

```sh
npm install
npm run build
```

Load it in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select the `dist/` folder
4. Open a new tab

## Usage

Pick a profile from **Change profile** in the bottom bar, or type a prompt into the bar and press **Add**:

- `weather in Austin` — current conditions (Fahrenheit, with location)
- `TSLA stock price` — live quote with a daily chart
- `AAPL, TSLA, NVDA prices` — a multi-stock widget
- `NBA scores` / `show me the world cup schedule` — sports scoreboards
- `news about AI startups` / `recent sneaker releases` — news widgets
- `price of bitcoin` / `USD to EUR exchange rate` / `latest commits on facebook/react` — dynamic agent widgets
- `tesla news and the world cup schedule` — two widgets at once

Hover a widget and click the delete control to remove it. Widgets re-fetch on every new tab, with a short cache so rapid tab opens stay instant.

## Dynamic widgets (the agent)

Anything not covered by the built-in types is handled by a three-step agent:

1. **Plan** — the backend asks OpenAI (gpt-4o-mini) to turn your prompt into a concrete public API request. It is anchored to reliable keyless APIs (Coinbase, Frankfurter, Open-Meteo, GitHub, Wikipedia, REST Countries) and instructed never to invent endpoints; anything informational with no specific API falls back to a news widget.
2. **Fetch** — the extension fetches that API **directly from your browser** (your IP, no datacenter blocks).
3. **Shape** — the first fetch sends a sample of the response back to the backend, which returns an extraction *mapping*. The mapping is saved into the widget, so later refreshes apply it with no further AI calls.

### Permissions

At install, the extension requests only the specific keyless hosts it calls directly (ESPN, Yahoo, Google News, Open-Meteo) plus your backend domain — not all sites. The open-ended agent needs to reach arbitrary hosts, so that broad access is declared as an **optional** permission and requested at runtime: the first time you use an any-source widget, the widget shows an **"Enable any-source widgets"** button that triggers Chrome's one-click permission prompt. Granted access persists; it can be revoked anytime in `chrome://extensions`.

### Keys for gated agent sources

Open **Settings -> API keys** and save a key under a short name (e.g. `FINNHUB`). The agent references it as a `{{FINNHUB}}` placeholder when building a request, and the value is substituted at fetch time. Keys are stored locally and are never sent to OpenAI. If a widget needs a key you have not saved, it shows an "Add key" button.

## Data sources

| Widget | Source | Key? |
|---|---|---|
| News | Google News RSS | none |
| Stocks / indices | Yahoo Finance (unofficial) | none |
| Sports | ESPN site API (unofficial) | none |
| Weather | Open-Meteo + Open-Meteo geocoding | none |
| Crypto / FX / repos / etc. (agent) | Coinbase, Frankfurter, GitHub, Wikipedia, REST Countries | none |
| Prompt parsing | OpenAI gpt-4o-mini (via the backend) | backend only |

## Privacy

See [PRIVACY.md](PRIVACY.md). In short: no accounts, no ads, no analytics. Prompts are sent to the backend and on to OpenAI to build widgets; an anonymous device id is used for rate limiting. Everything else stays in your browser.

## Development

- `npm run dev` — Vite dev server in a normal browser tab for fast UI iteration. Note: many data APIs block cross-origin requests from `localhost`, so widgets that fetch live data show errors in the dev server; they work in the loaded extension.
- `npm run watch` — rebuilds `dist/` on save; reload the extension to test for real.

## Notes and limitations

- **Unofficial APIs.** Yahoo Finance, ESPN, and Google News are undocumented/unofficial endpoints. They can change shape or rate-limit without notice, and using them may conflict with those providers' terms of service. The agent's anchored sources (Coinbase, Frankfurter, Open-Meteo, GitHub, Wikipedia) are documented and public.
- **Agent reliability.** The agent occasionally picks an endpoint that returns no useful data; the widget then shows an error with a retry.
- **Costs.** Only prompt parsing and mapping use OpenAI; curated widgets and profiles do not. The backend uses gpt-4o-mini and rate-limits per device.
- **Web Store.** This ships with an opt-in broad-host permission and uses unofficial APIs; review the permissions and provider terms before publishing publicly.
