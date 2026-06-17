import { hasAgentPermission } from "../../permissions";
import type { ApiKeys } from "../../storage/apiKeyStorage";
import type { GenericData, GenericMapping, GenericParams } from "../../types/widget";
import { getPath, getPathString } from "../../utils/getPath";
import { deriveMapping } from "../widgetMapper";

/** Thrown when a generic widget needs a saved API key that isn't present. */
export class KeyMissingError extends Error {
  constructor(public keyName: string) {
    super(`Needs an API key named "${keyName}"`);
    this.name = "KeyMissingError";
  }
}

/** Thrown when the user hasn't yet granted the broad host permission the agent needs. */
export class PermissionNeededError extends Error {
  constructor() {
    super("This widget needs permission to fetch from any site.");
    this.name = "PermissionNeededError";
  }
}

export interface GenericFetchOptions {
  signal?: AbortSignal;
  apiKeys?: ApiKeys;
  /** Called once when the first fetch resolves a mapping, so it can be persisted. */
  persistMapping?: (mapping: GenericMapping) => void;
}

function substitute(text: string, keys: ApiKeys): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => keys[name] ?? `{{${name}}}`);
}

function applyMapping(raw: unknown, mapping: GenericMapping): GenericData {
  const rows = (mapping.rows ?? []).map((r) => ({
    label: r.label,
    value: getPathString(raw, r.path),
  }));

  const items: GenericData["items"] = [];
  if (mapping.list) {
    const arr = getPath(raw, mapping.list.path);
    if (Array.isArray(arr)) {
      for (const el of arr.slice(0, 6)) {
        const title = getPathString(el, mapping.list.titlePath);
        if (!title) continue;
        items.push({
          title,
          subtitle: mapping.list.subtitlePath
            ? getPathString(el, mapping.list.subtitlePath)
            : undefined,
          url: mapping.list.urlPath ? getPathString(el, mapping.list.urlPath) || undefined : undefined,
        });
      }
    }
  }
  return { kind: "generic", rows, items };
}

export async function fetchGeneric(
  params: GenericParams,
  contextLabel: string,
  opts: GenericFetchOptions = {},
): Promise<GenericData> {
  const { request } = params;
  const keys = opts.apiKeys ?? {};

  if (request.needsKey && !keys[request.needsKey]) {
    throw new KeyMissingError(request.needsKey);
  }
  // The agent fetches arbitrary public APIs straight from the user's browser
  // (their IP, no datacenter blocks). That needs the opt-in "all sites" grant.
  if (!(await hasAgentPermission())) {
    throw new PermissionNeededError();
  }

  // Substitute any user-saved keys into the URL/headers, then fetch directly.
  const url = substitute(request.url, keys);
  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(request.headers ?? {})) {
    headers[k] = substitute(v, keys);
  }

  const res = await fetch(url, {
    method: request.method ?? "GET",
    headers,
    signal: opts.signal,
  });
  if (!res.ok) throw new Error(`Source returned ${res.status}`);
  const raw: unknown = await res.json();

  // Resolve the extraction mapping once, then persist it so future refreshes
  // are deterministic and don't call the LLM again.
  let mapping = params.mapping;
  if (!mapping) {
    mapping = await deriveMapping(contextLabel, raw);
    opts.persistMapping?.(mapping);
  }
  return applyMapping(raw, mapping);
}
