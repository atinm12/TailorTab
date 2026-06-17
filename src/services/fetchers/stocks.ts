import type {
  StockData,
  StockParams,
  StockQuote,
  StockRange,
  WatchlistData,
  WatchlistParams,
} from "../../types/widget";

// Yahoo Finance's public chart endpoint: keyless, returns intraday data plus
// the current price and previous close in a single call per symbol. (Alpha
// Vantage moved intraday behind a paywall and caps the free tier at 25/day.)
const RANGE_CONFIG: Record<StockRange, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "1W": { range: "5d", interval: "30m" },
  "1M": { range: "1mo", interval: "1d" },
};

interface YahooChartResponse {
  chart?: {
    result?: {
      meta?: { regularMarketPrice?: number; chartPreviousClose?: number };
      indicators?: { quote?: { close?: (number | null)[] }[] };
    }[];
    error?: { description?: string } | null;
  };
}

interface ParsedSeries {
  points: number[];
  price: number;
  previousClose: number;
}

async function fetchSeries(
  symbol: string,
  range: StockRange,
  signal?: AbortSignal,
): Promise<ParsedSeries> {
  const cfg = RANGE_CONFIG[range];
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?range=${cfg.range}&interval=${cfg.interval}`;

  const res = await fetch(url, { signal });
  if (!res.ok) {
    if (res.status === 404) throw new Error(`Unknown ticker "${symbol}"`);
    throw new Error(`Request failed (${res.status})`);
  }
  const json = (await res.json()) as YahooChartResponse;

  const result = json.chart?.result?.[0];
  if (json.chart?.error || !result) {
    throw new Error(json.chart?.error?.description || `Unknown ticker "${symbol}"`);
  }

  const points = (result.indicators?.quote?.[0]?.close ?? []).filter(
    (c): c is number => typeof c === "number",
  );
  if (points.length === 0) throw new Error(`No data for "${symbol}"`);

  const price = result.meta?.regularMarketPrice ?? points[points.length - 1];
  const previousClose = result.meta?.chartPreviousClose ?? points[0];
  return { points, price, previousClose };
}

/** Normalize legacy single-symbol configs into the multi-symbol shape. */
function normalizeParams(params: StockParams): { symbols: string[]; range: StockRange } {
  const legacy = params as StockParams & { symbol?: string };
  const symbols =
    params.symbols && params.symbols.length > 0
      ? params.symbols
      : legacy.symbol
        ? [legacy.symbol]
        : [];
  return { symbols, range: params.range ?? "1D" };
}

export async function fetchStock(params: StockParams, signal?: AbortSignal): Promise<StockData> {
  const { symbols, range } = normalizeParams(params);
  if (symbols.length === 0) throw new Error("No ticker symbols specified");

  const results = await Promise.all(
    symbols.map(async (symbol): Promise<StockQuote> => {
      try {
        const { points, price, previousClose } = await fetchSeries(symbol, range, signal);
        // 1D change is vs the previous close (matches brokerage displays);
        // longer ranges are vs the first point in the window.
        const baseline = range === "1D" ? previousClose : points[0];
        const change = price - baseline;
        return {
          symbol,
          price,
          change,
          changePercent: baseline ? (change / baseline) * 100 : 0,
          points,
        };
      } catch (err) {
        return { symbol, points: [], error: err instanceof Error ? err.message : "Failed" };
      }
    }),
  );

  // Only fail the whole widget if every symbol failed.
  if (results.every((q) => q.error)) {
    throw new Error(results[0].error ?? "No quote data");
  }

  return {
    kind: "stocks",
    range,
    quotes: results,
    latestTradingDay: new Date().toISOString().slice(0, 10),
  };
}

/** Watchlist reuses the stock fetch (daily movement = 1D change vs prev close). */
export async function fetchWatchlist(
  params: WatchlistParams,
  signal?: AbortSignal,
): Promise<WatchlistData> {
  if (params.symbols.length === 0) return { kind: "watchlist", quotes: [] };
  const data = await fetchStock({ symbols: params.symbols, range: "1D" }, signal);
  return { kind: "watchlist", quotes: data.quotes };
}
