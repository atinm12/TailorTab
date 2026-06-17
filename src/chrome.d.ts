// Minimal typings for the Chrome extension APIs we use, so we don't need the
// full @types/chrome dependency. Only the permissions API is referenced.
declare namespace chrome.permissions {
  interface Permissions {
    origins?: string[];
    permissions?: string[];
  }
  function contains(p: Permissions): Promise<boolean>;
  function request(p: Permissions): Promise<boolean>;
  function remove(p: Permissions): Promise<boolean>;
}
