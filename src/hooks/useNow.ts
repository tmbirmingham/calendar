"use client";

import { useSyncExternalStore } from "react";

// One shared ticker for every clock on screen. The snapshot only changes when
// the minute changes, so components re-render once a minute, right on time.
let minute = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function currentMinute() {
  return Math.floor(Date.now() / 60_000) * 60_000;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    timer = setInterval(() => {
      const m = currentMinute();
      if (m !== minute) {
        minute = m;
        listeners.forEach((l) => l());
      }
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

function getSnapshot() {
  if (!minute) minute = currentMinute();
  return minute;
}

/** Current time (minute precision), or null during server rendering. */
export function useNow(): Date | null {
  const value = useSyncExternalStore(subscribe, getSnapshot, () => 0);
  return value ? new Date(value) : null;
}
