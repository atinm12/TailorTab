/**
 * Novus (Pendo) analytics initialization.
 *
 * TailorTab has no user accounts, so visitors are identified by the
 * anonymous device UUID that already lives in localStorage for rate-limiting.
 * This means every install becomes a unique, persistent anonymous visitor.
 */

const DEVICE_ID_KEY = "smart-homepage.deviceId.v1";

/** Returns the existing device UUID, or creates and persists one on first run. */
function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function initializePendo(): void {
  // Novus integration key for TailorTab (subscription 6638578690097152, app -323232).
  const INTEGRATION_KEY = "6638578690097152";

  // Standard Pendo loader snippet — queues calls made before the agent script loads.
  /* eslint-disable */
  (function (p: any, e: Document, n: string, d: string) {
    let v: string[], w: number, x: number, o: any, y: HTMLScriptElement, z: Element;
    o = p[d] = p[d] || {};
    o._q = o._q || [];
    v = ["initialize", "identify", "updateOptions", "pageLoad", "track"];
    for (w = 0, x = v.length; w < x; ++w) {
      (function (m: string) {
        o[m] =
          o[m] ||
          function (...args: unknown[]) {
            o._q[m === v[0] ? "unshift" : "push"]([m, ...args]);
          };
      })(v[w]);
    }
    y = e.createElement(n) as HTMLScriptElement;
    y.async = true;
    y.src = "https://cdn.pendo.io/agent/static/" + INTEGRATION_KEY + "/pendo.js";
    z = e.getElementsByTagName(n)[0];
    z.parentNode?.insertBefore(y, z);
  })(window, document, "script", "pendo");
  /* eslint-enable */

  // Initialize with the anonymous visitor ID.
  // No account ID — TailorTab is single-user, no org concept.
  (window as any).pendo.initialize({
    visitor: {
      id: getDeviceId(),
    },
    account: {
      id: "tailortab-extension",
    },
  });
}
