import type { WeatherData } from "../../types/widget";

export function WeatherWidget({ data }: { data: WeatherData }) {
  return (
    <div className="weather-widget">
      <p className="weather-location">📍 {data.location}</p>
      <div className="weather-main">
        <span className="weather-icon" role="img" aria-label={data.description}>
          {data.emoji}
        </span>
        <div>
          <span className="weather-temp">{data.tempF}°F</span>
          <p className="weather-desc">{data.description}</p>
        </div>
      </div>
      <div className="weather-stats">
        <span>H: {data.high}°</span>
        <span>L: {data.low}°</span>
        <span>💧 {data.humidity}%</span>
      </div>
    </div>
  );
}
