// Opt-in broad host access for the open-ended agent. The extension installs with
// only narrow host permissions; the user grants "all sites" via a one-click prompt
// the first time they use an any-source widget. Granted permission persists.
const AGENT_ORIGINS = ["https://*/*"];

function api(): typeof chrome.permissions | null {
  return typeof chrome !== "undefined" && chrome.permissions ? chrome.permissions : null;
}

/** True if the agent may fetch arbitrary hosts. In a non-extension context
 *  (e.g. the Vite dev preview) there's nothing to gate, so treat it as granted. */
export async function hasAgentPermission(): Promise<boolean> {
  const p = api();
  if (!p) return true;
  try {
    return await p.contains({ origins: AGENT_ORIGINS });
  } catch {
    return false;
  }
}

/** Must be called from a user gesture (e.g. a click handler). Shows Chrome's
 *  native permission dialog and resolves to whether the user granted it. */
export async function requestAgentPermission(): Promise<boolean> {
  const p = api();
  if (!p) return true;
  try {
    return await p.request({ origins: AGENT_ORIGINS });
  } catch {
    return false;
  }
}
