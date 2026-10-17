/**
 * Upcoming-events data source.
 *
 * The MVP shows the calendar through Google's embed only, and the embed's
 * contents can't (and shouldn't) be read by this app. So there is no event
 * source yet, and the UI shows an honest placeholder instead of sample data.
 *
 * A later phase can implement `loadUpcomingEvents` with the official Google
 * Calendar API (or a public ICS feed); every consumer already handles the
 * "no source configured" case.
 */
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location?: string;
}

export type EventSourceStatus =
  | { kind: "unconfigured" }
  | { kind: "ready"; events: CalendarEvent[] };

export function useUpcomingEvents(): EventSourceStatus {
  return { kind: "unconfigured" };
}
