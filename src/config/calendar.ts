/**
 * Google Calendar configuration — the single place the embed URL lives.
 *
 * The owner can override the URL in Settings; this is the default used on a
 * fresh install. Sharing permissions are managed in Google Calendar itself.
 */
export const DEFAULT_CALENDAR_EMBED_URL =
  "https://calendar.google.com/calendar/embed?src=c_b719e4567359eab2c0f0ccb0eb6e08e90615154eb335d4ac3c8b4762344944d9%40group.calendar.google.com&ctz=America%2FNew_York";

export const DEFAULT_TIME_ZONE = "America/New_York";

export type CalendarMode = "MONTH" | "WEEK" | "AGENDA";

export const CALENDAR_MODES: { value: CalendarMode; label: string }[] = [
  { value: "MONTH", label: "Month" },
  { value: "WEEK", label: "Week" },
  { value: "AGENDA", label: "Agenda" },
];

/** Accept only Google Calendar embed URLs so the iframe can't be pointed elsewhere. */
export function isValidEmbedUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "calendar.google.com" &&
      url.pathname.startsWith("/calendar/embed") &&
      url.searchParams.has("src")
    );
  } catch {
    return false;
  }
}

/**
 * Build the iframe URL: keep the owner's calendar(s) and time zone, and apply
 * display options that suit a wall display (our own view switcher replaces
 * Google's small tabs).
 */
export function buildEmbedUrl(baseUrl: string, mode: CalendarMode): string {
  const url = new URL(isValidEmbedUrl(baseUrl) ? baseUrl : DEFAULT_CALENDAR_EMBED_URL);
  const params = url.searchParams;
  if (!params.has("ctz")) params.set("ctz", DEFAULT_TIME_ZONE);
  params.set("mode", mode);
  params.set("showTitle", "0");
  params.set("showPrint", "0");
  params.set("showTabs", "0");
  params.set("showCalendars", "0");
  params.set("showTz", "0");
  return url.toString();
}

/** Full-page URL for opening the calendar outside the dashboard. */
export function openInGoogleUrl(baseUrl: string): string {
  return isValidEmbedUrl(baseUrl) ? baseUrl : DEFAULT_CALENDAR_EMBED_URL;
}

export function calendarTimeZone(baseUrl: string): string {
  try {
    return new URL(baseUrl).searchParams.get("ctz") || DEFAULT_TIME_ZONE;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}
