import { BACKEND_URL, backendHeaders } from "../backend";
import type { GenericMapping } from "../types/widget";

/** Truncate a JSON sample so we don't blow the token budget on large responses. */
function sampleOf(raw: unknown, maxChars = 4000): string {
  let text: string;
  try {
    text = JSON.stringify(raw);
  } catch {
    text = String(raw);
  }
  return text.length > maxChars ? text.slice(0, maxChars) + "…(truncated)" : text;
}

/**
 * Ask the backend how to extract widget data from an arbitrary API response.
 * Throws on failure so the caller can surface an error (a mapping is required
 * before a generic widget can render).
 */
export async function deriveMapping(prompt: string, rawResponse: unknown): Promise<GenericMapping> {
  const res = await fetch(`${BACKEND_URL}/shape`, {
    method: "POST",
    headers: backendHeaders(),
    body: JSON.stringify({ prompt, sample: sampleOf(rawResponse) }),
  });
  const data = (await res.json()) as (GenericMapping & { list?: unknown; error?: string });
  if (!res.ok) throw new Error(data.error || `Mapping request failed (${res.status})`);

  const mapping: GenericMapping = {};
  if (Array.isArray(data.rows)) {
    mapping.rows = data.rows.filter(
      (r) => r && typeof r.label === "string" && typeof r.path === "string",
    );
  }
  const list = data.list as GenericMapping["list"] | null | undefined;
  if (list && typeof list.path === "string" && typeof list.titlePath === "string") {
    mapping.list = list;
  }
  if (!mapping.rows?.length && !mapping.list) {
    throw new Error("No displayable fields found in this response");
  }
  return mapping;
}
