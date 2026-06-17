// NOTE: API keys no longer live in the client.
//
// The OpenAI key is held by the backend (see /server). All other data sources
// are keyless (ESPN, Yahoo Finance, Google News, Open-Meteo). Users can still
// add their own keys for gated agent sources at runtime via the in-app ⚙
// settings — those are stored locally and passed through the backend per-request.
//
// To point the extension at your backend, set BACKEND_URL in src/backend.ts.
export {};
