export interface NewsParams {
  query: string;
}

export type StockRange = "1D" | "1W" | "1M";

export interface StockParams {
  /** One or more ticker symbols, e.g. ["AAPL", "TSLA"]. */
  symbols: string[];
  /** Chart timeframe; defaults to "1D" when the prompt doesn't specify one. */
  range: StockRange;
}

export interface WatchlistParams {
  /** User-editable list of tickers to track, e.g. ["AAPL", "TSLA"]. */
  symbols: string[];
}

export interface WeatherParams {
  /** "City" or "City,CountryCode", e.g. "Austin,US" */
  location: string;
}

export interface SportsParams {
  /** ESPN API path segment, e.g. "football", "basketball" */
  sport: string;
  /** ESPN league segment, e.g. "nfl", "nba", "eng.1" */
  league: string;
  /** ESPN team abbreviation, e.g. "pit"; absent for league scoreboards */
  team?: string;
  mode: "team" | "scoreboard";
}

export interface UnsupportedParams {
  originalPrompt: string;
  /** Why this prompt ended up unsupported (e.g. a parsing/API failure), if known. */
  reason?: string;
}

/** A planned HTTP request for a dynamically-sourced (generic) widget. */
export interface GenericRequest {
  url: string;
  method?: "GET";
  /** Header values may contain {{KEY_NAME}} placeholders resolved from the key store. */
  headers?: Record<string, string>;
  /** Name of a saved API key this source requires, if any. */
  needsKey?: string;
}

/** How to extract display data out of an arbitrary JSON response. Paths are
 *  dot/bracket paths into the response, e.g. "bitcoin.usd" or "items[0].name". */
export interface GenericMapping {
  rows?: { label: string; path: string }[];
  list?: {
    /** Path to an array in the response. */
    path: string;
    titlePath: string;
    subtitlePath?: string;
    urlPath?: string;
  };
}

export interface GenericParams {
  /** Human label for the data source, e.g. "CoinGecko". */
  sourceName?: string;
  request: GenericRequest;
  /** Null until the first successful fetch resolves it; then persisted. */
  mapping: GenericMapping | null;
}

interface Base {
  id: string;
  title: string;
  createdAt: number;
}

export type WidgetConfig =
  | (Base & { type: "news"; params: NewsParams })
  | (Base & { type: "stocks"; params: StockParams })
  | (Base & { type: "watchlist"; params: WatchlistParams })
  | (Base & { type: "sports"; params: SportsParams })
  | (Base & { type: "weather"; params: WeatherParams })
  | (Base & { type: "generic"; params: GenericParams })
  | (Base & { type: "unsupported"; params: UnsupportedParams });

export type WidgetType = WidgetConfig["type"];

// ---- Normalized display data (fetchers map raw API responses into these) ----

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}

export interface NewsData {
  kind: "news";
  articles: NewsArticle[];
}

export interface StockQuote {
  symbol: string;
  price?: number;
  change?: number;
  changePercent?: number;
  /** Closing-price series for the chosen range, oldest → newest. */
  points: number[];
  /** Set when this individual symbol failed (others may still succeed). */
  error?: string;
}

export interface StockData {
  kind: "stocks";
  range: StockRange;
  quotes: StockQuote[];
  latestTradingDay: string;
}

export interface WatchlistData {
  kind: "watchlist";
  quotes: StockQuote[];
}

export interface WeatherData {
  kind: "weather";
  location: string;
  tempF: number;
  description: string;
  /** Weather condition emoji (from the WMO code). */
  emoji: string;
  humidity: number;
  high: number;
  low: number;
}

export interface SportsGame {
  name: string;
  /** e.g. "Final", "Sat 1:00 PM ET", "Q3 5:24" */
  shortDetail: string;
  competitors: {
    name: string;
    score?: string;
    logo?: string;
    winner?: boolean;
  }[];
}

export interface SportsData {
  kind: "sports";
  mode: "team" | "scoreboard";
  teamName?: string;
  record?: string;
  logo?: string;
  games: SportsGame[];
}

export interface GenericData {
  kind: "generic";
  rows: { label: string; value: string }[];
  items: { title: string; subtitle?: string; url?: string }[];
}

export type WidgetData =
  | NewsData
  | StockData
  | WatchlistData
  | WeatherData
  | SportsData
  | GenericData;
