"use client";

import { useEffect, useState } from "react";

/** Local photos (served by /api/photos) plus any configured image URLs. */
export function usePhotos(enabled: boolean, extraUrls: string[]): string[] {
  const [local, setLocal] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    fetch("/api/photos", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { photos: [] }))
      .then((json: { photos?: string[] }) => setLocal(json.photos ?? []))
      .catch(() => {
        // No photos is a fine outcome; the ambient screen works without them.
      });
    return () => controller.abort();
  }, [enabled]);

  return enabled ? [...local, ...extraUrls] : [];
}
