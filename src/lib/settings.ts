"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_CALENDAR_EMBED_URL, isValidEmbedUrl } from "@/config/calendar";
import { SETTINGS_STORAGE_KEY } from "@/lib/storage-keys";

/**
 * Lightweight UI preferences, persisted in localStorage.
 * Never store passwords, tokens, or other secrets here.
 */
export type ThemePref = "dark" | "light" | "system";
export type TempUnit = "fahrenheit" | "celsius";

export interface WeatherLocation {
  name: string;
  region: string;
  latitude: number;
  longitude: number;
}

export interface Settings {
  theme: ThemePref;
  calendarEmbedUrl: string;
  /** Scales the embedded calendar so it reads well from across the room. */
  calendarScale: number;
  /** Inverts the (always light) Google embed to match the dark theme. */
  darkCalendar: boolean;
  showWeather: boolean;
  weatherLocation: WeatherLocation | null;
  tempUnit: TempUnit;
  /** Minutes of inactivity before ambient mode starts; 0 disables. */
  ambientTimeoutMinutes: number;
  slideshowEnabled: boolean;
  /** Optional extra image URLs for the slideshow, one per entry. */
  photoUrls: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  calendarEmbedUrl: DEFAULT_CALENDAR_EMBED_URL,
  calendarScale: 1.15,
  darkCalendar: false,
  showWeather: true,
  weatherLocation: null,
  tempUnit: "fahrenheit",
  ambientTimeoutMinutes: 10,
  slideshowEnabled: false,
  photoUrls: [],
};

export const CALENDAR_SCALES = [
  { value: 1, label: "Normal" },
  { value: 1.15, label: "Large" },
  { value: 1.3, label: "Extra large" },
];

export const AMBIENT_TIMEOUTS = [0, 2, 5, 10, 15, 30];

function sanitize(raw: unknown): Settings {
  const s = (raw && typeof raw === "object" ? raw : {}) as Partial<Settings>;
  const d = DEFAULT_SETTINGS;
  const loc = s.weatherLocation;
  return {
    theme: s.theme === "light" || s.theme === "system" ? s.theme : d.theme,
    calendarEmbedUrl:
      typeof s.calendarEmbedUrl === "string" && isValidEmbedUrl(s.calendarEmbedUrl)
        ? s.calendarEmbedUrl
        : d.calendarEmbedUrl,
    calendarScale: CALENDAR_SCALES.some((o) => o.value === s.calendarScale)
      ? (s.calendarScale as number)
      : d.calendarScale,
    darkCalendar: typeof s.darkCalendar === "boolean" ? s.darkCalendar : d.darkCalendar,
    showWeather: typeof s.showWeather === "boolean" ? s.showWeather : d.showWeather,
    weatherLocation:
      loc &&
      typeof loc.name === "string" &&
      Number.isFinite(loc.latitude) &&
      Number.isFinite(loc.longitude)
        ? {
            name: loc.name,
            region: typeof loc.region === "string" ? loc.region : "",
            latitude: loc.latitude,
            longitude: loc.longitude,
          }
        : null,
    tempUnit: s.tempUnit === "celsius" ? "celsius" : d.tempUnit,
    ambientTimeoutMinutes: AMBIENT_TIMEOUTS.includes(s.ambientTimeoutMinutes as number)
      ? (s.ambientTimeoutMinutes as number)
      : d.ambientTimeoutMinutes,
    slideshowEnabled:
      typeof s.slideshowEnabled === "boolean" ? s.slideshowEnabled : d.slideshowEnabled,
    photoUrls: Array.isArray(s.photoUrls)
      ? s.photoUrls.filter((u): u is string => typeof u === "string" && /^https?:\/\//.test(u))
      : d.photoUrls,
  };
}

let current: Settings | null = null;
const listeners = new Set<() => void>();

function read(): Settings {
  if (current) return current;
  try {
    current = sanitize(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}"));
  } catch {
    current = DEFAULT_SETTINGS;
  }
  return current;
}

function emit() {
  listeners.forEach((l) => l());
}

export function updateSettings(patch: Partial<Settings>) {
  current = sanitize({ ...read(), ...patch });
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Storage full or blocked: keep the in-memory value for this session.
  }
  emit();
}

export function resetSettings() {
  try {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  } catch {
    // ignore
  }
  current = DEFAULT_SETTINGS;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep multiple open windows/tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key === SETTINGS_STORAGE_KEY) {
      current = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_SETTINGS);
}
