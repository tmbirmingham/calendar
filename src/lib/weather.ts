import type { TempUnit, WeatherLocation } from "@/lib/settings";

/**
 * Weather from Open-Meteo (https://open-meteo.com): free for non-commercial
 * use, no API key, called directly from the browser.
 */

export interface WeatherDay {
  date: string; // YYYY-MM-DD in the location's time zone
  code: number;
  high: number;
  low: number;
  precipChance: number | null;
}

export interface WeatherData {
  fetchedAt: number;
  unit: TempUnit;
  latitude: number;
  longitude: number;
  current: {
    temperature: number;
    feelsLike: number;
    code: number;
    isDay: boolean;
  };
  days: WeatherDay[];
}

export async function fetchWeather(
  loc: WeatherLocation,
  unit: TempUnit,
  signal?: AbortSignal,
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(loc.latitude),
    longitude: String(loc.longitude),
    current: "temperature_2m,apparent_temperature,weather_code,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    temperature_unit: unit,
    timezone: "auto",
    forecast_days: "4",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal });
  if (!res.ok) throw new Error(`Weather service responded ${res.status}`);
  const json = await res.json();
  const c = json.current;
  const d = json.daily;
  if (!c || !d || !Array.isArray(d.time)) throw new Error("Unexpected weather response");
  return {
    fetchedAt: Date.now(),
    unit,
    latitude: loc.latitude,
    longitude: loc.longitude,
    current: {
      temperature: c.temperature_2m,
      feelsLike: c.apparent_temperature,
      code: c.weather_code,
      isDay: c.is_day === 1,
    },
    days: d.time.map((date: string, i: number) => ({
      date,
      code: d.weather_code[i],
      high: d.temperature_2m_max[i],
      low: d.temperature_2m_min[i],
      precipChance: d.precipitation_probability_max?.[i] ?? null,
    })),
  };
}

export interface PlaceResult extends WeatherLocation {
  id: number;
}

/** Search a city name or postal code (5-digit numbers are treated as US ZIPs). */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceResult[]> {
  const q = query.trim();
  const zip = /^\d{5}$/.test(q);
  const name = zip ? q : q.split(",")[0].trim();
  if (name.length < 2) return [];
  const params = new URLSearchParams({ name, count: "8", language: "en", format: "json" });
  if (zip) params.set("countryCode", "US");
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, { signal });
  if (!res.ok) throw new Error(`Location search responded ${res.status}`);
  const json = await res.json();
  type Raw = {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    admin1?: string;
    country?: string;
    country_code?: string;
  };
  const hint = zip ? "" : q.split(",").slice(1).join(",").trim().toLowerCase();
  const results: PlaceResult[] = ((json.results ?? []) as Raw[]).map((r) => ({
    id: r.id,
    name: zip ? `${r.name} ${q}` : r.name,
    region: [r.admin1, r.country_code === "US" ? "" : r.country].filter(Boolean).join(", "),
    latitude: r.latitude,
    longitude: r.longitude,
  }));
  // "Springfield, Illinois" → float matches for the text after the comma first.
  if (hint) {
    results.sort(
      (a, b) =>
        Number(b.region.toLowerCase().includes(hint)) -
        Number(a.region.toLowerCase().includes(hint)),
    );
  }
  return results;
}

export type WeatherKind =
  | "clear"
  | "partly"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "storm";

/** WMO weather interpretation codes, as used by Open-Meteo. */
export function describeWeather(code: number): { label: string; kind: WeatherKind } {
  if (code === 0) return { label: "Clear", kind: "clear" };
  if (code === 1) return { label: "Mostly clear", kind: "partly" };
  if (code === 2) return { label: "Partly cloudy", kind: "partly" };
  if (code === 3) return { label: "Overcast", kind: "cloudy" };
  if (code === 45 || code === 48) return { label: "Fog", kind: "fog" };
  if (code >= 51 && code <= 57) return { label: "Drizzle", kind: "drizzle" };
  if (code === 61 || code === 80) return { label: "Light rain", kind: "rain" };
  if (code === 63 || code === 81) return { label: "Rain", kind: "rain" };
  if (code === 65 || code === 82) return { label: "Heavy rain", kind: "rain" };
  if (code === 66 || code === 67) return { label: "Freezing rain", kind: "rain" };
  if (code === 71 || code === 85) return { label: "Light snow", kind: "snow" };
  if (code === 73) return { label: "Snow", kind: "snow" };
  if (code === 75 || code === 86) return { label: "Heavy snow", kind: "snow" };
  if (code === 77) return { label: "Snow grains", kind: "snow" };
  if (code === 95) return { label: "Thunderstorm", kind: "storm" };
  if (code === 96 || code === 99) return { label: "Thunderstorm, hail", kind: "storm" };
  return { label: "Unknown", kind: "cloudy" };
}

export function formatTemp(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${Math.round(value)}°` : "–";
}
