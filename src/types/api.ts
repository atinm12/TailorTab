// Raw response shapes for the external APIs. Only the fields we read are
// declared; everything is optional because none of these schemas are under
// our control (ESPN's is entirely unofficial).

// ---- NewsAPI /v2/everything ----
export interface NewsApiResponse {
  status?: string;
  code?: string;
  message?: string;
  articles?: {
    title?: string;
    url?: string;
    publishedAt?: string;
    source?: { name?: string };
  }[];
}

// ---- Alpha Vantage GLOBAL_QUOTE ----
export interface AlphaVantageQuoteResponse {
  "Global Quote"?: {
    "01. symbol"?: string;
    "05. price"?: string;
    "07. latest trading day"?: string;
    "09. change"?: string;
    "10. change percent"?: string;
  };
  Note?: string;
  Information?: string;
  "Error Message"?: string;
}

// ---- OpenWeatherMap /data/2.5/weather ----
export interface OpenWeatherMapResponse {
  cod?: number | string;
  message?: string;
  name?: string;
  main?: { temp?: number; humidity?: number; temp_min?: number; temp_max?: number };
  weather?: { description?: string; icon?: string }[];
  sys?: { country?: string };
}

// ---- ESPN site API ----
export interface EspnCompetitor {
  homeAway?: string;
  winner?: boolean;
  score?: string | { displayValue?: string };
  team?: { displayName?: string; abbreviation?: string; logo?: string; logos?: { href?: string }[] };
}

export interface EspnEvent {
  name?: string;
  shortName?: string;
  date?: string;
  competitions?: {
    competitors?: EspnCompetitor[];
    status?: { type?: { shortDetail?: string } };
  }[];
  status?: { type?: { shortDetail?: string } };
}

export interface EspnTeamResponse {
  team?: {
    displayName?: string;
    logos?: { href?: string }[];
    record?: { items?: { summary?: string }[] };
    nextEvent?: EspnEvent[];
  };
}

export interface EspnScoreboardResponse {
  events?: EspnEvent[];
}

// ---- OpenAI chat completions ----
export interface OpenAiChatResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}
