import { useWidgetData } from "../hooks/useWidgetData";
import { requestAgentPermission } from "../permissions";
import type { ApiKeys } from "../storage/apiKeyStorage";
import type { GenericMapping, WidgetConfig } from "../types/widget";
import { searchLinkFor } from "../utils/searchLink";
import { GenericWidget } from "./widgets/GenericWidget";
import { NewsWidget } from "./widgets/NewsWidget";
import { PlaceholderWidget } from "./widgets/PlaceholderWidget";
import { SportsWidget } from "./widgets/SportsWidget";
import { StockWidget } from "./widgets/StockWidget";
import { WatchlistWidget } from "./widgets/WatchlistWidget";
import { WeatherWidget } from "./widgets/WeatherWidget";

interface Props {
  config: WidgetConfig;
  apiKeys: ApiKeys;
  onRemove: (id: string) => void;
  onMappingResolved: (id: string, mapping: GenericMapping) => void;
  onUpdateParams: (id: string, patch: Record<string, unknown>) => void;
  onOpenSettings: (prefillName?: string) => void;
}

const TYPE_LABELS: Record<WidgetConfig["type"], string> = {
  news: "News",
  stocks: "Stocks",
  watchlist: "Watchlist",
  sports: "Sports",
  weather: "Weather",
  generic: "Live data",
  unsupported: "Coming soon",
};

function Skeleton() {
  return (
    <div className="skeleton" aria-label="Loading">
      <div className="skeleton-line w-60" />
      <div className="skeleton-line w-90" />
      <div className="skeleton-line w-75" />
    </div>
  );
}

export function WidgetCard({
  config,
  apiKeys,
  onRemove,
  onMappingResolved,
  onUpdateParams,
  onOpenSettings,
}: Props) {
  const state = useWidgetData(config, {
    apiKeys,
    onMappingResolved: (mapping) => onMappingResolved(config.id, mapping),
  });

  let body;
  if (config.type === "unsupported") {
    body = <PlaceholderWidget prompt={config.params.originalPrompt} reason={config.params.reason} />;
  } else if (state.status === "loading") {
    body = <Skeleton />;
  } else if (state.status === "error") {
    body = (
      <div className="widget-error">
        <p>{state.message}</p>
        {state.needsPermission ? (
          <button
            className="retry-btn"
            onClick={() => {
              // Called within the click (user gesture) so Chrome's prompt is allowed.
              requestAgentPermission().then((granted) => {
                if (granted) state.retry();
              });
            }}
          >
            Enable any-source widgets
          </button>
        ) : state.keyName ? (
          <button className="retry-btn" onClick={() => onOpenSettings(state.keyName)}>
            Add “{state.keyName}” key
          </button>
        ) : (
          <button className="retry-btn" onClick={state.retry}>
            Retry
          </button>
        )}
      </div>
    );
  } else {
    const data = state.data;
    switch (data.kind) {
      case "news":
        body = <NewsWidget data={data} />;
        break;
      case "stocks":
        body = <StockWidget data={data} />;
        break;
      case "watchlist":
        body = (
          <WatchlistWidget
            data={data}
            config={config as Extract<WidgetConfig, { type: "watchlist" }>}
            onUpdateParams={onUpdateParams}
          />
        );
        break;
      case "sports":
        body = <SportsWidget data={data} />;
        break;
      case "weather":
        body = <WeatherWidget data={data} />;
        break;
      case "generic":
        body = <GenericWidget data={data} />;
        break;
    }
  }

  const typeLabel =
    config.type === "generic" && config.params.sourceName
      ? config.params.sourceName
      : TYPE_LABELS[config.type];

  return (
    <section className={`widget-card widget-${config.type}`}>
      <div className="widget-header">
        <span className="widget-type">{typeLabel}</span>
        <h2 className="widget-title">{config.title}</h2>
        <button
          className="widget-delete"
          onClick={() => onRemove(config.id)}
          aria-label={`Delete ${config.title} widget`}
          title="Delete widget"
        >
          ×
        </button>
      </div>
      <div className="widget-body">{body}</div>
      {(config.type === "unsupported" || state.status !== "loading") && (
        <a
          className="widget-more"
          href={searchLinkFor(config).url}
          target="_blank"
          rel="noreferrer"
        >
          {searchLinkFor(config).label} <span aria-hidden>›</span>
        </a>
      )}
    </section>
  );
}
