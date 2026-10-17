"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  CircleHelp,
  ExternalLink,
  LoaderCircle,
  Maximize2,
  RefreshCw,
  TriangleAlert,
  WifiOff,
  X,
} from "lucide-react";
import {
  buildEmbedUrl,
  CALENDAR_MODES,
  openInGoogleUrl,
  type CalendarMode,
} from "@/config/calendar";
import { useOnline } from "@/hooks/useOnline";
import { Button, IconButton, LinkButton, Segmented, cx } from "./ui";

const LOAD_TIMEOUT_MS = 20_000;
const AUTO_REFRESH_MS = 30 * 60_000;
const CONNECTIVITY_URL = "https://www.gstatic.com/generate_204";

type FrameStatus = "loading" | "loaded" | "timeout" | "unreachable";

const noopSubscribe = () => () => {};

/** False during server rendering and hydration, true afterwards. */
function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function CalendarPanel({
  embedUrl,
  mode,
  onModeChange,
  scale,
  dark,
  onExpand,
}: {
  embedUrl: string;
  mode: CalendarMode;
  onModeChange: (mode: CalendarMode) => void;
  scale: number;
  dark: boolean;
  /** Shown on the home screen to jump to the full-size calendar view. */
  onExpand?: () => void;
}) {
  const online = useOnline();
  const [reloadKey, setReloadKey] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const src = buildEmbedUrl(embedUrl, mode);
  const reload = () => setReloadKey((k) => k + 1);

  // Keep an always-on display current: Google's embed doesn't refresh itself.
  useEffect(() => {
    const id = setInterval(() => {
      if (navigator.onLine && document.visibilityState === "visible") setReloadKey((k) => k + 1);
    }, AUTO_REFRESH_MS);
    const onOnline = () => setReloadKey((k) => k + 1);
    window.addEventListener("online", onOnline);
    return () => {
      clearInterval(id);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return (
    <section
      aria-label="Family calendar"
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-line bg-surface"
    >
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        <div className="w-full max-w-sm min-w-64 flex-1">
          <Segmented
            label="Calendar view"
            value={mode}
            options={CALENDAR_MODES}
            onChange={onModeChange}
          />
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <IconButton label="Reload calendar" onClick={reload}>
            <RefreshCw className="size-6" />
          </IconButton>
          <IconButton label="Calendar help" onClick={() => setHelpOpen(true)}>
            <CircleHelp className="size-6" />
          </IconButton>
          {onExpand && (
            <IconButton label="Show larger calendar" onClick={onExpand}>
              <Maximize2 className="size-6" />
            </IconButton>
          )}
          <LinkButton href={openInGoogleUrl(embedUrl)} className="hidden xl:inline-flex">
            <ExternalLink className="size-5" aria-hidden />
            Open in Google
          </LinkButton>
        </div>
      </div>

      <div
        className="relative min-h-0 flex-1 overflow-hidden"
        style={{ background: dark ? "#1b1b1b" : "#ffffff" }}
      >
        <CalendarFrame
          key={`${reloadKey}:${src}`}
          src={src}
          scale={scale}
          dark={dark}
          online={online}
          onRetry={reload}
          openUrl={openInGoogleUrl(embedUrl)}
        />
        {helpOpen && (
          <CalendarHelp
            openUrl={openInGoogleUrl(embedUrl)}
            onRetry={reload}
            onClose={() => setHelpOpen(false)}
          />
        )}
      </div>
    </section>
  );
}

/** One load attempt of the iframe. Remounted (via key) to retry. */
function CalendarFrame({
  src,
  scale,
  dark,
  online,
  onRetry,
  openUrl,
}: {
  src: string;
  scale: number;
  dark: boolean;
  online: boolean;
  onRetry: () => void;
  openUrl: string;
}) {
  const [status, setStatus] = useState<FrameStatus>("loading");
  // Only create the iframe once React can hear its load event; a server-rendered
  // iframe can finish loading before hydration and the event would be missed.
  const hydrated = useHydrated();

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(
      () => setStatus((s) => (s === "loading" ? "timeout" : s)),
      LOAD_TIMEOUT_MS,
    );
    // Iframes don't report network failures (Chrome fires "load" for its own
    // error page), so separately check that Google is reachable using its
    // connectivity-check endpoint. The opaque response is never read.
    fetch(CONNECTIVITY_URL, {
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    }).catch(() => {
      if (!controller.signal.aborted) setStatus("unreachable");
    });
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  const failure: FrameStatus | "offline" | null = !online
    ? "offline"
    : status === "timeout" || status === "unreachable"
      ? status
      : null;

  return (
    <>
      {hydrated && (
        <iframe
          title="Family Google Calendar"
          src={src}
          onLoad={() => setStatus((s) => (s === "unreachable" ? s : "loaded"))}
          className={cx(
            "absolute top-0 left-0 origin-top-left border-0 transition-opacity duration-300",
            status === "loaded" && !failure ? "opacity-100" : "opacity-0",
          )}
          style={{
            width: `${100 / scale}%`,
            height: `${100 / scale}%`,
            transform: `scale(${scale})`,
            filter: dark ? "invert(0.9) hue-rotate(180deg)" : undefined,
          }}
        />
      )}
      {status === "loading" && !failure && (
        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-surface text-lg text-muted">
          <LoaderCircle className="size-7 animate-spin" aria-hidden />
          Loading calendar…
        </div>
      )}
      {failure && (
        <div
          role="alert"
          className="animate-fade-in absolute inset-0 flex flex-col items-center justify-center gap-5 bg-surface p-8 text-center"
        >
          {failure === "offline" ? (
            <WifiOff className="size-12 text-warm" aria-hidden />
          ) : (
            <TriangleAlert className="size-12 text-warm" aria-hidden />
          )}
          <div className="max-w-lg">
            <h3 className="text-2xl font-semibold text-ink">
              {failure === "offline"
                ? "No internet connection"
                : failure === "unreachable"
                  ? "Can’t reach Google Calendar"
                  : "The calendar is taking a long time to load"}
            </h3>
            <p className="mt-2 text-lg text-muted">
              {failure === "offline"
                ? "The calendar will come back on its own once the connection returns."
                : "Check the Wi-Fi connection, then try again."}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="primary" onClick={onRetry}>
              <RefreshCw className="size-5" aria-hidden />
              Try again
            </Button>
            <LinkButton href={openUrl}>
              <ExternalLink className="size-5" aria-hidden />
              Open Google Calendar
            </LinkButton>
          </div>
        </div>
      )}
    </>
  );
}

function CalendarHelp({
  openUrl,
  onRetry,
  onClose,
}: {
  openUrl: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-help-title"
      className="animate-fade-in absolute inset-0 z-10 flex items-center justify-center bg-black/50 p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl border border-line-strong bg-surface p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 id="calendar-help-title" className="text-2xl font-semibold text-ink">
            Calendar not showing?
          </h3>
          <IconButton label="Close help" onClick={onClose} autoFocus>
            <X className="size-6" />
          </IconButton>
        </div>
        <ul className="mt-4 list-disc space-y-3 pl-5 text-[17px] leading-relaxed text-muted">
          <li>
            If you see a Google sign-in page or a “permission” message, the calendar is private.
            Either sign in to Google in this browser, or have the calendar owner change its sharing
            settings in Google Calendar.
          </li>
          <li>If the calendar is blank or shows an error, check the Wi-Fi and reload.</li>
          <li>
            Events added on a phone appear here within 30 minutes, or right away after a reload.
          </li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            variant="primary"
            onClick={() => {
              onRetry();
              onClose();
            }}
          >
            <RefreshCw className="size-5" aria-hidden />
            Reload calendar
          </Button>
          <LinkButton href={openUrl}>
            <ExternalLink className="size-5" aria-hidden />
            Open in Google Calendar
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
