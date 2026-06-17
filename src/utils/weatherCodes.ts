// WMO weather interpretation codes (Open-Meteo's `weather_code`) → emoji + text.
// https://open-meteo.com/en/docs (WMO Weather interpretation codes)
interface WmoInfo {
  emoji: string;
  description: string;
}

const WMO: Record<number, WmoInfo> = {
  0: { emoji: "☀️", description: "Clear sky" },
  1: { emoji: "🌤️", description: "Mainly clear" },
  2: { emoji: "⛅", description: "Partly cloudy" },
  3: { emoji: "☁️", description: "Overcast" },
  45: { emoji: "🌫️", description: "Fog" },
  48: { emoji: "🌫️", description: "Rime fog" },
  51: { emoji: "🌦️", description: "Light drizzle" },
  53: { emoji: "🌦️", description: "Drizzle" },
  55: { emoji: "🌧️", description: "Heavy drizzle" },
  56: { emoji: "🌧️", description: "Freezing drizzle" },
  57: { emoji: "🌧️", description: "Freezing drizzle" },
  61: { emoji: "🌦️", description: "Light rain" },
  63: { emoji: "🌧️", description: "Rain" },
  65: { emoji: "🌧️", description: "Heavy rain" },
  66: { emoji: "🌧️", description: "Freezing rain" },
  67: { emoji: "🌧️", description: "Freezing rain" },
  71: { emoji: "🌨️", description: "Light snow" },
  73: { emoji: "🌨️", description: "Snow" },
  75: { emoji: "❄️", description: "Heavy snow" },
  77: { emoji: "🌨️", description: "Snow grains" },
  80: { emoji: "🌦️", description: "Light showers" },
  81: { emoji: "🌧️", description: "Showers" },
  82: { emoji: "⛈️", description: "Violent showers" },
  85: { emoji: "🌨️", description: "Snow showers" },
  86: { emoji: "❄️", description: "Heavy snow showers" },
  95: { emoji: "⛈️", description: "Thunderstorm" },
  96: { emoji: "⛈️", description: "Thunderstorm, hail" },
  99: { emoji: "⛈️", description: "Thunderstorm, hail" },
};

export function describeWeatherCode(code: number): WmoInfo {
  return WMO[code] ?? { emoji: "🌡️", description: "—" };
}
