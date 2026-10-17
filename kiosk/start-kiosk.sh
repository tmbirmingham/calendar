#!/usr/bin/env bash
# Opens the family calendar full-screen in Chromium once the app is up.
# Optional: used by family-calendar-kiosk.desktop (autostart). See README → Kiosk setup.
set -u

URL="${FAMILY_CALENDAR_URL:-http://localhost:3000}"

# Wait up to 2 minutes for the app server (it may still be starting at login).
for _ in $(seq 1 60); do
  curl -fsS -o /dev/null "$URL" && break
  sleep 2
done

BROWSER="$(command -v chromium || command -v chromium-browser || command -v google-chrome || true)"
if [ -z "$BROWSER" ]; then
  echo "Chromium not found. Install it with: sudo snap install chromium" >&2
  exit 1
fi

# --app + --start-fullscreen: no browser UI, but links opened from the
# dashboard (e.g. "Open in Google Calendar") get a normal window with a close
# button you can tap. Use KIOSK_STRICT=1 for true --kiosk mode instead.
MODE_FLAGS=(--app="$URL" --start-fullscreen)
if [ "${KIOSK_STRICT:-0}" = "1" ]; then
  MODE_FLAGS=(--kiosk "$URL")
fi

exec "$BROWSER" \
  "${MODE_FLAGS[@]}" \
  --noerrdialogs \
  --disable-session-crashed-bubble \
  --disable-infobars \
  --no-first-run \
  --disable-features=Translate \
  --overscroll-history-navigation=0 \
  --disable-pinch \
  --check-for-update-interval=31536000
