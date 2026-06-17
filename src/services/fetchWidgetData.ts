import type { ApiKeys } from "../storage/apiKeyStorage";
import type { GenericMapping, WidgetConfig, WidgetData } from "../types/widget";
import { fetchGeneric } from "./fetchers/generic";
import { fetchNews } from "./fetchers/news";
import { fetchSports } from "./fetchers/sports";
import { fetchStock, fetchWatchlist } from "./fetchers/stocks";
import { fetchWeather } from "./fetchers/weather";

export interface FetchOptions {
  signal?: AbortSignal;
  /** Saved keys for generic widgets; ignored by the specialized fetchers. */
  apiKeys?: ApiKeys;
  /** Called when a generic widget resolves its mapping for the first time. */
  persistMapping?: (mapping: GenericMapping) => void;
}

export async function fetchWidgetData(
  config: WidgetConfig,
  opts: FetchOptions = {},
): Promise<WidgetData> {
  switch (config.type) {
    case "news":
      return fetchNews(config.params, opts.signal);
    case "stocks":
      return fetchStock(config.params, opts.signal);
    case "watchlist":
      return fetchWatchlist(config.params, opts.signal);
    case "sports":
      return fetchSports(config.params, opts.signal);
    case "weather":
      return fetchWeather(config.params, opts.signal);
    case "generic":
      return fetchGeneric(config.params, config.title, {
        signal: opts.signal,
        apiKeys: opts.apiKeys,
        persistMapping: opts.persistMapping,
      });
    case "unsupported":
      throw new Error("Unsupported widget type has no data to fetch");
  }
}
