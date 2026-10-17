"use client";

import { CalendarClock, ExternalLink, Rows3 } from "lucide-react";
import { useUpcomingEvents } from "@/lib/events";
import { Button, LinkButton, Panel } from "./ui";

/**
 * Upcoming events. There is no authorized event feed in the MVP, so this shows
 * a clear placeholder rather than invented events. When `useUpcomingEvents`
 * gains a real source, the list renders here.
 */
export function UpcomingEvents({
  onShowAgenda,
  openUrl,
}: {
  onShowAgenda: () => void;
  openUrl: string;
}) {
  const source = useUpcomingEvents();

  return (
    <Panel title="Upcoming" icon={<CalendarClock className="size-5" aria-hidden />}>
      {source.kind === "ready" && source.events.length > 0 ? (
        <ul className="divide-y divide-line">
          {source.events.map((e) => (
            <li key={e.id} className="py-3">
              <div className="text-[17px] font-medium">{e.title}</div>
              <div className="text-[15px] text-muted">
                {e.start.toLocaleString("en-US", {
                  weekday: "short",
                  hour: e.allDay ? undefined : "numeric",
                  minute: e.allDay ? undefined : "2-digit",
                })}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-4">
          <p className="text-[17px] leading-relaxed text-muted">
            {source.kind === "ready"
              ? "Nothing coming up."
              : "A list of upcoming events will appear here in a future update. For now, the agenda view shows what’s next."}
          </p>
          <div className="flex flex-col gap-2.5">
            <Button variant="primary" onClick={onShowAgenda}>
              <Rows3 className="size-5" aria-hidden />
              Show agenda
            </Button>
            <LinkButton href={openUrl}>
              <ExternalLink className="size-5" aria-hidden />
              Open Google Calendar
            </LinkButton>
          </div>
        </div>
      )}
    </Panel>
  );
}
