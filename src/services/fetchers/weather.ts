import type { WeatherData, WeatherParams } from "../../types/widget";
import { describeWeatherCode } from "../../utils/weatherCodes";

interface GeocodeResult {
  name?: string;
  latitude?: number;
  longitude?: number;
  admin1?: string;
  country_code?: string;
}

interface ForecastResponse {
  current?: { temperature_2m?: number; relative_humidity_2m?: number; weather_code?: number };
  daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[] };
}

// Open-Meteo is fully keyless. It needs lat/lon, so we geocode the city first
// via Open-Meteo's (also keyless) geocoding API.
export async function fetchWeather(
  params: WeatherParams,
  signal?: AbortSignal,
): Promise<WeatherData> {
  // Strip a trailing ",US"/country code the prompt parser may add.
  const cityQuery = params.location.split(",")[0].trim();

  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityQuery)}` +
      `&count=1&language=en&format=json`,
    { signal },
  );
  if (!geoRes.ok) throw new Error(`Geocoding failed (${geoRes.status})`);
  const geo = (await geoRes.json()) as { results?: GeocodeResult[] };
  const place = geo.results?.[0];
  if (!place || place.latitude === undefined || place.longitude === undefined) {
    throw new Error(`Location "${cityQuery}" not found`);
  }

  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code` +
      `&daily=temperature_2m_max,temperature_2m_min` +
      `&temperature_unit=fahrenheit&timezone=auto&forecast_days=1`,
    { signal },
  );
  if (!res.ok) throw new Error(`Weather request failed (${res.status})`);
  const json = (await res.json()) as ForecastResponse;

  const cur = json.current;
  if (cur?.temperature_2m === undefined) throw new Error("Unexpected weather response");
  const { emoji, description } = describeWeatherCode(cur.weather_code ?? -1);

  // Friendly location label, e.g. "Austin, Texas" or "Austin, US".
  const region = place.admin1 || place.country_code || "";
  const label = region ? `${place.name}, ${region}` : place.name || cityQuery;

  return {
    kind: "weather",
    location: label,
    tempF: Math.round(cur.temperature_2m),
    description,
    emoji,
    humidity: cur.relative_humidity_2m ?? 0,
    high: Math.round(json.daily?.temperature_2m_max?.[0] ?? cur.temperature_2m),
    low: Math.round(json.daily?.temperature_2m_min?.[0] ?? cur.temperature_2m),
  };
}
