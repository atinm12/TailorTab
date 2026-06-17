// The deployed Cloudflare Worker that holds the OpenAI key and proxies the AI
// calls + the agent's data fetches. Set this after `npm run deploy` in /server
// (or use "http://localhost:8787" while running `wrangler dev`).
export const BACKEND_URL = "https://smart-homepage-api.tailortab.workers.dev";

const DEVICE_KEY = "smart-homepage.deviceId.v1";

/** Stable anonymous id used for per-device rate limiting on the backend. */
export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function backendHeaders(): Record<string, string> {
  return { "Content-Type": "application/json", "X-Device-Id": getDeviceId() };
}
