import { useCallback, useEffect, useRef, useState } from "react";
import { fetchWidgetData } from "../services/fetchWidgetData";
import { KeyMissingError, PermissionNeededError } from "../services/fetchers/generic";
import type { ApiKeys } from "../storage/apiKeyStorage";
import type { GenericMapping, WidgetConfig, WidgetData } from "../types/widget";

export type WidgetState =
  | { status: "loading" }
  | { status: "success"; data: WidgetData }
  | { status: "error"; message: string; keyName?: string; needsPermission?: boolean };

// Short-lived cache so rapid new-tab opens feel instant and we don't burn
// through rate-limited free tiers (e.g. Alpha Vantage's 25 requests/day).
const CACHE_PREFIX = "smart-homepage.cache.v2.";
const CACHE_TTL_MS = 10 * 60 * 1000;

function cacheKey(config: WidgetConfig): string {
  // Keyed by id + a signature of params, EXCLUDING the generic `mapping` field.
  // This way an editable widget (e.g. watchlist symbols) busts the cache and
  // refetches when params change, while a generic widget's `mapping` write-back
  // — which mutates params but not the data — does not.
  const { mapping: _mapping, ...rest } = config.params as unknown as Record<string, unknown>;
  return `${CACHE_PREFIX}${config.id}:${JSON.stringify(rest)}`;
}

function readCache(config: WidgetConfig): WidgetData | null {
  try {
    const raw = localStorage.getItem(cacheKey(config));
    if (!raw) return null;
    const { at, data } = JSON.parse(raw);
    if (typeof at !== "number" || Date.now() - at > CACHE_TTL_MS) return null;
    return data as WidgetData;
  } catch {
    return null;
  }
}

function writeCache(config: WidgetConfig, data: WidgetData): void {
  try {
    localStorage.setItem(cacheKey(config), JSON.stringify({ at: Date.now(), data }));
  } catch {
    // cache is best-effort; ignore quota errors
  }
}

export interface UseWidgetDataOptions {
  apiKeys?: ApiKeys;
  /** Called once when a generic widget resolves its extraction mapping. */
  onMappingResolved?: (mapping: GenericMapping) => void;
}

export function useWidgetData(
  config: WidgetConfig,
  options: UseWidgetDataOptions = {},
): WidgetState & { retry: () => void } {
  const [state, setState] = useState<WidgetState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const { apiKeys } = options;

  // Keep the latest mapping callback in a ref so it doesn't need to be a
  // useEffect dependency (avoids re-fetch churn from changing identities).
  const onMappingResolved = useRef(options.onMappingResolved);
  onMappingResolved.current = options.onMappingResolved;

  const retry = useCallback(() => {
    try {
      localStorage.removeItem(cacheKey(config));
    } catch {
      /* ignore */
    }
    setAttempt((n) => n + 1);
  }, [config]);

  useEffect(() => {
    if (config.type === "unsupported") return;

    const cached = readCache(config);
    if (cached) {
      setState({ status: "success", data: cached });
      return;
    }

    const controller = new AbortController();
    setState({ status: "loading" });
    fetchWidgetData(config, {
      signal: controller.signal,
      apiKeys,
      persistMapping: (mapping) => onMappingResolved.current?.(mapping),
    })
      .then((data) => {
        writeCache(config, data);
        setState({ status: "success", data });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        let errorMessage: string;
        let keyName: string | undefined;
        let needsPermission = false;
        if (err instanceof KeyMissingError) {
          keyName = err.keyName;
          errorMessage = `Missing API key: ${err.keyName}`;
          setState({
            status: "error",
            message: `This source needs an API key named “${err.keyName}”.`,
            keyName: err.keyName,
          });
        } else if (err instanceof PermissionNeededError) {
          needsPermission = true;
          errorMessage = "Permission needed";
          setState({
            status: "error",
            message: "Any-source widgets need permission to fetch from websites.",
            needsPermission: true,
          });
        } else {
          errorMessage = err instanceof Error ? err.message : "Something went wrong";
          setState({ status: "error", message: errorMessage });
        }
        if (typeof pendo !== "undefined") {
          pendo.track("widget_data_fetch_failed", {
            widgetType: config.type,
            widgetId: config.id,
            widgetTitle: config.title,
            errorMessage: errorMessage.slice(0, 200),
            needsApiKey: !!keyName,
            keyName: keyName ?? "",
            needsPermission,
          });
        }
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, attempt, apiKeys]);

  return { ...state, retry };
}
