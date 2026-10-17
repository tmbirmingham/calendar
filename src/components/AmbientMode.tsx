"use client";

import { useEffect, useState } from "react";
import { Hand, X } from "lucide-react";
import { useNow } from "@/hooks/useNow";
import type { WeatherState } from "@/hooks/useWeather";
import { useUpcomingEvents } from "@/lib/events";
import { describeWeather, formatTemp } from "@/lib/weather";
import { Clock, DateLine } from "./Clock";
import { WeatherIcon } from "./WeatherIcon";
import { cx } from "./ui";

const SLIDE_MS = 30_000;

/**
 * Calm full-screen display for when nobody is using the calendar.
 * Any tap, click, or key press returns to the dashboard.
 */
export function AmbientMode({
  weather,
  photos,
  onExit,
}: {
  weather: WeatherState;
  photos: string[];
  onExit: () => void;
}) {
  const now = useNow();
  const events = useUpcomingEvents();
  const [slide, setSlide] = useState(0);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const usable = photos.filter((p) => !failed.has(p));
  const current = usable.length ? usable[slide % usable.length] : null;

  useEffect(() => {
    if (usable.length < 2) return;
    const id = setInterval(() => setSlide((s) => s + 1), SLIDE_MS);
    return () => clearInterval(id);
  }, [usable.length]);

  useEffect(() => {
    const onKey = () => onExit();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit]);

  // Drift the content a few pixels each minute so nothing sits still for hours.
  const minute = now ? now.getMinutes() : 0;
  const drift = { x: ((minute * 7) % 21) - 10, y: ((minute * 11) % 17) - 8 };
  const nextEvent = events.kind === "ready" ? events.events[0] : undefined;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ambient display. Tap anywhere to return."
      className="animate-fade-in fixed inset-0 z-50 cursor-pointer overflow-hidden bg-[#05080f] text-white"
      onClick={onExit}
    >
      {current && (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary local/remote photos
        <img
          key={current}
          src={current}
          alt=""
          className="animate-fade-in absolute inset-0 size-full object-cover opacity-70"
          onError={() => setFailed((f) => new Set(f).add(current))}
        />
      )}
      {current && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />
      )}

      <button
        type="button"
        aria-label="Exit ambient display"
        onClick={(e) => {
          e.stopPropagation();
          onExit();
        }}
        className="absolute top-6 right-6 z-10 flex size-16 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur active:bg-white/20"
      >
        <X className="size-8" />
      </button>

      <div
        className={cx(
          "relative flex h-full flex-col p-12 transition-transform duration-[3000ms] ease-in-out lg:p-16",
          current ? "justify-end" : "items-center justify-center text-center",
        )}
        style={{ transform: `translate(${drift.x}px, ${drift.y}px)` }}
      >
        <Clock
          className="text-[clamp(6rem,17vw,15rem)] leading-none font-light text-white"
          meridiemClassName="text-[0.3em] text-white/60"
        />
        <DateLine className="mt-4 text-[clamp(1.75rem,3.4vw,3rem)] font-medium text-white/85" />

        <div
          className={cx(
            "mt-10 flex flex-wrap items-center gap-x-12 gap-y-6",
            !current && "justify-center",
          )}
        >
          {weather.status === "ready" && (
            <div className="flex items-center gap-5">
              <WeatherIcon
                code={weather.data.current.code}
                isDay={weather.data.current.isDay}
                className="size-[clamp(3.5rem,6vw,5.5rem)]"
              />
              <div className="text-left">
                <div className="tabular text-[clamp(2.5rem,5vw,4.5rem)] leading-none font-light">
                  {formatTemp(weather.data.current.temperature)}
                </div>
                <div className="mt-1 text-[clamp(1.1rem,1.8vw,1.6rem)] text-white/70">
                  {describeWeather(weather.data.current.code).label}
                  {weather.data.days[0] &&
                    ` · H ${formatTemp(weather.data.days[0].high)} L ${formatTemp(weather.data.days[0].low)}`}
                </div>
              </div>
            </div>
          )}
          {nextEvent && (
            <div className="text-left">
              <div className="text-[clamp(1rem,1.4vw,1.25rem)] tracking-wide text-white/60 uppercase">
                Next up
              </div>
              <div className="text-[clamp(1.5rem,2.4vw,2.25rem)] font-medium">
                {nextEvent.title}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 text-lg text-white/45">
        <Hand className="size-5" aria-hidden />
        Tap anywhere to return
      </div>
    </div>
  );
}
