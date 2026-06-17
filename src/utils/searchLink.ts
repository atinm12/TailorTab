import type { WidgetConfig } from "../types/widget";

export interface SearchLink {
  label: string;
  url: string;
}

function google(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/** Build the "see more on Google" footer link for a widget. */
export function searchLinkFor(config: WidgetConfig): SearchLink {
  switch (config.type) {
    case "news":
      return { label: "More news", url: google(`${config.params.query} news`) };
    case "stocks": {
      const symbols = config.params.symbols ?? [];
      const single = symbols.length === 1;
      // Index symbols are caret tickers (^GSPC etc.) — call them "markets".
      const allIndices = symbols.length > 0 && symbols.every((s) => s.startsWith("^"));
      if (allIndices) {
        return {
          label: single ? "More on this market" : "More on these markets",
          url: google("stock market today"),
        };
      }
      return {
        label: single ? "More on this stock" : "More on these stocks",
        url: google(`${symbols.join(" ") || config.title} stock price`),
      };
    }
    case "sports": {
      const query =
        config.params.mode === "team" ? `${config.title} schedule` : `${config.title} matches`;
      return { label: "More matches", url: google(query) };
    }
    case "weather": {
      const city = config.params.location.split(",")[0];
      return { label: "Full forecast", url: google(`weather in ${city}`) };
    }
    case "watchlist":
      return { label: "Market news", url: "https://news.google.com/search?q=stock%20market" };
    case "generic":
      return { label: "More results", url: google(config.title) };
    case "unsupported":
      return { label: "Search Google instead", url: google(config.params.originalPrompt) };
  }
}
