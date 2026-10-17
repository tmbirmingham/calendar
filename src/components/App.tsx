"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { openInGoogleUrl, type CalendarMode } from "@/config/calendar";
import { useIdle } from "@/hooks/useIdle";
import { usePhotos } from "@/hooks/usePhotos";
import { useWeather } from "@/hooks/useWeather";
import { useSettings, type ThemePref } from "@/lib/settings";
import { AmbientMode } from "./AmbientMode";
import { CalendarPanel } from "./CalendarPanel";
import { Header } from "./Header";
import { HouseholdTeaser, HouseholdView } from "./Household";
import { NavRail, type View } from "./NavRail";
import { SettingsPanel } from "./SettingsPanel";
import { UpcomingEvents } from "./UpcomingEvents";
import { WeatherCard } from "./Weather";
import { cx } from "./ui";

function subscribeColorScheme(listener: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: light)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

/** Resolve "system" against the OS preference and apply it to <html>. */
function useResolvedTheme(theme: ThemePref): "dark" | "light" {
  const prefersLight = useSyncExternalStore(
    subscribeColorScheme,
    () => window.matchMedia("(prefers-color-scheme: light)").matches,
    () => false,
  );
  const resolved = theme === "system" ? (prefersLight ? "light" : "dark") : theme;
  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);
  return resolved;
}

export function App() {
  const settings = useSettings();
  const [view, setView] = useState<View>("home");
  const [mode, setMode] = useState<CalendarMode>("MONTH");
  const [ambient, setAmbient] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { state: weather, retry: retryWeather } = useWeather(settings);
  const photos = usePhotos(ambient && settings.slideshowEnabled, settings.photoUrls);

  const theme = useResolvedTheme(settings.theme);

  const enterAmbient = useCallback(() => {
    setSettingsOpen(false);
    setAmbient(true);
  }, []);
  const exitAmbient = useCallback(() => setAmbient(false), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  useIdle(settings.ambientTimeoutMinutes * 60_000, !ambient, enterAmbient);

  const openUrl = openInGoogleUrl(settings.calendarEmbedUrl);

  return (
    <div className="flex h-dvh flex-col md:flex-row">
      <NavRail view={view} onNavigate={setView} onAmbient={enterAmbient} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col p-4 lg:p-5">
        <Header
          weather={weather}
          onRetryWeather={retryWeather}
          onOpenSettings={() => setSettingsOpen(true)}
          onAmbient={enterAmbient}
        />

        <main className="min-h-0 flex-1">
          {view === "household" && <HouseholdView />}

          {/* The calendar stays mounted between Home and Calendar so it doesn't reload. */}
          <div
            className={cx(
              "h-full min-h-0 gap-4 lg:gap-5",
              view === "household" ? "hidden" : "flex flex-col lg:flex-row",
            )}
          >
            <div className={cx("min-h-0 min-w-0 flex-1", view === "home" && "max-lg:min-h-[60vh]")}>
              <CalendarPanel
                embedUrl={settings.calendarEmbedUrl}
                mode={mode}
                onModeChange={setMode}
                scale={settings.calendarScale}
                dark={settings.darkCalendar && theme === "dark"}
                onExpand={view === "home" ? () => setView("calendar") : undefined}
              />
            </div>
            {view === "home" && (
              <aside
                aria-label="Today"
                className="touch-scroll flex shrink-0 flex-col gap-4 lg:w-[clamp(320px,26vw,420px)] lg:gap-5"
              >
                <WeatherCard
                  state={weather}
                  location={settings.weatherLocation}
                  onSetup={() => setSettingsOpen(true)}
                  onRetry={retryWeather}
                />
                <UpcomingEvents
                  openUrl={openUrl}
                  onShowAgenda={() => {
                    setMode("AGENDA");
                    setView("calendar");
                  }}
                />
                <HouseholdTeaser onOpen={() => setView("household")} />
              </aside>
            )}
          </div>
        </main>
      </div>

      {settingsOpen && <SettingsPanel settings={settings} onClose={closeSettings} />}
      {ambient && <AmbientMode weather={weather} photos={photos} onExit={exitAmbient} />}
    </div>
  );
}
