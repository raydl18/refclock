# RefClock

A PWA(Progressive Web App - Available as a browser website or app) for soccer referees to track game time, score, and match events on the pitch.

## Features

- **Per-half timer** — set duration per half, timer stops at zero each half rather than ending the game automatically
- **Stoppage time** — +Time / -Time buttons with a configurable default (30s) to add or remove time mid-half
- **Score & events** — log goals and cards (yellow/red) with optional player numbers; events display with the current cumulative game time (e.g. 47')
- **Match notes** — notes field visible during the game and on the final screen, for weather, injuries, or anything needed for a match report
- **Save & history** — manually save completed matches to the cloud; browse past games and tap into any match for a full event report
- **Offline-first PWA** — works with no internet after the first load; available on the Android Play Store
- **Background timer** — epoch-based clock stays accurate after the screen turns off or the app is backgrounded; notifications fire at half time and full time
- **Supabase sync** (optional) — create an account with a display name to save game history to the cloud; game data is not saved automatically

## Use it

**[raydl18.github.io/refclock](https://raydl18.github.io/refclock)**

Open in any browser. On Android, use "Add to Home Screen" to install it as an app.
Once published to the Play Store, you can also find it by searching "RefClock" in the store.


## Project structure

```
index.html      — markup
style.css       — all styles
app.js          — all game logic
sw.js           — service worker (offline cache + notifications)
supabase.js     — Supabase client and auth/database helpers
schema.sql      — Supabase table definition and RLS policies
manifest.json   — PWA manifest
icons/          — app icons (192px and 512px)
```

## Android (TWA)

The app is configured as a Trusted Web Activity via `.well-known/assetlinks.json`, which removes the browser bar when installed from the Play Store.
