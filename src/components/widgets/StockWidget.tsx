import type { StockData, StockQuote } from "../../types/widget";
import { formatRelativeDate } from "../../utils/formatDate";
import { Sparkline } from "../Sparkline";

const RANGE_LABELS: Record<StockData["range"], string> = {
  "1D": "Today",
  "1W": "Past week",
  "1M": "Past month",
};

// Friendly labels for index symbols (Yahoo uses caret tickers like ^GSPC).
const INDEX_NAMES: Record<string, string> = {
  "^GSPC": "S&P 500",
  "^DJI": "Dow Jones",
  "^IXIC": "Nasdaq",
  "^RUT": "Russell 2000",
  "^VIX": "VIX",
};

function displayName(symbol: string): string {
  return INDEX_NAMES[symbol] ?? symbol;
}

function fmtNumber(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Indices are point levels, not dollars — drop the "$" for caret tickers. */
function fmtValue(symbol: string, n: number): string {
  return symbol.startsWith("^") ? fmtNumber(n) : `$${fmtNumber(n)}`;
}

function ChangePill({ change, percent }: { change: number; percent: number }) {
  const up = change >= 0;
  return (
    <span className={`stock-change ${up ? "up" : "down"}`}>
      {up ? "▲" : "▼"} {Math.abs(change).toFixed(2)} ({Math.abs(percent).toFixed(2)}%)
    </span>
  );
}

/** Single-symbol widget: big price + a full-width chart. */
function SingleStock({ quote }: { quote: StockQuote }) {
  if (quote.error || quote.price === undefined) {
    return <p className="stock-row-error">{displayName(quote.symbol)}: {quote.error ?? "No data"}</p>;
  }
  const up = (quote.change ?? 0) >= 0;
  return (
    <div className="stock-single">
      <div className="stock-price-row">
        <span className="stock-price">{fmtValue(quote.symbol, quote.price)}</span>
        <ChangePill change={quote.change ?? 0} percent={quote.changePercent ?? 0} />
      </div>
      <Sparkline points={quote.points} up={up} height={88} />
    </div>
  );
}

/** Multi-symbol widget: one compact row per ticker with a mini chart. */
function StockRow({ quote }: { quote: StockQuote }) {
  if (quote.error || quote.price === undefined) {
    return (
      <li className="stock-row">
        <span className="stock-row-symbol">{displayName(quote.symbol)}</span>
        <span className="stock-row-error">{quote.error ?? "No data"}</span>
      </li>
    );
  }
  const up = (quote.change ?? 0) >= 0;
  return (
    <li className="stock-row">
      <span className="stock-row-symbol">{displayName(quote.symbol)}</span>
      <span className="stock-row-spark">
        <Sparkline points={quote.points} up={up} width={120} height={36} />
      </span>
      <span className="stock-row-figures">
        <span className="stock-row-price">{fmtValue(quote.symbol, quote.price)}</span>
        <span className={`stock-row-change ${up ? "up" : "down"}`}>
          {up ? "▲" : "▼"} {Math.abs(quote.changePercent ?? 0).toFixed(2)}%
        </span>
      </span>
    </li>
  );
}

export function StockWidget({ data }: { data: StockData }) {
  const quotes = data.quotes ?? [];
  if (quotes.length === 0) {
    return <p className="widget-muted">No quote data available.</p>;
  }
  const single = quotes.length === 1;
  return (
    <div className="stock-widget">
      {single ? (
        <SingleStock quote={quotes[0]} />
      ) : (
        <ul className="stock-list">
          {quotes.map((q) => (
            <StockRow key={q.symbol} quote={q} />
          ))}
        </ul>
      )}
      <p className="widget-muted stock-footnote">
        {RANGE_LABELS[data.range]}
        {data.latestTradingDay && ` · as of ${formatRelativeDate(data.latestTradingDay) ?? data.latestTradingDay}`}
      </p>
    </div>
  );
}
