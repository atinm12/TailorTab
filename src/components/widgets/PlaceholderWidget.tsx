export function PlaceholderWidget({ prompt, reason }: { prompt: string; reason?: string }) {
  const isFailure = !!reason;
  return (
    <div className="placeholder-widget">
      <span className="placeholder-badge">{isFailure ? "Something went wrong" : "Coming soon"}</span>
      <p className="widget-muted">
        {isFailure
          ? reason
          : `“${prompt}” couldn’t be matched to a widget or a public API. Try rephrasing it as a request for data, e.g. “price of bitcoin” or “weather in Austin”.`}
      </p>
    </div>
  );
}
