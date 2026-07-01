---
name: run-trackme
description: Build, launch, screenshot, and drive the TrackMe app (Expo Router / React Native + web). Use to run TrackMe, start the web app, take screenshots of the auth / map / watcher screens, or verify UI changes end-to-end.
---

# Run TrackMe

TrackMe is an Expo Router app (React Native for iOS/Android + web). `react-native-maps`
and background location are native-only, but the whole app — auth, the web home, and the
zero-install watcher — runs on **web**, so the harness drives the **web export** with
**headless Chrome over the DevTools Protocol**. No Playwright/puppeteer: `driver.mjs`
serves `dist/` with a built-in static server and talks CDP over Node's global `WebSocket`.

All paths below are relative to the repo root (the `<unit>` dir). The driver lives at
`.claude/skills/run-trackme/driver.mjs`; screenshots land in
`.claude/skills/run-trackme/screenshots/`.

## Prerequisites

- **Node 22+** (`node -v` → `v22.19.0` here) and **Google Chrome** (or Edge). The driver
  auto-detects `C:/Program Files/Google/Chrome/Application/chrome.exe`; override with
  `CHROME_PATH` if elsewhere.
- **`.env.local`** with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  (already present in this repo). The auth screen renders without them, but the watcher
  route needs them to reach Supabase.

No `apt-get` — this is a Windows host with Chrome already installed.

## Build

Produce the static web bundle into `dist/` (rebuild after any code change):

```bash
npx expo export --platform web
```

## Run (agent path) — the driver

Screenshot every route and assert each renders (non-empty body, correct dynamic-route
fallback). Exits non-zero if a route 404s:

```bash
node .claude/skills/run-trackme/driver.mjs shots
```

Drive the auth form end-to-end — submits the empty form and asserts the client-side
inline validation renders ("Enter your email." / "Enter your password."):

```bash
node .claude/skills/run-trackme/driver.mjs flow
```

Screenshot specific routes (pass **without** a leading slash — see Gotchas):

```bash
node .claude/skills/run-trackme/driver.mjs shots auth explore
```

Screenshots are written to `.claude/skills/run-trackme/screenshots/*.png` — open them to
verify. `shots` prints one line per route (`✓ /auth  text=…  → …png`); `flow` prints
whether validation fired.

## Run (human path)

The interactive dev server (opens a browser, watches files, useless headless):

```bash
npx expo start --web
```

Verified here with `npx expo start --web --port 8099` → `curl http://localhost:8099/auth`
returned `HTTP 200`. `npm run web` is the same command on the default port 8081.

## Watcher live demo (optional)

To see the watcher map actually move, seed a journey (needs `SUPABASE_SERVICE_ROLE_KEY`
in `.env.local`) and open the printed `/watch/<token>` URL:

```bash
npm run seed:watch
```

Without a real token the watcher page correctly shows "Link unavailable" (expected).

## Test

```bash
npx vitest run
```

## Gotchas

- **Unauthenticated web funnels everything to `/auth`.** `index` redirects on auth state
  and `/map` is guarded, so logged-out `shots` of `/` and `/map` both screenshot the auth
  screen (all show `text=144`). That's correct behavior, not a bug.
- **Git Bash mangles leading-slash args.** `driver.mjs shots /auth` becomes a Windows path
  and fails with "Cannot navigate to invalid URL". Pass routes without the slash
  (`shots auth`); the driver re-adds it.
- **Dynamic route is a bracket file.** Expo exports `/watch/[token]` as
  `dist/watch/[token].html`; the driver's static server maps `/watch/<anything>` onto it.
- **`react-native-maps` / `react-native-webview` are native-only** and would break the web
  bundle. They're kept out via `map.web.tsx` and DOM-Leaflet in `watch-map.web.tsx`. Never
  import them into a web-reachable module.
- **`testID` → `data-testid`.** react-native-web forwards it, which is how the driver
  targets the auth form (`auth-email`, `auth-password`, `auth-submit`, `auth-banner`).
- **`Alert.alert` is a no-op on react-native-web.** UI feedback uses in-screen banners
  instead — don't reintroduce `Alert` for anything user-facing on web.
- **Static-render vs hydration timing.** Body text measured right after load can be small
  (pre-hydration); the driver waits ~1.2s before measuring/screenshotting.

## Troubleshooting

- `dist/ not found. Run: npx expo export --platform web` → build first (see Build).
- `No Chrome/Edge found` → set `CHROME_PATH=/c/Program Files/Google/Chrome/Application/chrome.exe`.
- Driver hangs / "Chrome did not start in 20s" → a stale headless Chrome from a killed run;
  kill lingering `chrome.exe`/`node` and re-run.
- `flow` prints `✗ … auth-submit not found` → `dist/` is stale (rebuilt without testIDs);
  re-run `npx expo export --platform web`.
