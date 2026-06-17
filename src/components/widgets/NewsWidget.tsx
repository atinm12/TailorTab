import type { NewsData } from "../../types/widget";
import { formatRelativeDate } from "../../utils/formatDate";

export function NewsWidget({ data }: { data: NewsData }) {
  if (data.articles.length === 0) {
    return <p className="widget-muted">No recent articles found.</p>;
  }
  return (
    <ul className="news-list">
      {data.articles.map((a) => {
        const when = a.publishedAt ? formatRelativeDate(a.publishedAt) : null;
        return (
          <li key={a.url} className="news-item">
            <a href={a.url} target="_blank" rel="noreferrer" className="news-link">
              {a.title}
            </a>
            <span className="news-meta">
              {a.source}
              {when && ` · ${when}`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
