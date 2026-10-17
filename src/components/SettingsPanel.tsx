"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Check, LoaderCircle, MapPin, Search, X } from "lucide-react";
import { DEFAULT_CALENDAR_EMBED_URL, isValidEmbedUrl } from "@/config/calendar";
import {
  AMBIENT_TIMEOUTS,
  CALENDAR_SCALES,
  resetSettings,
  updateSettings,
  type Settings,
} from "@/lib/settings";
import { searchPlaces, type PlaceResult } from "@/lib/weather";
import { Button, IconButton, Segmented, Toggle } from "./ui";

const inputClass =
  "w-full min-h-14 rounded-2xl border border-line-strong bg-surface-2 px-4 text-[17px] text-ink placeholder:text-faint";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-line py-6 first:pt-2 last:border-b-0">
      <h3 className="mb-4 text-[15px] font-semibold tracking-wide text-muted uppercase">{title}</h3>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[17px] font-medium">{label}</div>
      {children}
      {hint && <p className="mt-2 text-[15px] leading-relaxed text-muted">{hint}</p>}
    </div>
  );
}

export function SettingsPanel({ settings, onClose }: { settings: Settings; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="animate-fade-in fixed inset-0 z-40 flex justify-end bg-black/50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="flex h-full w-full max-w-xl flex-col border-l border-line-strong bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-line px-6 py-4">
          <h2 id="settings-title" className="text-2xl font-semibold">
            Settings
          </h2>
          <IconButton ref={closeRef} label="Close settings" onClick={onClose}>
            <X className="size-6" />
          </IconButton>
        </header>

        <div className="touch-scroll flex-1 px-6 pb-10">
          <Section title="Appearance">
            <Field label="Theme">
              <Segmented
                label="Theme"
                value={settings.theme}
                options={[
                  { value: "dark", label: "Dark" },
                  { value: "light", label: "Light" },
                  { value: "system", label: "Automatic" },
                ]}
                onChange={(theme) => updateSettings({ theme })}
              />
            </Field>
            <Field
              label="Calendar text size"
              hint="Larger sizes are easier to read from across the room."
            >
              <Segmented
                label="Calendar text size"
                value={settings.calendarScale}
                options={CALENDAR_SCALES}
                onChange={(calendarScale) => updateSettings({ calendarScale })}
              />
            </Field>
            <Toggle
              label="Dark calendar"
              description="Darkens Google’s calendar to match the dark theme. Event colors shift slightly."
              checked={settings.darkCalendar}
              onChange={(darkCalendar) => updateSettings({ darkCalendar })}
            />
          </Section>

          <Section title="Weather">
            <Toggle
              label="Show weather"
              checked={settings.showWeather}
              onChange={(showWeather) => updateSettings({ showWeather })}
            />
            {settings.showWeather && (
              <>
                <LocationField settings={settings} />
                <Field label="Units">
                  <Segmented
                    label="Temperature units"
                    value={settings.tempUnit}
                    options={[
                      { value: "fahrenheit", label: "°F" },
                      { value: "celsius", label: "°C" },
                    ]}
                    onChange={(tempUnit) => updateSettings({ tempUnit })}
                  />
                </Field>
              </>
            )}
          </Section>

          <Section title="Ambient display">
            <Field label="Start after no activity for">
              <div className="grid grid-cols-3 gap-2">
                {AMBIENT_TIMEOUTS.map((m) => (
                  <Button
                    key={m}
                    variant={settings.ambientTimeoutMinutes === m ? "primary" : "secondary"}
                    aria-pressed={settings.ambientTimeoutMinutes === m}
                    onClick={() => updateSettings({ ambientTimeoutMinutes: m })}
                  >
                    {m === 0 ? "Never" : `${m} min`}
                  </Button>
                ))}
              </div>
            </Field>
            <Toggle
              label="Photo slideshow"
              description="Shows photos behind the clock in ambient mode."
              checked={settings.slideshowEnabled}
              onChange={(slideshowEnabled) => updateSettings({ slideshowEnabled })}
            />
            {settings.slideshowEnabled && <PhotoUrlsField settings={settings} />}
          </Section>

          <Section title="Calendar">
            <EmbedUrlField settings={settings} />
          </Section>

          <Section title="Reset">
            <Button
              onClick={() => {
                if (window.confirm("Reset all settings to their defaults?")) {
                  resetSettings();
                  onClose();
                }
              }}
            >
              Reset all settings
            </Button>
          </Section>
        </div>
      </div>
    </div>
  );
}

function LocationField({ settings }: { settings: Settings }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[] | null>(null);
  const [status, setStatus] = useState<"idle" | "searching" | "error">("idle");
  const loc = settings.weatherLocation;

  const search = async (e: FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setStatus("searching");
    try {
      setResults(await searchPlaces(query));
      setStatus("idle");
    } catch {
      setResults(null);
      setStatus("error");
    }
  };

  return (
    <Field
      label="Location"
      hint="Search for a city (e.g. “Brooklyn” or “Portland, Maine”) or a US ZIP code. Only the town is saved, never a precise address."
    >
      {loc && (
        <div className="mb-3 flex items-center gap-3 rounded-2xl bg-accent-soft px-4 py-3">
          <MapPin className="size-5 shrink-0 text-accent" aria-hidden />
          <span className="flex-1">
            <span className="block text-[17px] font-medium">{loc.name}</span>
            {loc.region && <span className="block text-[15px] text-muted">{loc.region}</span>}
          </span>
          <Button
            variant="ghost"
            className="min-h-12"
            onClick={() => updateSettings({ weatherLocation: null })}
          >
            Remove
          </Button>
        </div>
      )}
      <form onSubmit={search} className="flex gap-2">
        <input
          className={inputClass}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="City or ZIP code"
          aria-label="City or ZIP code"
          enterKeyHint="search"
          autoComplete="off"
        />
        <Button
          type="submit"
          variant="primary"
          aria-label="Search location"
          disabled={status === "searching"}
        >
          {status === "searching" ? (
            <LoaderCircle className="size-5 animate-spin" aria-hidden />
          ) : (
            <Search className="size-5" aria-hidden />
          )}
        </Button>
      </form>
      {status === "error" && (
        <p role="alert" className="mt-3 text-[15px] text-danger">
          Couldn’t search right now. Check the internet connection and try again.
        </p>
      )}
      {results && (
        <ul className="mt-3 space-y-2" aria-label="Matching places">
          {results.length === 0 && <li className="text-[15px] text-muted">No places found.</li>}
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-line-strong bg-surface-2 px-4 text-left active:bg-surface-3"
                onClick={() => {
                  updateSettings({
                    weatherLocation: {
                      name: r.name,
                      region: r.region,
                      latitude: r.latitude,
                      longitude: r.longitude,
                    },
                  });
                  setResults(null);
                  setQuery("");
                }}
              >
                <span className="flex-1">
                  <span className="text-[17px] font-medium">{r.name}</span>{" "}
                  {r.region && <span className="ml-2 text-[15px] text-muted">{r.region}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Field>
  );
}

function PhotoUrlsField({ settings }: { settings: Settings }) {
  const [text, setText] = useState(settings.photoUrls.join("\n"));
  const [saved, setSaved] = useState(false);
  const parsed = text
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const invalid = parsed.filter((u) => !/^https?:\/\//.test(u));

  return (
    <Field
      label="Extra photo links (optional)"
      hint="Photos placed in the app’s photos folder are shown automatically. You can also add image web addresses here, one per line."
    >
      <textarea
        className={`${inputClass} min-h-28 py-3 font-mono text-[14px]`}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
        placeholder="https://example.com/photo.jpg"
        aria-label="Photo links, one per line"
        spellCheck={false}
      />
      {invalid.length > 0 && (
        <p className="mt-2 text-[15px] text-danger">Links must start with http:// or https://</p>
      )}
      <Button
        className="mt-3"
        disabled={invalid.length > 0}
        onClick={() => {
          updateSettings({ photoUrls: parsed });
          setSaved(true);
        }}
      >
        {saved ? <Check className="size-5" aria-hidden /> : null}
        {saved ? "Saved" : "Save photo links"}
      </Button>
    </Field>
  );
}

function EmbedUrlField({ settings }: { settings: Settings }) {
  const [text, setText] = useState(settings.calendarEmbedUrl);
  const [saved, setSaved] = useState(false);
  const valid = isValidEmbedUrl(text.trim());
  const isDefault = settings.calendarEmbedUrl === DEFAULT_CALENDAR_EMBED_URL;

  return (
    <Field
      label="Google Calendar embed link"
      hint="From Google Calendar: Settings → your calendar → Integrate calendar → Embed code. Paste just the link (it starts with https://calendar.google.com/calendar/embed)."
    >
      <textarea
        className={`${inputClass} min-h-28 py-3 font-mono text-[14px] break-all`}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
        aria-label="Google Calendar embed link"
        spellCheck={false}
      />
      {!valid && text.trim() && (
        <p className="mt-2 text-[15px] text-danger">
          This doesn’t look like a Google Calendar embed link.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          disabled={!valid || text.trim() === settings.calendarEmbedUrl}
          onClick={() => {
            updateSettings({ calendarEmbedUrl: text.trim() });
            setSaved(true);
          }}
        >
          {saved && <Check className="size-5" aria-hidden />}
          {saved ? "Saved" : "Save link"}
        </Button>
        <Button
          variant="ghost"
          disabled={isDefault && text === DEFAULT_CALENDAR_EMBED_URL}
          onClick={() => {
            updateSettings({ calendarEmbedUrl: DEFAULT_CALENDAR_EMBED_URL });
            setText(DEFAULT_CALENDAR_EMBED_URL);
            setSaved(false);
          }}
        >
          Restore default
        </Button>
      </div>
    </Field>
  );
}
