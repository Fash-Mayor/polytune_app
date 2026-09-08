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

- [x] **Require a Supabase key on the `fetch-lyrics` request.** Confirmed
      2026-09-06: `services/lyricsStream.ts` sends `apikey` +
      `Authorization: Bearer <anon key>`, and `supabase/config.toml` already
      has `verify_jwt = true` for `fetch-lyrics`. Both landed in the
      `Major updates with calaude` commit. **Still needs a manual step you
      have to run yourself** — `verify_jwt` in `config.toml` only takes
      effect once the function is redeployed:
      `npx supabase login && npx supabase link --project-ref <ref> && npx
      supabase functions deploy fetch-lyrics`. Until that's run, the live
      gateway may still be serving the old (unprotected) deployment. This
      only blocks *blind URL scraping* — the anon key still ships inside the
      APK, so real per-user protection is still the quota check in Step 5,
      which depends on Step 4 (auth). **(todo — "Zero Protection" in the
      Edge Func Todo's block; review confirmed no auth header is sent
      client-side; verified fixed in code 2026-09-06, deploy step still
      pending)**
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
- [x] Re-checked the sync engine and translation/romanization line-alignment
      2026-09-06. Confirmed clean:
  - `parseSyncedLines` keeps every `[mm:ss]` line independently, including
    repeated chorus timestamps — no dedup by content, only the client's
    `appendLine` dedups, and only on an exact `(timeMs, o)` match, so a
    real repeat (different `timeMs`) is never dropped.
  - Gemini translation, Gemini romanization, and local-engine romanization
    all reject a misaligned result (strict array-length check) instead of
    trusting a shifted mapping.
  - `LyricsList`/`LyricLine` render `r` (romanized) and `tr` (translation)
    as two separate `<Text>` elements, never concatenated — the old "one
    line that's both romanized and translated" bug has no code path left.
  - **One real gap found and fixed**: the MyMemory fallback (only reached
    when Gemini's translation call fails) split its batched response on
    `" | "` and mapped pieces back to lines by position with **no length
    check** — the one alignment-sensitive path that hadn't gotten the
    strict-count guard the rest of the file already uses. Added the same
    guard: a batch that doesn't split back into exactly as many pieces as
    lines going in is now discarded (falls back to each line's original
    text) instead of risking a shifted mapping. **(todo; review 2026-09-06
    found and fixed the MyMemory-fallback gap; everything else confirmed
    already clean)**

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

- [x] **Authentication — Google Sign-In only** (email/magic-link
      deliberately skipped per product decision — less friction for users).
      Implemented 2026-09-06:
  - `providers/AuthProvider.tsx` — new provider wrapping the app (inside
    `PostHogProvider`, outside `ThemeProvider`/`PreferencesProvider` in
    `app/_layout.tsx`). Calls `GoogleSignin.configure({ webClientId })`
    once on mount, tracks the Supabase `session` via
    `supabase.auth.getSession()` + `onAuthStateChange` (so a persisted
    session — already `persistSession: true` via AsyncStorage in
    `utils/supabase.ts` — is picked up automatically on app restart, no
    extra plumbing needed), and exposes `signInWithGoogle()` / `signOut()`.
  - Sign-in flow: `GoogleSignin.hasPlayServices()` →
    `GoogleSignin.signIn()` → its `idToken` → Supabase's
    `signInWithIdToken({ provider: "google", token })`. User-cancelled
    (`statusCodes.SIGN_IN_CANCELLED`) is treated as a no-op, not an error.
  - `hooks/useAuth.ts` — same context-hook pattern as `useTheme`/
    `usePreferences`.
  - UI: added an "Account" section to the top of `SettingsScreen` — the
    official `GoogleSigninButton` when signed out, avatar/name/email +
    "Sign Out" when signed in.
  - **2026-09-06: the whole app is now gated behind sign-in**, per explicit
    instruction (superseding the "don't gate yet" note this item originally
    shipped with). `app/_layout.tsx`'s `Gate` component swaps the entire
    `<Stack>` (both `app/index.tsx`'s permission flow and all of
    `app/(tabs)`) for `components/SignInScreen.tsx` whenever there's no
    session — driven by the same `user` state Settings' Sign Out button
    flips, so signing out from deep inside Settings drops straight back to
    the sign-in screen too, not just on next app launch.
  - **PostHog now identifies real users**, not just anonymous per-device
    IDs: on sign-in, `posthog.identify(user.id, { email, name, avatar_url
    })` merges the device's prior anonymous event history into that
    person's profile; on sign-out, `posthog.reset()` so the next person on
    this device doesn't inherit it. A ref guards against re-identifying on
    every token refresh (only a real sign-in/out/account-switch touches it).
  - **Manual setup still needed before this actually works** (config
    values, not code — OTA-safe once added; verified against current
    Google/Supabase docs 2026-09-06, see chat for the full walkthrough):
    1. Create **two** OAuth client IDs in the same Google Cloud project —
       an **Android** one (package name `com.fashmayor.lyricsmine` + each
       SHA-1 you sign builds with: debug *and* the EAS release keystore)
       and a **Web application** one (no package/SHA-1 fields).
    2. Only the **Web** client ID goes in code: `.env`'s
       `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (placeholder line already added).
    3. Supabase Dashboard → Authentication → Providers → Google → its
       **"Client IDs"** field takes *both* client IDs, comma-separated, Web
       first. Client Secret is not needed for this native ID-token flow.
  - **Needs a native rebuild** (`expo prebuild` + `eas build`, not just
    `eas update`) — `@react-native-google-signin/google-signin`'s native
    Android module was pre-linked 2026-08-18 but has never actually been
    exercised in a build yet. Deliberately still **not** in `app.json`'s
    `plugins` array (unchanged reasoning: its default plugin mode wants a
    real `google-services.json`, which doesn't exist here; runtime
    `webClientId` config doesn't need the plugin at all).
  - Kept `expo-web-browser`/`expo-auth-session`/`expo-crypto` as before —
    `expo-web-browser` still covers Step 7's Privacy Policy/T&C in-app
    links; the other two stay cheap insurance against ever adding another
    OAuth provider. Apple Sign-In still skipped — no iOS build planned.
    **(todo — implemented in this session)**

## Step 5 — Monetization

- [x] **Free trial logic + real per-user auth on `fetch-lyrics`.**
      Implemented 2026-09-07:
  - `fetch-lyrics/index.ts` now resolves the caller via
    `supabase.auth.getUser(token)` before doing anything else, and rejects
    (`401`) any request with no/invalid session — this is what actually
    closes Step 0's "anon key still ships inside the APK" gap.
    `services/lyricsStream.ts` sends the signed-in user's session access
    token as `Authorization`, not the shared anon key anymore.
  - On a cache **miss** (cache hits stay free forever, untouched): checks
    the new `subscribers` table for an active Pro entitlement; if not Pro,
    calls the new `consume_translation_quota` Postgres function (row-locked
    upsert into `translation_usage`, 3/day) *before* running the ingestion
    waterfall. Quota exceeded → one SSE event
    (`code: "quota_exceeded"`) and the stream closes without hitting any
    lyrics provider or Gemini. Quota state comes back in every miss-path
    `meta` event too, for client display.
  - New tables/RPC: `Reads/migrations/2026-09-07-monetization.sql` (not
    auto-applied — same as the 2026-08-17 migration, run it yourself via the
    SQL editor or `supabase db push`).
- [x] **Paywall via RevenueCat.** Implemented 2026-09-07:
  - `providers/PurchasesProvider.tsx` + `hooks/usePurchases.ts` (same shape
    as `AuthProvider`/`ThemeProvider`) — configures `react-native-purchases`
    with `appUserID` set to the Supabase user id once signed in, tracks
    `isPro` from `customerInfo.entitlements.active["pro"]`, exposes
    `presentPaywall()` (`RevenueCatUI.presentPaywallIfNeeded`) and
    `restorePurchases()`.
  - New edge function `supabase/functions/revenuecat-webhook/index.ts` —
    the source of truth `fetch-lyrics` checks server-side. Auth is a shared
    secret (`REVENUECAT_WEBHOOK_SECRET`), not `verify_jwt` (RevenueCat's
    servers have no Supabase session). `verify_jwt = false` for it in
    `supabase/config.toml`, documented inline why.
  - UI: Settings gets a real "Subscription" section (Free/Pro status,
    Upgrade, Restore Purchases). The lyrics screen's empty state now
    branches on `quotaExceeded` into an "Upgrade to Pro" prompt instead of
    the generic "no lyrics found" message.
  - **Manual setup still needed** (config, not code — OTA-safe once added):
    1. RevenueCat dashboard: create an entitlement identifier **`pro`** and
       an offering named **`default`** with your Android product(s) — the
       code assumes exactly these identifiers.
    2. Add the Android API key to `.env`'s
       `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` (placeholder line already
       added).
    3. Set `REVENUECAT_WEBHOOK_SECRET` as a Supabase Edge Function secret
       (`supabase secrets set REVENUECAT_WEBHOOK_SECRET=<value>`), then in
       RevenueCat's dashboard (Project Settings → Webhooks) point the
       webhook URL at the deployed `revenuecat-webhook` function and set its
       Authorization header to that same value.
    4. Deploy both functions:
       `supabase functions deploy fetch-lyrics` and
       `supabase functions deploy revenuecat-webhook`.
  - **Needs a native rebuild** — same pending blocker as Step 4's Google
    Sign-In: `react-native-purchases`/`react-native-purchases-ui` were
    pre-linked 2026-08-18 but never actually exercised in a build yet; no
    `app.json` plugin needed for either.
- [x] **Offline mode / caching lyrics locally as a premium hook**, per
      `Reads/me.md`. Implemented 2026-09-07:
  - `services/offlineLyrics.ts` — `AsyncStorage` key per
    `@offline_lyrics_{title}::{artist}`, exactly as `me.md` sketches (no
    filesystem access, just the JSON payload).
  - `useLyricsStream` checks local storage *before* opening the network
    stream — a downloaded track loads with zero network requests and no
    session token, real offline/airplane-mode use. A manual "resync" always
    bypasses the offline copy and re-fetches from the network.
  - `FloatingLyricActions` gets a third pill (download icon) next to
    Romanise/Sync Issue. Free users tapping it see the paywall (the upsell
    moment) instead of a disabled control; Pro users toggle save/remove.

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
      authentication step per your own note. **(todo — blocked on the
      native rebuild, same as RevenueCat/Google Sign-In)**
- [x] **Privacy Policy and Terms & Conditions + Settings/Profile legal
      links.** Implemented 2026-09-07:
  - Both published as hosted pages (not native in-app screens — Play Store
    submission needs a public Privacy Policy URL regardless), written
    specific to how PolyTune actually works (the real third-party services,
    the real free-trial/Pro terms, the Notification-Access data flow) rather
    than generic boilerplate:
    - Privacy Policy: https://claude.ai/code/artifact/fc84a702-5298-4c93-81af-86938814b448
    - Terms & Conditions: https://claude.ai/code/artifact/9c1f933a-336b-47e3-8868-47c26a70fd39
  - `constants/legal.ts` holds both URLs — the only place to update if they
    ever move to a real domain.
  - Settings gets a real "Legal" section (`app/(tabs)/settings/index.tsx`)
    opening both via `expo-web-browser`'s `openBrowserAsync` — the exact
    thing that dependency was kept installed for back in Step 4. Settings
    already *is* the app's Profile page (Account/Subscription/Karaoke/
    Appearance/Legal all live there) — no separate route was needed. A
    footer line now also shows the app version (`expo-constants`).
  - **Still needs a human step before real launch:** both pages default to
    private (Claude Artifacts) — open each → share menu → make public,
    otherwise Google's review can't reach them. Also fill in the one
    placeholder left in the Terms page (§12 Governing Law — needs your
    actual jurisdiction, not something I can pick for you).
- [x] **Play Store listing text + Data Safety mapping.** Implemented
      2026-09-07 — `Reads/PlayStoreListing.md`: app title, short/full
      description (ASO keywords from `Marketing.md` folded in), and a
      best-effort Data Safety form mapping (flagged where a provider's own
      SDK disclosure needs checking, not guessed). **Icon/feature
      graphic/screenshots are spec'd in that doc but not produced** — same
      native-rebuild blocker as everything else in this section; can't
      screenshot a build that can't get past Google Sign-In yet.

## Lower priority / edge cases (review only, not launch-blocking)

- [x] **`pickBestController` tie-break bug.** Fixed 2026-09-07:
      `MediaSessionUtils.kt`'s `pickBestController` used `maxByOrNull` on
      playback-state priority alone, so two equal-priority sessions (e.g.
      two paused apps) tied and fell back to whichever happened to come
      first in `getActiveSessions()`'s list order — not a reliable
      "most recently used" signal once nothing is actively playing. Now
      breaks ties on each controller's own
      `playbackState.lastPositionUpdateTime` (the real timestamp of when
      that session's state last changed) via `maxWithOrNull` +
      `compareBy().thenBy()`, so a tie resolves to whichever app you
      actually touched most recently. `togglePlayback`'s global-media-key
      fallback shares the same root cause (it reads
      `MediaSessionStateHolder.activeController`, which is set from this
      same `pickBestController` call) — one fix covers both. Needs the
      native rebuild to test, same as everything else in this pass.
- [x] ~~`app.json` still declares an `ios` block~~ — removed 2026-08-18.

---

**Suggested order to actually execute in:** Step 0 → Step 1 → Step 2's font
fix (blocks real UI polish) → Step 4 (auth) → Step 5 (monetization) →
remaining Step 2/3 items → Step 6 → Step 7.

See also `Reads/SaleReadiness.md` for the code+IP sale-packaging checklist
(legal disclosure, buyer docs, demo assets) that runs alongside this list.