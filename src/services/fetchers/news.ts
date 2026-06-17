import type { NewsData, NewsParams } from "../../types/widget";

// Google News RSS — keyless, works from the extension (host_permissions bypass
// CORS), and unlike NewsAPI's free tier it doesn't reject extension origins.
export async function fetchNews(params: NewsParams, signal?: AbortSignal): Promise<NewsData> {
  const url =
    `https://news.google.com/rss/search?q=${encodeURIComponent(params.query)}` +
    `&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`News request failed (${res.status})`);

  const xml = await res.text();
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  if (doc.querySelector("parsererror")) throw new Error("Couldn't parse news feed");

  const items = [...doc.querySelectorAll("item")].slice(0, 6).map((item) => {
    const rawTitle = item.querySelector("title")?.textContent ?? "";
    const source = item.querySelector("source")?.textContent ?? "";
    // Google News titles end with " - <Source>"; strip it since we show source separately.
    const title =
      source && rawTitle.endsWith(` - ${source}`)
        ? rawTitle.slice(0, -(source.length + 3))
        : rawTitle;
    const pubDate = item.querySelector("pubDate")?.textContent ?? "";
    const parsed = pubDate ? new Date(pubDate) : null;
    return {
      title,
      url: item.querySelector("link")?.textContent ?? "#",
      source,
      publishedAt: parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : "",
    };
  });

  return { kind: "news", articles: items.filter((a) => a.title) };
}
