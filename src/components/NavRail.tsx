"use client";

import { CalendarDays, House, LayoutDashboard, MoonStar } from "lucide-react";
import { cx } from "./ui";

export type View = "home" | "calendar" | "household";

const ITEMS = [
  { id: "home", label: "Home", icon: LayoutDashboard },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "household", label: "Household", icon: House },
] as const;

function NavButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: typeof House;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cx(
        "flex min-h-[72px] flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl px-1 text-[13px] font-medium transition-colors duration-150 md:w-full md:flex-none",
        active ? "bg-accent-soft text-accent" : "text-muted active:bg-surface-2 active:text-ink",
      )}
    >
      <Icon className="size-7" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
      {label}
    </button>
  );
}

/** Persistent navigation: a left rail on landscape screens, a bottom bar on narrow ones. */
export function NavRail({
  view,
  onNavigate,
  onAmbient,
}: {
  view: View;
  onNavigate: (view: View) => void;
  onAmbient: () => void;
}) {
  return (
    <nav
      aria-label="Main"
      className="order-last flex shrink-0 gap-1 border-t border-line bg-surface px-2 py-2 md:order-first md:w-[104px] md:flex-col md:border-t-0 md:border-r md:px-3 md:py-4"
    >
      {ITEMS.map((item) => (
        <NavButton
          key={item.id}
          label={item.label}
          icon={item.icon}
          active={view === item.id}
          onClick={() => onNavigate(item.id)}
        />
      ))}
      <div className="hidden md:block md:flex-1" />
      <NavButton label="Ambient" icon={MoonStar} onClick={onAmbient} />
    </nav>
  );
}
