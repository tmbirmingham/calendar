"use client";

import { useEffect, useRef } from "react";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

/**
 * Calls `onIdle` after `timeoutMs` without user activity. Taps inside the
 * Google Calendar iframe aren't visible to the page; the first one is caught
 * via the window losing focus to the iframe.
 */
export function useIdle(timeoutMs: number, enabled: boolean, onIdle: () => void) {
  const onIdleRef = useRef(onIdle);
  useEffect(() => {
    onIdleRef.current = onIdle;
  });

  useEffect(() => {
    if (!enabled || timeoutMs <= 0) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => onIdleRef.current(), timeoutMs);
    };
    reset();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    window.addEventListener("blur", reset);
    return () => {
      clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, reset));
      window.removeEventListener("blur", reset);
    };
  }, [timeoutMs, enabled]);
}
