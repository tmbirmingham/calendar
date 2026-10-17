"use client";

import { ChevronRight, House, ListChecks, ShoppingCart, StickyNote } from "lucide-react";
import { Panel } from "./ui";

const PLANNED = [
  { icon: ListChecks, title: "Chores & tasks", text: "Shared to-dos with who’s doing what." },
  {
    icon: ShoppingCart,
    title: "Grocery list",
    text: "Add items from the wall, check them off at the store.",
  },
  { icon: StickyNote, title: "Notes", text: "Quick messages and reminders for each other." },
];

export function HouseholdView() {
  return (
    <div className="touch-scroll h-full">
      <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-center gap-8 p-2 py-8">
        <div>
          <h2 className="text-4xl font-semibold tracking-tight">Household</h2>
          <p className="mt-3 max-w-2xl text-xl leading-relaxed text-muted">
            This space is reserved for the household tools coming in the next version. Nothing here
            is active yet.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANNED.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-3xl border border-line bg-surface p-6">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                <Icon className="size-7" aria-hidden />
              </div>
              <h3 className="mt-5 text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-[17px] leading-relaxed text-muted">{text}</p>
              <span className="mt-4 inline-block rounded-full bg-surface-2 px-3 py-1 text-sm font-medium text-muted">
                Coming soon
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Small teaser on the home screen that opens the Household view. */
export function HouseholdTeaser({ onOpen }: { onOpen: () => void }) {
  return (
    <Panel className="p-0">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-20 w-full items-center gap-4 rounded-3xl p-5 text-left active:bg-surface-2"
      >
        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <House className="size-6" aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block text-[17px] font-semibold">Household</span>
          <span className="block text-[15px] text-muted">
            Chores, groceries &amp; notes — coming soon
          </span>
        </span>
        <ChevronRight className="size-6 text-faint" aria-hidden />
      </button>
    </Panel>
  );
}
