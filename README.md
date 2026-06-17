# Smart Homepage

An AI-powered personal dashboard that replaces Chrome's new tab page (Manifest V3, React, TypeScript). Type a natural-language prompt — *"show me Steelers news"*, *"TSLA stock price"*, *"weather in Austin"*, *"price of bitcoin"* — and GPT-4o turns it into a live data widget. Widgets persist in localStorage and refresh on every new tab.

Beyond the four built-in widget types (News, Stocks, Sports, Weather), an **agent loop** lets you pull in data from *any* public API: GPT-4o plans the HTTP request, the app fetches it, and a second pass auto-maps the response into a widget. See [Dynamic widgets](#dynamic-widgets-any-api) below.

## Setup

1. **Install dependencies**

   ```sh
   npm install
   ```

2. **No API keys in the client.**

   Data sources are keyless: **ESPN** (sports), **Yahoo Finance** (stocks/indices), **Google News** (news), **Open-Meteo** (weather), and backgrounds are bundled images. The only thing that needs a key is the AI prompt bar (OpenAI), and that key lives on the **backend**, not in the extension.

   - To use the AI prompt + "type anything" agent, deploy the backend in [`/server`](server/README.md) and set `BACKEND_URL` in [`src/backend.ts`](src/backend.ts).
   - Without a backend, everything else (profiles, all four widget types, the watchlist) works fully; the prompt bar just returns a "couldn't reach the parser" placeholder.
   - Gated agent sources can still use a user-supplied key, added at runtime via the in-app settings; it's stored locally and passed through the backend per request, never bundled.

3. **Build**

   ```sh
   npm run build
   ```

4. **Load into Chrome**

   1. Open `chrome://extensions`
   2. Enable **Developer mode** (top right)
   3. Click **Load unpacked** and select the `dist/` folder
   4. Open a new tab — Chrome will ask to confirm keeping the new-tab override

## Usage

Type a prompt into the bar and press **Add**:

- `weather in Austin` → current conditions widget
- `TSLA stock price` → live quote with daily change
- `show me Steelers news` → team record + upcoming games
- `NBA scores` → league scoreboard
- `news about AI startups` → latest headlines
- `tesla news and the world cup schedule` → **two** widgets at once (compound prompts are split into one widget per request)
- Anything else → a "coming soon" placeholder

The **Finance Bro** profile opens with an editable **Watchlist** card: add any ticker/ETF in the input, see its price and daily movement, hover a row for a "See news ›" hint, and click it to open that security's news in Google News. Removing a row and adding tickers persist with the profile.

Hover a widget and click **×** to delete it. Widgets re-fetch on every new tab (with a 10-minute cache so rapid tab opens are instant and the Alpha Vantage free tier — 25 requests/day — isn't exhausted).

## Dynamic widgets (any API)

Anything that isn't one of the four built-in types is handled by an agent loop:

1. **Plan** — GPT-4o turns your prompt into a concrete HTTP request (URL, method, headers). It's anchored to a set of reliable keyless public APIs (CoinGecko, Open-Meteo, Frankfurter FX, GitHub, Wikipedia, REST Countries) to reduce hallucinated endpoints.
2. **Fetch** — the extension calls that URL.
3. **Shape** — the first fetch sends a sample of the response back to GPT-4o, which returns an extraction *mapping*. The mapping is saved into the widget, so every later refresh applies it deterministically with **no further OpenAI calls**.

Examples that work with no extra keys: `price of bitcoin`, `USD to EUR exchange rate`, `latest commits on facebook/react`, `population of Japan`, `summary of the Eiffel Tower`.

### API keys for gated sources

Click the **gear** (bottom-left) to open Settings, then the **API keys** section. Save a key under a short name (e.g. `FINNHUB`); the agent references it as a `{{FINNHUB}}` placeholder when building a request, and the extension substitutes the real value at fetch time. **Keys are stored locally and are never sent to OpenAI** — only the fetched response sample is. If a widget needs a key you haven't saved, it shows an "Add key" button that opens the manager pre-filled.

### Host permissions

The manifest lists only the specific keyless APIs the client calls directly (ESPN, Yahoo, Google News, Open-Meteo) plus your backend domain — no `https://*/*`. The "type anything → any API" agent fetches through the backend's SSRF-guarded `/fetch` endpoint, so the extension never needs broad host access. After deploying, replace the `smart-homepage-api.YOUR-SUBDOMAIN.workers.dev` entry in `public/manifest.json` with your real Worker domain.

## Settings

The **gear** in the bottom-left opens a settings panel with:

- **Background** — each profile rotates among bundled wallpapers (shipped in `public/backgrounds/`, keyless). It changes on each new tab and via the bottom bar's **Change background**. To use your own photos, drop image files in that folder and list them in `src/services/backgrounds.ts`.
- **Font size** — Small / Medium / Large, applied across the whole dashboard.
- **Time & date** — 12-hour vs 24-hour (military) time, and a time-zone picker (Auto follows your machine; otherwise pick any IANA zone — the clock, greeting, and date all follow it).
- **API keys** — the key manager for gated dynamic-widget sources (see above).

All settings persist in localStorage.

## Development

- `npm run dev` — Vite dev server in a normal browser tab for fast UI iteration
- `npm run watch` — rebuilds `dist/` on save; reload the extension and open a new tab to test for real

## Known limitations

- **NewsAPI free tier**: NewsAPI rejects browser requests from non-localhost origins (HTTP 426), and a `chrome-extension://` origin may trip that server-side check. If news widgets show this error, either upgrade your NewsAPI plan or swap `src/services/fetchers/news.ts` to a browser-friendly provider like [GNews](https://gnews.io) — the fetcher abstraction makes it a one-file change.
- **Alpha Vantage free tier** is 25 requests/day; the 10-minute cache mitigates this but heavy use of many stock widgets will still hit the cap.
- ESPN's site API is unofficial and its response shapes can change without notice; sports widgets degrade to an error state with a retry button if parsing fails.
