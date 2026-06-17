import type { GenericMapping, WidgetConfig } from "../types/widget";

export type ProfileId =
  | "finance"
  | "athlete"
  | "techie"
  | "minimalist"
  | "entrepreneur"
  | "politician"
  | "newspaper"
  | "local"
  | "custom";

/** A widget config without the runtime-assigned fields. */
export type WidgetSeed = Omit<WidgetConfig, "id" | "createdAt">;

export interface ProfileOptions {
  city?: string;
}

export interface Profile {
  id: ProfileId;
  name: string;
  description: string;
  emoji: string;
  /** Unsplash search theme for the rotating background. */
  backgroundQuery: (opts: ProfileOptions) => string;
  /** When true, selecting this profile asks for a city first. */
  needsCity?: boolean;
  /** The default widgets seeded when this profile is first opened (or reset). */
  widgets: (opts: ProfileOptions) => WidgetSeed[];
}

// ---- widget seed builders ----------------------------------------------------

const news = (title: string, query: string): WidgetSeed => ({ type: "news", title, params: { query } });

const watchlist = (title: string, symbols: string[]): WidgetSeed => ({
  type: "watchlist",
  title,
  params: { symbols },
});

const stocks = (title: string, symbols: string[], range: "1D" | "1W" | "1M" = "1D"): WidgetSeed => ({
  type: "stocks",
  title,
  params: { symbols, range },
});

const scoreboard = (title: string, sport: string, league: string): WidgetSeed => ({
  type: "sports",
  title,
  params: { sport, league, mode: "scoreboard" },
});

const weather = (title: string, location: string): WidgetSeed => ({
  type: "weather",
  title,
  params: { location },
});

const generic = (
  title: string,
  sourceName: string,
  url: string,
  mapping: GenericMapping,
): WidgetSeed => ({
  type: "generic",
  title,
  params: { sourceName, request: { url, method: "GET" }, mapping },
});

// ---- pre-authored generic widgets (mapping known → no GPT shaping needed) ----

function githubTrending(): WidgetSeed {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const url =
    `https://api.github.com/search/repositories?q=created:>${since}` +
    `&sort=stars&order=desc&per_page=6`;
  return generic("GitHub Trending", "GitHub", url, {
    rows: [],
    list: { path: "items", titlePath: "full_name", subtitlePath: "description", urlPath: "html_url" },
  });
}

const dailyQuote = (): WidgetSeed =>
  generic("Daily Quote", "ZenQuotes", "https://zenquotes.io/api/today", {
    rows: [
      { label: "", path: "0.q" },
      { label: "—", path: "0.a" },
    ],
    list: undefined,
  });

const fxIndicators = (): WidgetSeed =>
  generic(
    "Economic Indicators",
    "Frankfurter",
    "https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR,GBP,JPY,CNY",
    {
      rows: [
        { label: "USD → EUR", path: "rates.EUR" },
        { label: "USD → GBP", path: "rates.GBP" },
        { label: "USD → JPY", path: "rates.JPY" },
        { label: "USD → CNY", path: "rates.CNY" },
      ],
      list: undefined,
    },
  );

/** Pick a random element — used to rotate among each profile's background themes. */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Best-effort default city for weather, derived from the browser's time zone. */
export function defaultCity(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; // e.g. "America/New_York"
    const last = tz.split("/").pop();
    if (last) return last.replace(/_/g, " ");
  } catch {
    /* ignore */
  }
  return "New York";
}

// ---- the profile registry ----------------------------------------------------

export const PROFILES: Profile[] = [
  {
    id: "finance",
    name: "Finance Bro",
    description: "Markets, corporate & investment finance",
    emoji: "💼",
    backgroundQuery: () =>
      pick([
        "wall street financial district",
        "new york stock exchange",
        "city skyline skyscrapers dusk",
        "trading floor finance",
        "bull market chart abstract",
        "manhattan financial district night",
      ]),
    widgets: () => [
      watchlist("Watchlist", ["AAPL", "TSLA", "SPY"]),
      stocks("Major Markets", ["^GSPC", "^DJI", "^IXIC"], "1D"),
      news("Financial Markets", "stock market financial markets"),
      news("Corporate Finance", "corporate finance mergers acquisitions earnings"),
      news("Investment Finance", "investing IPO venture capital"),
    ],
  },
  {
    id: "athlete",
    name: "Athlete",
    description: "Soccer, NFL, NBA, NHL & MLB scores",
    emoji: "🏟️",
    backgroundQuery: () =>
      pick([
        "football stadium crowd",
        "basketball arena",
        "soccer pitch stadium",
        "baseball field",
        "ice hockey rink",
        "running track athletics",
      ]),
    widgets: () => [
      scoreboard("Premier League", "soccer", "eng.1"),
      scoreboard("NFL", "football", "nfl"),
      scoreboard("NBA", "basketball", "nba"),
      scoreboard("NHL", "hockey", "nhl"),
      scoreboard("MLB", "baseball", "mlb"),
    ],
  },
  {
    id: "techie",
    name: "Techie",
    description: "Tech headlines, GitHub trending & AI news",
    emoji: "💻",
    backgroundQuery: () =>
      pick([
        "technology circuit board abstract",
        "server data center",
        "code on screen programming",
        "futuristic technology blue",
        "silicon valley office",
        "neon cyberpunk tech",
      ]),
    widgets: () => [
      news("Tech Headlines", "technology"),
      githubTrending(),
      news("AI News", "artificial intelligence"),
    ],
  },
  {
    id: "minimalist",
    name: "The Minimalist",
    description: "Just weather and a daily quote",
    emoji: "🌿",
    backgroundQuery: () =>
      pick([
        "minimal calm landscape fog",
        "misty mountains sunrise",
        "calm ocean horizon",
        "zen minimalist nature",
        "soft gradient sky clouds",
        "quiet forest morning",
      ]),
    widgets: () => [weather("Weather", defaultCity()), dailyQuote()],
  },
  {
    id: "entrepreneur",
    name: "Entrepreneur",
    description: "VC funding, startups & founders",
    emoji: "🚀",
    backgroundQuery: () =>
      pick([
        "startup office modern workspace",
        "coworking space team",
        "entrepreneur desk laptop coffee",
        "whiteboard brainstorm startup",
        "modern office glass building",
        "creative workspace minimal",
      ]),
    widgets: () => [
      news("VC Funding", "venture capital funding round"),
      news("Startup News", "startup"),
      news("Entrepreneurship", "entrepreneurship founders"),
    ],
  },
  {
    id: "politician",
    name: "Politician",
    description: "Political news, polling & economy",
    emoji: "🏛️",
    backgroundQuery: () =>
      pick([
        "government capitol building",
        "white house washington",
        "parliament architecture",
        "supreme court columns",
        "city hall government",
        "flags government building",
      ]),
    widgets: () => [
      news("Political News", "politics"),
      news("Polling", "election polls polling"),
      fxIndicators(),
    ],
  },
  {
    id: "newspaper",
    name: "News Paper",
    description: "World, politics & technology headlines",
    emoji: "📰",
    backgroundQuery: () =>
      pick([
        "newspaper printing press",
        "stack of newspapers",
        "vintage typewriter desk",
        "newsroom journalism",
        "newspaper headlines macro",
        "library reading newspaper",
      ]),
    widgets: () => [
      news("World", "world news"),
      news("Politics", "politics"),
      news("Technology", "technology"),
    ],
  },
  {
    id: "local",
    name: "Local",
    description: "Your city's weather, news & sports",
    emoji: "📍",
    needsCity: true,
    backgroundQuery: (o) =>
      o.city
        ? pick([`${o.city} skyline`, `${o.city} downtown`, `${o.city} cityscape`, `${o.city} landmark`])
        : pick(["city skyline", "downtown street", "city aerial view"]),
    widgets: (o) => {
      const city = o.city || defaultCity();
      return [
        weather("Weather", city),
        news(`${city} News`, city),
        news(`${city} Sports`, `${city} sports team`),
      ];
    },
  },
  {
    id: "custom",
    name: "Custom",
    description: "Build your own with the prompt bar",
    emoji: "✨",
    backgroundQuery: () =>
      pick([
        "minimal abstract gradient wallpaper",
        "abstract colorful gradient",
        "aurora night sky",
        "mountain landscape wallpaper",
        "abstract waves dark",
        "nature scenic wallpaper",
      ]),
    widgets: () => [],
  },
];

export function getProfile(id: ProfileId): Profile {
  return PROFILES.find((p) => p.id === id) ?? PROFILES[PROFILES.length - 1];
}

/** Instantiate a profile's seed widgets into full WidgetConfigs. */
export function seedWidgets(id: ProfileId, opts: ProfileOptions = {}): WidgetConfig[] {
  return getProfile(id)
    .widgets(opts)
    .map((seed) => ({
      ...seed,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    })) as WidgetConfig[];
}
