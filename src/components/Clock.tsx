"use client";

import { useNow } from "@/hooks/useNow";
import { cx } from "./ui";

export function formatTime(d: Date) {
  return d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    .replace(/\s?[AP]M$/i, "");
}

export function formatMeridiem(d: Date) {
  const m = d.toLocaleTimeString("en-US", { hour: "numeric" }).match(/[AP]M/i);
  return m ? m[0].toUpperCase() : "";
}

export function formatDate(d: Date, style: "long" | "short" = "long") {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: style === "long" ? "long" : "short",
    day: "numeric",
  });
}

/** Live clock; renders a same-sized placeholder until the browser takes over. */
export function Clock({
  className,
  meridiemClassName,
}: {
  className?: string;
  meridiemClassName?: string;
}) {
  const now = useNow();
  return (
    <time
      className={cx("tabular inline-flex items-baseline font-semibold tracking-tight", className)}
      dateTime={now?.toISOString()}
      aria-live="off"
    >
      <span className={cx(!now && "invisible")}>{now ? formatTime(now) : "12:00"}</span>
      <span
        className={cx("ml-[0.25em] font-medium text-muted", meridiemClassName, !now && "invisible")}
      >
        {now ? formatMeridiem(now) : "PM"}
      </span>
    </time>
  );
}

export function DateLine({ className, style }: { className?: string; style?: "long" | "short" }) {
  const now = useNow();
  return (
    <p className={cx(className, !now && "invisible")}>
      {now ? formatDate(now, style) : "Wednesday, September 30"}
    </p>
  );
}
