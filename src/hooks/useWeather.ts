"use client";

import { useCallback, useEffect, useState } from "react";
import type { Settings } from "@/lib/settings";
import { WEATHER_CACHE_KEY } from "@/lib/storage-keys";
import { fetchWeather, type WeatherData } from "@/lib/weather";

const REFRESH_MS = 15 * 60_000;
const RETRY_MS = 5 * 60_000;
const STALE_MS = 60 * 60_000;

export type WeatherState =
  | { status: "hidden" }
  | { status: "unconfigured" }
  | { status: "loading" }
  | { status: "ready"; data: WeatherData; stale: boolean; error: string | null }
  | { status: "error"; error: string };

function readCache(): WeatherData | null {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as WeatherData) : null;
  } catch {
    return null;
  }
}

function writeCache(data: WeatherData) {
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/**
 * Fetches weather every 15 minutes, keeps the last good reading (also across
 * reloads) and shows it marked as stale if refreshes keep failing.
 */
export function useWeather(settings: Settings): { state: WeatherState; retry: () => void } {
  const { showWeather, weatherLocation: loc, tempUnit } = settings;
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const lat = loc?.latitude;
  const lon = loc?.longitude;

  useEffect(() => {
    if (!showWeather || lat === undefined || lon === undefined) return;
    const matches = (d: WeatherData | null): d is WeatherData =>
      !!d && d.latitude === lat && d.longitude === lon && d.unit === tempUnit;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();

    const cached = readCache();
    const initial = matches(cached) ? cached : null;
    // Show the cached reading immediately (or clear a reading for another place).
    queueMicrotask(() => {
      if (!cancelled) {
        setData(initial);
        setError(null);
      }
    });

    const load = async () => {
      try {
        const fresh = await fetchWeather(
          { name: "", region: "", latitude: lat, longitude: lon },
          tempUnit,
          controller.signal,
        );
        if (cancelled) return;
        writeCache(fresh);
        setData(fresh);
        setError(null);
        timer = setTimeout(load, REFRESH_MS);
      } catch {
        if (cancelled) return;
        setError(navigator.onLine ? "Weather service unavailable" : "No internet connection");
        timer = setTimeout(load, RETRY_MS);
      } finally {
        if (!cancelled) setNow(Date.now());
      }
    };

    const age = initial ? Date.now() - initial.fetchedAt : Infinity;
    timer = setTimeout(load, age < REFRESH_MS && attempt === 0 ? REFRESH_MS - age : 0);

    const onOnline = () => {
      clearTimeout(timer);
      load();
    };
    window.addEventListener("online", onOnline);
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
      window.removeEventListener("online", onOnline);
    };
  }, [showWeather, lat, lon, tempUnit, attempt]);

  // Re-evaluate staleness periodically even when nothing else changes.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5 * 60_000);
    return () => clearInterval(id);
  }, []);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  let state: WeatherState;
  if (!showWeather) state = { status: "hidden" };
  else if (!loc) state = { status: "unconfigured" };
  else if (data && data.latitude === lat && data.longitude === lon && data.unit === tempUnit)
    state = { status: "ready", data, stale: now - data.fetchedAt > STALE_MS, error };
  else if (error) state = { status: "error", error };
  else state = { status: "loading" };

  return { state, retry };
}
