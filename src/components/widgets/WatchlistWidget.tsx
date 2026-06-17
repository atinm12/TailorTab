import { useState, type FormEvent } from "react";
import type { WatchlistData, WatchlistParams, WidgetConfig } from "../../types/widget";

interface Props {
  data: WatchlistData;
  config: Extract<WidgetConfig, { type: "watchlist" }>;
  onUpdateParams: (id: string, patch: Partial<WatchlistParams>) => void;
}

function newsUrl(symbol: string): string {
  return `https://news.google.com/search?q=${encodeURIComponent(`${symbol} stock`)}`;
}

function fmtPrice(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function WatchlistWidget({ data, config, onUpdateParams }: Props) {
  const [input, setInput] = useState("");
  const symbols = config.params.symbols;

  function addSymbol(e: FormEvent) {
    e.preventDefault();
    const sym = input.trim().toUpperCase();
    if (!sym || symbols.includes(sym)) {
      setInput("");
      return;
    }
    onUpdateParams(config.id, { symbols: [...symbols, sym] });
    setInput("");
  }

  function removeSymbol(sym: string) {
    onUpdateParams(config.id, { symbols: symbols.filter((s) => s !== sym) });
  }

  // Render in the user's configured order; pair each symbol with its quote.
  const quoteFor = (sym: string) => data.quotes.find((q) => q.symbol === sym);

  return (
    <div className="watchlist">
      {symbols.length === 0 ? (
        <p className="widget-muted">Add a ticker below to start tracking.</p>
      ) : (
        <ul className="watchlist-list">
          {symbols.map((sym) => {
            const q = quoteFor(sym);
            const up = (q?.change ?? 0) >= 0;
            return (
              <li key={sym} className="watchlist-row">
                <a
                  className="watchlist-link"
                  href={newsUrl(sym)}
                  target="_blank"
                  rel="noreferrer"
                  title={`See ${sym} news`}
                >
                  <span className="watchlist-symbol">{sym}</span>
                  <span className="watchlist-hint">See news ›</span>
                  {q && !q.error && q.price !== undefined ? (
                    <span className="watchlist-figures">
                      <span className="watchlist-price">{fmtPrice(q.price)}</span>
                      <span className={`watchlist-change ${up ? "up" : "down"}`}>
                        {up ? "▲" : "▼"} {Math.abs(q.changePercent ?? 0).toFixed(2)}%
                      </span>
                    </span>
                  ) : (
                    <span className="watchlist-figures watchlist-na">
                      {q?.error ? "—" : "…"}
                    </span>
                  )}
                </a>
                <button
                  className="watchlist-remove"
                  onClick={() => removeSymbol(sym)}
                  aria-label={`Remove ${sym}`}
                  title={`Remove ${sym}`}
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <form className="watchlist-add" onSubmit={addSymbol}>
        <input
          className="watchlist-input"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          placeholder="Add ticker… e.g. NVDA"
          aria-label="Add a ticker"
        />
        <button className="watchlist-add-btn" type="submit" disabled={!input.trim()}>
          Add
        </button>
      </form>
    </div>
  );
}
