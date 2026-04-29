# RefClock

A soccer referee app for tracking game time, score, goals, and cards on the pitch.

---

## How to Use the App

### Getting the app

- **Browser:** Open [raydl18.github.io/refclock](https://raydl18.github.io/refclock) in any browser — no download needed.
- **Android:** Search "RefClock" on the Google Play Store, or open the link above and tap "Add to Home Screen" to install it directly.
- **iPhone/iPad:** Open the link in Safari and tap the share icon → "Add to Home Screen."

### Before the match

1. Enter both team names and pick their colors using the color circles.
2. Set the duration per half (default is 45 minutes).
3. Tap **Kick Off** to start.

### During the match

- Tap **▶** to start the timer, **⏸** to pause it.
- Tap **Goal** or **Card** on a team's side to log an event — you can optionally enter the player number.
- Use **+ Time** / **- Time** to add or remove stoppage time. The number next to those buttons is how many seconds each tap adds or removes (default 30s).
- Write anything in the notes box at the bottom — weather, injuries, incidents.
- You'll get a notification at half time and full time if notifications are enabled.

### At half time

- The timer stops automatically at zero. Tap **▶** to start the second half.

### After the match

- Tap **End Game** to see the final score and match events.
- Edit your notes if needed, then tap **Save Game** to save the record to your account.
- Tap **New Game** to reset and start a fresh match without saving.

### Saving & history

- You need a free account to save matches. Tap **Sign In** on the home screen to sign in or create one.
- To view past matches, tap **History** on the home screen.
- Tap any match in the history list to see the full event report.

---

## For Developers

### Tech stack

- Vanilla HTML, CSS, and JavaScript — no framework, no build step.
- Service worker for offline support and background notifications.
- Supabase for authentication and cloud storage.

### Project structure

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

### Android (TWA)

The app is published to the Play Store as a Trusted Web Activity. The `.well-known/assetlinks.json` file links the Android app to the domain, which removes the browser bar when running from the Play Store install.
