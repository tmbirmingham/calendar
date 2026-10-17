"use client";

import { MoonStar, Settings as SettingsIcon } from "lucide-react";
import type { WeatherState } from "@/hooks/useWeather";
import { Clock, DateLine } from "./Clock";
import { WeatherSummary } from "./Weather";
import { IconButton } from "./ui";

export function Header({
  weather,
  onRetryWeather,
  onOpenSettings,
  onAmbient,
}: {
  weather: WeatherState;
  onRetryWeather: () => void;
  onOpenSettings: () => void;
  onAmbient: () => void;
}) {
  return (
    <header className="flex shrink-0 items-center gap-6 px-1 pb-4">
      <div className="flex min-w-0 items-baseline gap-5">
        <Clock
          className="text-[clamp(2.75rem,4.6vw,4rem)] leading-none"
          meridiemClassName="text-[0.42em]"
        />
        <DateLine className="hidden truncate text-[clamp(1.25rem,1.9vw,1.75rem)] font-medium text-muted sm:block" />
      </div>
      <div className="ml-auto flex items-center gap-5">
        <div className="hidden lg:block">
          <WeatherSummary state={weather} onSetup={onOpenSettings} onRetry={onRetryWeather} />
        </div>
        <div className="flex gap-2.5">
          <IconButton label="Start ambient display" onClick={onAmbient}>
            <MoonStar className="size-6" />
          </IconButton>
          <IconButton label="Settings" onClick={onOpenSettings}>
            <SettingsIcon className="size-6" />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
