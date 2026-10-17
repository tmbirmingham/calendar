# Family Wall Calendar

A touch-first family dashboard meant to run full-screen on a wall-mounted touchscreen
(built for an HP Pavilion 23-h120 all-in-one running Ubuntu). It shows the family's shared
Google Calendar, a live clock, the local weather, and an ambient clock/photo screen for when
nobody is using it.

Built with Next.js 16, React 19, TypeScript, Tailwind CSS 4 and Lucide icons. There's no
database, no accounts, and no OAuth. Preferences are stored in the browser.

## Features

- **Home**: a large Google Calendar embed, with a side panel for weather, upcoming events
  and household items.
- **Calendar**: the calendar at full width, with big Month / Week / Agenda buttons, reload,
  help, and "Open in Google".
- **Household**: a placeholder for chores, grocery lists and notes (planned for a later version).
- **Ambient**: a large clock, the date and the weather, plus an optional photo slideshow.
  Tap anywhere (or the ✕) to go back. It starts on its own after a configurable idle time.
- **Weather**: current temperature, conditions, an icon, today's high/low and a 4-day
  outlook from [Open-Meteo](https://open-meteo.com) (free, no API key needed).
- **Settings**: theme (dark, light or automatic), calendar text size, an optional dark
  calendar, weather on/off, location, °F/°C, the ambient timeout, the slideshow and photo
  links, and the calendar embed link.
- **Graceful failures**: an offline notice, a "can't reach Google" message, a load timeout,
  and help for private calendars. Weather failures never block the calendar, and the last
  good reading is kept and marked when it's out of date.

## Requirements

- Node.js **20.9 or newer**. Node 22 LTS is recommended. Ubuntu's own `apt` Node is often too
  old. Use [NodeSource](https://github.com/nodesource/distributions) or `nvm`.
- npm (comes with Node).
- Chromium or Google Chrome for kiosk use.

## Run it

```bash
git clone https://github.com/tmbirmingham/calendar.git ~/calendar
cd ~/calendar
npm ci
```

**Development** (hot reload):

```bash
npm run dev            # http://localhost:3000
```

**Production** (use this on the wall):

```bash
npm run build
npm start              # http://localhost:3000
# Only reachable from this computer:
npm start -- -H 127.0.0.1 -p 3000
```

**Checks:**

```bash
npm run lint
npm run typecheck
npm run build
```

## Configuration

Everything an everyday user changes is under **Settings** (the gear icon, top right) and is
saved in this browser's `localStorage`. Nothing secret is ever stored there.

| Setting | Default | Notes |
| --- | --- | --- |
| Theme | Dark | Dark, Light, or Automatic (follows Ubuntu's appearance setting). |
| Calendar text size | Large (115%) | Scales the Google embed so it can be read from across the room. |
| Dark calendar | Off | Inverts Google's (always white) calendar to suit the dark theme. Event colors shift slightly. |
| Show weather | On | Turning it off hides weather everywhere. |
| Location | *none* | Search for a city ("Portland, Maine") or a US ZIP code and tap a result. Only the town's coordinates are saved. |
| Units | °F | °F or °C. |
| Ambient timeout | 10 min | Never, 2, 5, 10, 15 or 30 minutes of inactivity. |
| Photo slideshow | Off | See *Photos* below. |
| Calendar embed link | The family calendar | Must be a `https://calendar.google.com/calendar/embed?...` link. "Restore default" puts the original back. |

### Google Calendar

The default calendar is set in one place, `src/config/calendar.ts`
(`DEFAULT_CALENDAR_EMBED_URL`). It keeps `ctz=America/New_York`. The app adds display
options (view mode, and hiding Google's small title, print and tab controls) when it builds
the iframe URL.

The embed is the source of truth. The app does **not** read events out of it, and it doesn't
use the Google Calendar API. For the embed to show events, one of these must be true:

1. **The calendar is shared publicly** (Google Calendar → Settings → the calendar → *Access
   permissions* → *Make available to public* → "See all event details"). This is the simplest
   and most reliable option for a wall display. Anyone with the link can then see the events.
2. **This Chromium profile is signed in** to a Google account that can see the calendar. Open
   Chromium normally once, sign in at calendar.google.com, and then start kiosk mode with the
   same profile. Because the calendar is embedded in another site (localhost), Chromium must
   allow Google's cookies there. If you've blocked third-party cookies, add
   `[*.]google.com` under *Settings → Privacy and security → Third-party cookies → Allowed to
   use third-party cookies*.

If neither is true, Google shows its own sign-in or "no permission" message inside the
frame. The app can't detect that (it's cross-origin), so the **?** button on the calendar
explains what to do and offers **Reload** and **Open in Google Calendar**.

The embed doesn't refresh itself, so the app reloads it every 30 minutes and whenever the
network comes back. Tap the reload button to update it right away.

### Weather

Weather comes from Open-Meteo's free forecast and geocoding APIs, called directly from the
browser. There's no key, account or backend. Readings refresh every 15 minutes and failed
requests retry every 5 minutes. The last good reading is cached and shown with a "not
updated recently" note after an hour. Open-Meteo's free tier is for non-commercial use,
which suits a family wall display.

### Photos (ambient slideshow)

1. Copy pictures (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`) into the `photos/`
   folder in this repo. To use another folder, set `PHOTOS_DIR=/path/to/folder` before
   `npm start` (or in the systemd service).
2. Turn on **Settings → Ambient display → Photo slideshow**.

New photos are picked up the next time ambient mode opens. No rebuild or restart is needed.
Photos change every 30 seconds. You can also paste web image links (one per line) in
Settings. The folder's contents are git-ignored, so family photos never get committed.

## Kiosk setup (Ubuntu)

Everything here is optional, lives in `kiosk/`, and is separate from the app itself. None of
these steps need `sudo` except installing packages.

1. **Install Chromium:** `sudo snap install chromium`
2. **Run the app at login** with a systemd *user* service:

   ```bash
   cd ~/calendar && npm ci && npm run build
   mkdir -p ~/.config/systemd/user
   cp kiosk/family-calendar.service ~/.config/systemd/user/
   # Check WorkingDirectory and the npm path (`which npm`) in the file first.
   systemctl --user daemon-reload
   systemctl --user enable --now family-calendar.service
   journalctl --user -u family-calendar -f     # view logs
   ```

   For the service to start before anyone logs in, also run `loginctl enable-linger $USER`.
   You'll still want automatic login for the browser (step 4).
3. **Open the browser full-screen at login:**

   ```bash
   mkdir -p ~/.config/autostart
   cp kiosk/family-calendar-kiosk.desktop ~/.config/autostart/
   ```

   `kiosk/start-kiosk.sh` waits for the app and then starts Chromium with
   `--app=http://localhost:3000 --start-fullscreen`. That mode has no browser UI, but links
   such as *Open in Google Calendar* open in a normal window that you can close by tapping
   its ✕. For a fully locked-down `--kiosk` window, set `KIOSK_STRICT=1`. In that mode, pages
   opened from the dashboard cover it and need a keyboard to close (Ctrl+W).
   To launch by hand: `./kiosk/start-kiosk.sh`
4. **Automatic login:** *Settings → System → Users → Automatic Login*.
5. **Keep the screen on:** *Settings → Power → Screen Blank → Never*, or run
   `gsettings set org.gnome.desktop.session idle-delay 0` and
   `gsettings set org.gnome.desktop.screensaver lock-enabled false`.
6. **On-screen keyboard** (needed to type a weather location by touch): *Settings →
   Accessibility → Typing → Screen Keyboard*. If it doesn't pop up in Chromium under
   Wayland, add `--enable-wayland-ime` to the flags in `start-kiosk.sh`.

To quit kiosk mode with a keyboard, press **Alt+F4**. To stop the app, run
`systemctl --user stop family-calendar`.

### Screen dimming and night-time

A web page can't control the display's brightness or power. Ambient mode only shows a darker,
calmer screen. For real dimming, use the OS:

- **Turn the screen off on a schedule.** On an X11 session ("Ubuntu on Xorg" at the login
  screen), add `crontab -e` entries such as
  `0 23 * * * DISPLAY=:0 xset dpms force off`. A tap wakes the screen. Wayland sessions don't
  support `xset`, so use GNOME's *Screen Blank* delay there instead.
- **Backlight brightness.** If `ls /sys/class/backlight` lists a device, `brightnessctl`
  (`sudo apt install brightnessctl`) can set it, for example `brightnessctl set 30%` from cron.
  This hasn't been verified on the HP Pavilion 23-h120. Some all-in-ones don't expose
  backlight control to Linux.

Touch calibration and touchscreen drivers are handled by Ubuntu, not by this app.

## Project structure

```
src/
  app/
    layout.tsx            root layout, sets the theme before the first paint
    page.tsx              renders <App />
    api/photos/           lists and serves slideshow images from PHOTOS_DIR
  config/calendar.ts      the Google Calendar embed URL and URL helpers
  lib/
    settings.ts           localStorage-backed preferences (useSettings / updateSettings)
    weather.ts            Open-Meteo client and weather-code descriptions
    events.ts             upcoming-events source (placeholder; see below)
  hooks/                  useNow (shared clock), useWeather, useIdle, usePhotos, useOnline
  components/             App shell, NavRail, Header, CalendarPanel, Weather, AmbientMode,
                          SettingsPanel, UpcomingEvents, Household, ui primitives
kiosk/                    optional Ubuntu kiosk launcher, systemd and autostart files
photos/                   drop slideshow images here (git-ignored)
```

## Known limitations

- **No event list yet.** Events can't be read from Google's embed, so the "Upcoming" panel
  is a labeled placeholder with a shortcut to the Agenda view. The ambient screen's "Next up"
  only appears once a real source exists. To add one, implement `useUpcomingEvents` in
  `src/lib/events.ts`.
- **Private calendars** need public sharing or a signed-in browser profile (see above). The
  app can't tell whether Google is showing a sign-in page inside the frame.
- **Idle detection and the calendar.** Taps inside Google's iframe aren't visible to the
  page. Only the first tap there resets the ambient timer, so ambient mode may start while
  someone is scrolling the calendar itself. One tap brings the dashboard back.
- **Google's own controls** inside the embed (today, arrows, date picker) are sized by Google.
  The *Calendar text size* setting scales them up.
- **The reachability check** uses `https://www.gstatic.com/generate_204` (Google's
  connectivity-check URL). A network filter that blocks it would show a false "can't reach
  Google" message.
- Settings are stored per browser profile, so they aren't shared between devices.

## Next phase ideas

- A real upcoming-events list via the Google Calendar API (read-only) or the calendar's
  private iCal feed, fetched server-side so no secret reaches the browser.
- Household tools: chores, a grocery list and notes, which will need simple shared storage.
- Scheduled night mode (an automatic dim theme by time of day).
