import type { RiskLevel, WeatherSnapshot } from "@/types";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const MARINE_URL = "https://marine-api.open-meteo.com/v1/marine";

export function scoreRisk(input: {
  windSpeedMs: number;
  waveHeightM: number | null;
  visibilityM: number | null;
  precipitationMm: number;
}): RiskLevel {
  const wave = input.waveHeightM ?? 0;
  const vis = input.visibilityM ?? 50_000;
  if (input.windSpeedMs >= 11 || wave >= 1.5 || vis < 1000) return "red";
  if (
    input.windSpeedMs >= 7 ||
    wave >= 0.8 ||
    vis < 4000 ||
    input.precipitationMm >= 2
  )
    return "yellow";
  return "green";
}

export async function fetchWeather(
  lat: number,
  lon: number
): Promise<WeatherSnapshot> {
  const forecastParams = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      "temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,visibility",
    wind_speed_unit: "ms",
    timezone: "auto",
  });

  const marineParams = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "wave_height",
    timezone: "auto",
  });

  const [forecastRes, marineRes] = await Promise.all([
    fetch(`${FORECAST_URL}?${forecastParams}`),
    fetch(`${MARINE_URL}?${marineParams}`).catch(() => null),
  ]);

  if (!forecastRes.ok) throw new Error("weather_fetch_failed");
  const forecast = await forecastRes.json();
  const marine = marineRes && marineRes.ok ? await marineRes.json() : null;

  const current = forecast.current ?? {};
  const waveHeight: number | null = marine?.current?.wave_height ?? null;

  const snapshot: WeatherSnapshot = {
    temperature_c: current.temperature_2m ?? 0,
    wind_speed_ms: current.wind_speed_10m ?? 0,
    wind_direction_deg: current.wind_direction_10m ?? 0,
    wave_height_m: waveHeight,
    visibility_m: current.visibility ?? null,
    precipitation_mm: current.precipitation ?? 0,
    risk: "green",
    fetched_at: new Date().toISOString(),
  };
  snapshot.risk = scoreRisk({
    windSpeedMs: snapshot.wind_speed_ms,
    waveHeightM: snapshot.wave_height_m,
    visibilityM: snapshot.visibility_m,
    precipitationMm: snapshot.precipitation_mm,
  });
  return snapshot;
}

export function windDirectionLabel(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

export interface HourlyPoint {
  time: string; // ISO
  temperature_c: number;
  wind_speed_ms: number;
  wind_direction_deg: number;
  wave_height_m: number | null;
  precipitation_mm: number;
  risk: RiskLevel;
}

export interface ForecastDetail {
  hourly: HourlyPoint[];
  sunrise: string | null;
  sunset: string | null;
}

export async function fetchForecastDetail(
  lat: number,
  lon: number
): Promise<ForecastDetail> {
  const forecastParams = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: "temperature_2m,wind_speed_10m,wind_direction_10m,precipitation",
    daily: "sunrise,sunset",
    wind_speed_unit: "ms",
    forecast_days: "2",
    timezone: "auto",
  });
  const marineParams = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: "wave_height",
    forecast_days: "2",
    timezone: "auto",
  });

  const [forecastRes, marineRes] = await Promise.all([
    fetch(`https://api.open-meteo.com/v1/forecast?${forecastParams}`),
    fetch(`https://marine-api.open-meteo.com/v1/marine?${marineParams}`).catch(
      () => null
    ),
  ]);
  if (!forecastRes.ok) throw new Error("forecast_fetch_failed");
  const forecast = await forecastRes.json();
  const marine = marineRes && marineRes.ok ? await marineRes.json() : null;

  const times: string[] = forecast.hourly?.time ?? [];
  const nowIso = new Date().toISOString().slice(0, 13);
  const startIdx = Math.max(
    0,
    times.findIndex((t) => t.slice(0, 13) >= nowIso)
  );

  const hourly: HourlyPoint[] = [];
  for (let i = startIdx; i < Math.min(startIdx + 12, times.length); i++) {
    const wind = forecast.hourly.wind_speed_10m?.[i] ?? 0;
    const wave = marine?.hourly?.wave_height?.[i] ?? null;
    const precip = forecast.hourly.precipitation?.[i] ?? 0;
    hourly.push({
      time: times[i],
      temperature_c: forecast.hourly.temperature_2m?.[i] ?? 0,
      wind_speed_ms: wind,
      wind_direction_deg: forecast.hourly.wind_direction_10m?.[i] ?? 0,
      wave_height_m: wave,
      precipitation_mm: precip,
      risk: scoreRisk({
        windSpeedMs: wind,
        waveHeightM: wave,
        visibilityM: null,
        precipitationMm: precip,
      }),
    });
  }

  return {
    hourly,
    sunrise: forecast.daily?.sunrise?.[0] ?? null,
    sunset: forecast.daily?.sunset?.[0] ?? null,
  };
}
