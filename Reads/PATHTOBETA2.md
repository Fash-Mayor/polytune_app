# Path to Beta 2

Consolidated from `TODO.md` (open items only) + the code review done 2026-08-17.
Ordered so each step de-risks the ones after it — security/cost first, then
correctness, then polish, then the features/monetization that assume a safe
foundation.

Each item is tagged with its source: **(todo)** = carried over from
`TODO.md`, **(review)** = found during the code walkthrough, not previously
tracked.

---

## Step 0 — Stop the bleeding (do these first, before anything else)

- [ ] **Require a Supabase key on the `fetch-lyrics` request.**
      `verify_jwt = false` and the client sends no `apikey`/`Authorization`
      header at all — the raw endpoint is callable by anyone who finds the
      URL, with nothing to check. Fix: send `apikey` + `Authorization: Bearer
      <anon key>` from `lyricsStream.ts` (the key already lives in
      `utils/supabase.ts`) and flip `verify_jwt = true` in
      `supabase/config.toml`. This is a no-regret change — it doesn't limit
      your own testing at all, since your app already carries that key. It
      only blocks *blind URL scraping*; the anon key still ships inside the
      APK, so it isn't a real secret against someone who has decompiled the
      app — actual per-user protection is the quota check below, which
      depends on accounts existing (Step 4) and belongs to Step 5, not here.
      **(todo — "Zero Protection" in the Edge Func Todo's block; review
      confirmed no auth header is sent client-side)**
- [x] ~~Fix the plain-lyrics sync trap.~~ **Looks already fixed as a side
      effect of the NetEase fallback** — the current ingestion waterfall
      only ever pulls `syncedLyrics` (LRCLIB) or `lrc.lyric` (NetEase, both
      already-timed LRC), with no plain-text fallback path left in the file,
      and the line parser silently drops any line without a `[mm:ss]`
      prefix instead of handing untimed text to Gemini. Re-open if this is
      still reproducing in practice. **(todo — Edge Func Todo's; review
      2026-08-17 found no live code path that triggers it)**

## Step 1 — Cache correctness (wastes AI spend until fixed)

- [x] **Cache lookup used exact string match** (`.eq("title", ...).eq("artist", ...)`
      in `fetch-lyrics/index.ts`) — trivial variants (casing, trailing
      whitespace) were guaranteed cache misses, forcing a paid AI call for a
      song already in the DB. **Fixed 2026-08-17:** both title and artist
      are now trimmed + whitespace-collapsed (`normalizeTrackField`) before
      either the cache read (`.ilike`, `%`/`_` escaped) or the cache write,
      so read and write keys always agree. Deliberately did **not** strip
      suffixes like "- Bonus Track" / "(Live)" / "- Remastered" — those can
      mark a genuinely different recording with different timing, and a
      false cache *hit* serving wrong synced lyrics is worse than an
      occasional extra AI call. Revisit only if you're seeing real
      duplicate-cache-miss cases that whitespace/case alone doesn't explain.
      **(todo — Edge Func Todo's; review confirmed the inconsistency with
      `reportingService.ts`; implemented in this session)**
- [ ] Re-check the sync engine and translation/romanization line-alignment
      once more after the above changes land — you've fixed this class of
      bug before (mixed original/translated/romanized lines, skipped chorus
      repeats), so re-verify it's still clean, not that it's newly broken.
      **(todo)**

## Step 2 — UI/UX fixes already in flight

- [x] **Fonts.** Found two distinct root causes, both fixed 2026-08-17:
      (1) `app/index.tsx`, `PrivacyPermissionModal.tsx`, and
      `FloatingLyricActions.tsx` used generic Tailwind weight utilities
      (`font-bold`, `font-semibold`) which only set `fontWeight` — they
      don't map to Outfit in `tailwind.config.js`, only `font-outfit-*` does.
      Renamed them to the correct classes. (2) Two `<Text>` elements in
      `app/(tabs)/index.tsx` (loading/empty-state captions) had no font
      class at all and were relying on the global `Text.defaultProps` hack
      in `app/_layout.tsx` — which never worked, since React 19 dropped
      `defaultProps` support for function components. Gave them explicit
      `font-sans` and deleted the dead hack. **(todo: "fonts" / "fonts fix
      (wAI)"; review found both root causes; implemented in this session)**
- [x] Move "sync issue" reporting from a native `Alert` to a proper modal.
      Built `components/SyncIssueModal.tsx` (same visual language as
      `PrivacyPermissionModal`) with an optional free-text note field,
      wired into `app/(tabs)/index.tsx`; `ReportingService.reportSyncIssue`
      now accepts that note and appends it to the logged bug description.
      **(todo; implemented in this session)**
- [x] "Change theme setting" — already done (presets, custom hex, disco
      mode all shipped in `SettingsScreen`); checking off. **(todo)**
- [ ] ~~Song/album image still doesn't always update on track change~~ →
      **moved to the "needs native rebuild" bucket below** — confirmed
      2026-08-17 still reproducing, and fixing it means a full recompile,
      not an OTA update, so it's deliberately kept out of this
      OTA-testable batch. **(todo, listed twice — "image should update
      instantly" ✅ and "song image still don't update on change" open)**
- [x] **Disco Mode hammers AsyncStorage.** Fixed 2026-08-17 — the persist
      effect in `ThemeProvider.tsx` now skips writing while
      `themeMode === "disco"`, since the interval was changing `accentColor`
      every 900ms and each change triggered a fresh AsyncStorage write. The
      "disco" mode selection itself was already persisted once, at the
      moment it's picked, in `setThemeMode`. **(review; implemented in this
      session)**

## Needs a native rebuild (hold — do NOT bundle into an OTA-only round)

Items here require `expo prebuild`/a fresh `eas build`, not just `eas update`.
Kept separate on purpose so OTA testing of the JS-only fixes above stays
clean and fast.

- [x] **Album art doesn't always update on track change.** Fixed
      2026-08-17 in `MediaSessionStateHolder.kt`, two real structural gaps
      found by reading the retry/refresh paths closely: (1) the art-recovery
      retry fired **once**, at a fixed 600ms delay, then gave up permanently
      — bumped to up to 5 attempts (~3s), since some apps attach real
      `MediaMetadata` art asynchronously well after that. (2) every
      retry/refresh path (manual "resync" button, the system's
      `OnActiveSessionsChangedListener`) discarded the original
      `Notification` object, passing `null` — so any app whose art only
      ever lives on the notification's large icon (never on
      `MediaMetadata`) could never recover it through those paths, even
      though the service saw a usable icon at post time. Now cached
      per-current-track (`lastNotification`/`lastNotificationTitle`, scoped
      so a stale notification can never leak the *previous* track's art
      onto a new one) and reused by those paths. Needs the native rebuild
      to test. **(todo, listed twice — "image should update instantly" ✅
      was a partial JS fix; "song image still don't update on change" was
      the still-open native-side remainder)**
  - **Build-break fix 2026-08-18:** the first version of this added
    `retryAttempt: Int = 0` *after* `onRetryDispatch` in
    `updateFromController`'s parameter list, which broke
    `compileReleaseKotlin` — two call sites (`MediaSessionUtils.kt`,
    `AmbientNotificationListenerService.kt`) use Kotlin's trailing-lambda
    syntax for `onRetryDispatch`, which only binds when that parameter is
    literally last. Reordered so `onRetryDispatch` stays last; the one
    positional call site (the retry `Runnable` itself) updated to match.

## Step 2.5 — Lyrics source fallback (in progress, 2026-08-17)

The NetEase Cloud Music fallback in `fetch-lyrics/index.ts` is effectively
dead weight: it's very likely being blocked/silently-empty-responding
because Supabase Edge Functions run on non-China edge nodes and NetEase's
API is known to wall off traffic from outside China — not a fixable code
bug on our end. When LRCLIB also misses, the track gets no lyrics at all.

- [x] **Implemented 2026-08-17, all four pieces:**
  - LRCLIB fuzzy `/api/search` added as a second attempt after the strict
    `/api/get`, before falling through to another provider
    (`fetchLrclibSyncedLyrics`).
  - NetEase replaced with Musixmatch's unofficial "desktop app" API as the
    real second-tier synced source (`fetchMusixmatchLyrics` +
    `getMusixmatchToken`, same lazy-singleton/reset-on-401 pattern as
    Kuroshiro). Known trade-off, accepted: unofficial/reverse-engineered
    endpoint, token can rotate, more ToS gray-area than LRCLIB — but not
    geo-blocked the way NetEase/QQ/Kugou are, and has a bigger catalog
    (including J-pop/K-pop/anime).
  - lyrics.ovh added as the true last resort, explicitly unsynced
    (`fetchLyricsOvhPlainText` + `parseUnsyncedLines`) — a new `is_synced`
    flag flows through the cache (`lyrics_translations.is_synced`, see
    migration below) and the SSE stream (`{ meta: { synced } }`, sent
    before any lyric lines) down to the client.
  - Frontend "unsynced" tag: `LyricsList` now takes an `isSynced` prop —
    shows an "Unsynced Lyrics" pill at the top of the list, skips
    auto-scroll/active-line highlighting entirely when false (their
    `timeMs` is just a sort index, not a real position, so highlighting
    against it would be meaningless), and renders every line at full
    opacity instead of dimming against an unreachable active line. Wired
    through `useLyricsStream` → `app/(tabs)/index.tsx` → `LyricsList`.
  - A source is now retried on **either** "returned nothing" **or**
    "returned text that parsed into zero usable lines" — previously a
    malformed-but-non-empty response from a synced source would silently
    dead-end instead of falling through, which is likely part of why
    tracks were coming back with no lyrics at all.
  - **Needs a one-time DB migration before this actually starts caching
    correctly** — see `Reads/migrations/2026-08-17-add-is-synced.sql`
    (adds `lyrics_translations.is_synced`, backfilled `true` for all
    existing rows). Not deploy-order-fatal either way (see the migration
    file's comment for exactly what happens if deployed first), but run it
    to get real caching + the synced/unsynced flag working right away.
    **(review, 2026-08-17 — replaces/supersedes the old "add YTM to edge
    func" todo item in Step 3 below; YTM itself stays ruled out — no stable
    public endpoint, would mean building/maintaining our own scraper)**

## Step 3 — Remaining core features (2026-08-17)

- [x] **Skipping forward/back, and the pause/play blip on skip.** Both
      native, both in the `expo-ambient-listener` module:
  - Added `skipToNext`/`skipToPrevious` end-to-end — `MediaSessionUtils.kt`
    (mirrors `togglePlayback`'s pattern: `transportControls.skipToNext()`/
    `skipToPrevious()` when there's an active controller, falling back to
    dispatching `KEYCODE_MEDIA_NEXT`/`PREVIOUS` otherwise) →
    `ExpoAmbientListenerModule.kt` → JS bindings (`index.ts`, web stub) →
    two new buttons flanking play/pause in `NowPlayingCard`.
  - The "pause mo play mo" blip: a skip briefly reports
    `STATE_BUFFERING`/`STATE_SKIPPING_TO_*` before settling back to
    `STATE_PLAYING` on the new track. `isPlaying` used to be a strict
    `state == STATE_PLAYING` check, so the play button flashed to paused
    and back on every skip. `MediaSessionStateHolder.kt` now treats
    buffering/skipping states as still-playing - only a genuine pause/stop
    reads as not-playing. **(todo — implemented in this session)**
- [x] **Karaoke Mode** — new toggle in Settings, off by default. When on:
  - **Background matches the album art**: `useDominantColor` (new hook,
    wraps `react-native-image-colors` - new native dependency, needs the
    rebuild) prefers the library's dark swatches
    (`darkVibrant`/`darkMuted`) over the raw dominant/average color, then
    darkens whatever it gets a bit further (`utils/color.ts`) as a safety
    margin for unusually bright art. Keeps the last resolved color while a
    new one loads/fails instead of flashing to black.
  - **The active line pops and glows** instead of just the rest dimming
    around it: extracted each line into `components/now-playing/LyricLine.tsx`
    so it can own a Reanimated `useAnimatedStyle` (hooks can't be called
    per-item inside the `.map()` in `LyricsList` directly). Pop is a
    `scale` **transform**, not a `fontSize` change - transforms don't
    affect layout flow, so the auto-scroll Y-position cache for the lines
    below never goes stale mid-animation. The glow is a background-color
    tint on a pill that's always the same padding, active or not, for the
    same reason.
  - Naturally no-ops on unsynced tracks (lyrics.ovh fallback) - there's
    never a real "active line" to pop/glow without real timestamps, so it
    silently falls back to plain unsynced rendering.
  - Settings page restructured into a general hub for this: title
    "Settings", section cards (Karaoke Mode, Appearance/Theme, a "more
    coming soon" placeholder for account/subscription/legal once Step 4/7
    land), instead of a single Theme-only screen. New
    `providers/PreferencesProvider.tsx` (mirrors `ThemeProvider`'s
    AsyncStorage-persisted pattern) is the home for this and future
    non-theme settings.
  - Deliberately **not** built: choosing which line renders first
    (original/romanized vs. translation) - skipped per your instruction,
    left for later. **(todo — implemented in this session, needs the
    native rebuild for `react-native-image-colors` to link)**
- [x] Romanization packages / AI fallback — both already fully shipped in
      the edge function (7-script local-library waterfall, Gemini→universal
      romanization fallback, Gemini→MyMemory translation fallback); checking
      off, nothing left to build here. **(todo)**
- [x] ~~Add YTM (YouTube Music) support to the edge function.~~ → see
      **Step 2.5** above — ruled out (no stable public endpoint, would need
      our own scraper) in favor of LRCLIB `/api/search` + Musixmatch.
      **(todo)**

## Step 4 — Auth & persistence

- [ ] Authentication, with login persisting across app restarts. Supabase
      client is already configured with `persistSession: true` via
      AsyncStorage (`utils/supabase.ts`), but no sign-in flow exists yet —
      this is also the prerequisite for Step 0's per-user quota enforcement
      and for Step 5's paywall. **Native deps pre-linked 2026-08-18** so the
      actual implementation can ship OTA: `@react-native-google-signin/google-signin`
      (the native account-picker/One Tap SDK) for Google, plain Supabase
      Auth (already installed) for email/password or magic link.
      Deliberately **not** in `app.json`'s `plugins` array — its default
      mode requires a real `google-services.json` (doesn't exist, would
      break prebuild) and its only other mode is iOS-only (irrelevant,
      Android-only app); Android needs neither; sign-in configures purely
      at runtime via `GoogleSignin.configure({ webClientId })` once you have
      an OAuth Web Client ID from Google Cloud Console — that's a config
      value, not a package, so it's OTA-safe whenever it lands. Also kept
      `expo-web-browser`/`expo-auth-session`/`expo-crypto` (linked
      2026-08-17) even though Google now uses the native SDK instead of the
      browser-redirect flow they were originally for — `expo-web-browser`
      still covers Step 7's Privacy Policy/T&C in-app links, and the other
      two stay cheap insurance against ever adding another OAuth provider.
      Apple Sign-In deliberately skipped — no iOS build planned right now.
      **(todo)**

## Step 5 — Monetization

- [ ] Free trial logic: 3 free translations/day for un-cached tracks;
      cached tracks stream free forever. Depends on Step 4 (auth) and
      Step 0 (edge function actually checking who's asking). **(todo —
      PIVOT II)**
- [ ] Paywall via RevenueCat. **Native deps pre-linked 2026-08-18:**
      `react-native-purchases` + `react-native-purchases-ui` (exact peer
      versions, no `app.json` plugin needed for either). Still needed before
      this ships: a RevenueCat API key from their dashboard — a config
      value, not a package, so OTA-safe whenever it's added. **(todo)**
- [ ] Offline mode / caching lyrics locally as a premium hook (`me.md`
      sketches this: `AsyncStorage` key per `@offline_lyrics_{id}`) — worth
      scoping once the paywall exists, since it's the natural premium
      feature to sell alongside it. **(todo, from Reads/me.md)**

## Step 6 — Analytics & delivery

- [x] ~~App analytics beyond PostHog (Aptabase/Vexo?)~~ — decided
      2026-08-18: skip, PostHog (already wired) covers this. Also removed
      `mixpanel-react-native` from `package.json` — installed but zero
      references anywhere in the code, dead weight. Still to actually build:
      firing translation-completion/paywall-hit events through the existing
      PostHog instance — pure JS, no new package. **(todo)**
- [ ] OTA update verification workflow (`eas update`), including how to
      preview an OTA build before pushing since Expo Go doesn't support it
      yet. **(todo, listed under both TODO and B4Launch)**

## Step 7 — Before public launch (B4Launch)

- [ ] Real users tested, feedback collected — do this *before* the
      authentication step per your own note. **(todo)**
- [ ] Play Store assets. **(todo)**
- [ ] Privacy Policy and Terms & Conditions, surfaced from a
      Settings/Profile page. **(todo)**
- [ ] Settings/Profile page hosting the above legal links. **(todo)**

## Lower priority / edge cases (review only, not launch-blocking)

- [ ] `pickBestController` (Kotlin, `MediaSessionUtils.kt`) breaks ties
      between two equal-priority media sessions (e.g. two paused apps) by
      list order, which can occasionally surface the wrong app's track.
      Same for the global-media-key fallback in `togglePlayback`.
- [x] ~~`app.json` still declares an `ios` block~~ — removed 2026-08-18.

---

**Suggested order to actually execute in:** Step 0 → Step 1 → Step 2's font
fix (blocks real UI polish) → Step 4 (auth) → Step 5 (monetization) →
remaining Step 2/3 items → Step 6 → Step 7.
