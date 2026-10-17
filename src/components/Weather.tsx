"use client";

import { CloudSun, Droplets, MapPin, RefreshCw, TriangleAlert } from "lucide-react";
import type { WeatherState } from "@/hooks/useWeather";
import type { WeatherLocation } from "@/lib/settings";
import { describeWeather, formatTemp } from "@/lib/weather";
import { WeatherIcon } from "./WeatherIcon";
import { Button, Panel, cx } from "./ui";

function updatedLabel(fetchedAt: number) {
  return new Date(fetchedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** Compact summary for the header. Always the same height to avoid layout shift. */
export function WeatherSummary({
  state,
  onSetup,
  onRetry,
}: {
  state: WeatherState;
  onSetup: () => void;
  onRetry: () => void;
}) {
  if (state.status === "hidden") return null;

  if (state.status === "unconfigured") {
    return (
      <Button onClick={onSetup}>
        <MapPin className="size-5" aria-hidden />
        Set weather location
      </Button>
    );
  }

  if (state.status === "error") {
    return (
      <Button onClick={onRetry} aria-label="Weather unavailable. Tap to retry.">
        <TriangleAlert className="size-5 text-warm" aria-hidden />
        <span className="text-muted">Weather unavailable</span>
        <RefreshCw className="size-5 text-muted" aria-hidden />
      </Button>
    );
  }

  if (state.status === "loading") {
    return (
      <div
        className="flex h-14 w-64 items-center gap-3 rounded-2xl px-2 text-muted"
        aria-busy="true"
      >
        <div className="size-11 animate-pulse rounded-full bg-surface-2" />
        <div className="h-6 flex-1 animate-pulse rounded-lg bg-surface-2" />
      </div>
    );
  }

  const { data, stale } = state;
  const today = data.days[0];
  const { label } = describeWeather(data.current.code);
  return (
    <div
      className="flex h-14 items-center gap-3.5"
      aria-label={`Weather: ${formatTemp(data.current.temperature)}, ${label}`}
    >
      <WeatherIcon
        code={data.current.code}
        isDay={data.current.isDay}
        className="size-11 text-warm"
      />
      <div className="tabular text-4xl font-semibold tracking-tight">
        {formatTemp(data.current.temperature)}
      </div>
      <div className="leading-tight">
        <div className="text-[17px] font-medium text-ink">{label}</div>
        <div className="tabular text-[15px] text-muted">
          {today ? `H ${formatTemp(today.high)}  L ${formatTemp(today.low)}` : ""}
          {stale && <span className="ml-2 text-warm">· not updated recently</span>}
        </div>
      </div>
    </div>
  );
}

function dayName(date: string, index: number) {
  if (index === 0) return "Today";
  // Parse as a calendar date (noon avoids any time-zone edge).
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long" });
}

/** Detailed card for the home side panel. */
export function WeatherCard({
  state,
  location,
  onSetup,
  onRetry,
}: {
  state: WeatherState;
  location: WeatherLocation | null;
  onSetup: () => void;
  onRetry: () => void;
}) {
  if (state.status === "hidden") return null;

  return (
    <Panel
      title="Weather"
      icon={<CloudSun className="size-5" aria-hidden />}
      action={location && <span className="truncate text-[15px] text-muted">{location.name}</span>}
    >
      {state.status === "unconfigured" && (
        <div className="space-y-4">
          <p className="text-[17px] text-muted">
            Choose a city or ZIP code to see the local forecast.
          </p>
          <Button variant="primary" onClick={onSetup}>
            <MapPin className="size-5" aria-hidden />
            Set location
          </Button>
        </div>
      )}

      {state.status === "loading" && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading weather">
          <div className="h-16 animate-pulse rounded-2xl bg-surface-2" />
          <div className="h-24 animate-pulse rounded-2xl bg-surface-2" />
        </div>
      )}

      {state.status === "error" && (
        <div className="space-y-4">
          <p className="text-[17px] text-muted">{state.error}. We’ll keep trying automatically.</p>
          <Button onClick={onRetry}>
            <RefreshCw className="size-5" aria-hidden />
            Try again
          </Button>
        </div>
      )}

      {state.status === "ready" && (
        <div>
          <div className="flex items-center gap-4">
            <WeatherIcon
              code={state.data.current.code}
              isDay={state.data.current.isDay}
              className="size-16"
            />
            <div>
              <div className="tabular text-5xl font-semibold tracking-tight">
                {formatTemp(state.data.current.temperature)}
              </div>
              <div className="text-[17px] text-muted">
                {describeWeather(state.data.current.code).label} · feels{" "}
                {formatTemp(state.data.current.feelsLike)}
              </div>
            </div>
          </div>
          <ul className="mt-5 divide-y divide-line">
            {state.data.days.map((d, i) => (
              <li key={d.date} className="tabular flex items-center gap-3 py-2.5 text-[17px]">
                <span className="w-28 font-medium">{dayName(d.date, i)}</span>
                <WeatherIcon code={d.code} className="size-6" />
                <span className="flex w-14 items-center gap-1 text-[15px] text-muted">
                  {d.precipChance !== null && d.precipChance >= 20 && (
                    <>
                      <Droplets className="size-4 text-accent" aria-hidden />
                      {d.precipChance}%
                    </>
                  )}
                </span>
                <span className="ml-auto font-medium">{formatTemp(d.high)}</span>
                <span className="w-10 text-right text-muted">{formatTemp(d.low)}</span>
              </li>
            ))}
          </ul>
          <p
            className={cx(
              "mt-3 text-[14px]",
              state.stale || state.error ? "text-warm" : "text-faint",
            )}
          >
            Updated {updatedLabel(state.data.fetchedAt)}
            {state.error ? ` · ${state.error}, retrying` : ""}
          </p>
        </div>
      )}
    </Panel>
  );
}
