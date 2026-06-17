import type { GenericData } from "../../types/widget";
import { formatIfDate } from "../../utils/formatDate";

export function GenericWidget({ data }: { data: GenericData }) {
  if (data.rows.length === 0 && data.items.length === 0) {
    return <p className="widget-muted">No data to display.</p>;
  }
  return (
    <div className="generic-widget">
      {data.rows.length > 0 && (
        <dl className="generic-rows">
          {data.rows.map((row, i) => (
            <div key={`${row.label}-${i}`} className="generic-row">
              <dt className="generic-label">{row.label}</dt>
              <dd className="generic-value">{row.value ? formatIfDate(row.value) : "—"}</dd>
            </div>
          ))}
        </dl>
      )}
      {data.items.length > 0 && (
        <ul className="generic-list">
          {data.items.map((item, i) => (
            <li key={`${item.title}-${i}`} className="generic-item">
              {item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer" className="generic-item-title">
                  {item.title}
                </a>
              ) : (
                <span className="generic-item-title">{item.title}</span>
              )}
              {item.subtitle && (
                <span className="generic-item-sub">{formatIfDate(item.subtitle)}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
