# Play Store Listing — PolyTune

Reference doc for the Play Console submission form. Everything here is
copy-paste-ready; the graphic assets section is a spec sheet since it can't
actually be produced until the native-rebuild/RevenueCat blocker in
`Reads/PATHTOBETA2.md` is cleared (see that section for why — screenshots
need a real signed-in build, which needs Google Sign-In's native module
actually exercised).

## App identity

- **App name** (max 30 chars): `PolyTune: Lyrics Translator` (27 chars)
- **Package name:** `com.fashmayor.lyricsmine`
- **Category:** Music & Audio
- **Tags/keywords** (Play has no separate keyword field like the iOS App
  Store — these are woven into the description below instead): lyrics
  translator, synced lyrics, romanization, K-pop lyrics, J-pop lyrics,
  Spotify lyrics, karaoke, language learning through music

## Short description (max 80 chars)

```
Live translated, romanized lyrics for any song playing on your phone
```
(68 chars)

## Full description (max 4000 chars)

```
PolyTune shows you what your music actually means — live, synced to whatever's playing right now on Spotify, YouTube Music, or any Android media player.

No copy-pasting lyrics into a search engine. No switching apps. PolyTune reads your phone's now-playing notification, finds the song, and streams a line-by-line translation and romanization straight over your lyrics — timed to the actual music.

WHAT IT DOES
• Detects any song playing on Android — works with Spotify, YouTube Music, and virtually any other media app, not just one streaming service.
• Streams synced, line-by-line lyrics as the song plays.
• Translates non-English lyrics into English in real time.
• Romanizes Japanese, Korean, Chinese, Russian, Arabic, Hindi, Thai, Tamil, and more into readable Latin script — perfect for K-pop, J-pop, Latin, and Bollywood fans learning the words.
• Karaoke Mode: the current line glows and pops against a background pulled from the album art.
• Report and fix sync issues, right from the app.

WHY IT'S DIFFERENT
Most lyrics apps only work with one streaming service, or hand you a wall of static text with no timing. PolyTune works off what's actually playing on your device — no account linking to Spotify required — and every lyric is timed to the music, not just dumped on screen.

FREE TO USE
Every song already translated by the PolyTune community streams free, forever, no limit. New songs get 3 free translations a day; PolyTune Pro removes that limit entirely.

PRIVACY, UP FRONT
PolyTune's Android permission request looks intimidating — it needs Notification Access to see what's playing. Here's exactly what that means: the app reads only media-session notifications (song title, artist, and playback state). Messages, banking alerts, emails, and every other notification are filtered out and never read. Full details in our Privacy Policy, linked in the app.

Whether you're learning a language through music, an anime/K-pop/J-pop fan who wants to actually understand the lyrics, or just tired of not knowing what a song means — PolyTune turns any track into one you can follow along with.
```
(2,113 chars — plenty of headroom under the 4,000 limit if you want to add
more later)

## Legal links (Play Console requires these before it'll let you submit)

- **Privacy Policy URL:** https://claude.ai/code/artifact/fc84a702-5298-4c93-81af-86938814b448
- **Terms of Service URL** (optional field, but linked from the Privacy
  Policy anyway): https://claude.ai/code/artifact/9c1f933a-336b-47e3-8868-47c26a70fd39

**Before pasting these into Play Console:** both are published as Claude
Artifacts, which default to *private*. Open each link → share menu → make it
public/shareable — Google's review process needs to reach it without being
logged in as you. Also fill in the one placeholder still in the Terms page
(`[your jurisdiction]` in section 12, Governing Law) before you submit for
real — everything else in both documents is already specific to how PolyTune
actually works, not generic boilerplate.

## Data Safety form (Play Console → App content → Data safety)

This is a best-effort mapping from what the app + `Reads/migrations/` schema
actually collect, matching the Privacy Policy. Flagged items need a quick
check against the named provider's own disclosures before you submit —
don't take my word alone on those, they're genuine judgment calls Google
holds you accountable for.

| Data type | Collected? | Shared? | Purpose | Notes |
|---|---|---|---|---|
| Name | Yes | No¹ | Account management, App functionality | From Google Sign-In |
| Email address | Yes | No¹ | Account management, App functionality | From Google Sign-In |
| User IDs | Yes | No¹ | App functionality | Supabase user id, used as RevenueCat's app_user_id |
| Profile photo | Yes | No¹ | App functionality | Google avatar URL |
| Purchase history | Yes | No¹ | App functionality | Subscription/entitlement status via RevenueCat + Google Play Billing — PolyTune never receives card details |
| App interactions | Yes | No¹ | Analytics | PostHog events (song detected, stream started, paywall hit, sync issue) |
| Crash logs / diagnostics | Likely² | Unknown² | Analytics | Standard PostHog SDK behavior — verify in PostHog's own data-safety disclosure |
| Device or other IDs | Likely² | Unknown² | Analytics, App functionality | Possible PostHog/RevenueCat SDK device identifiers — verify in their disclosures |
| Messages, SMS, call logs | **No** | — | — | Explicitly filtered out at the source (see Privacy Policy §3) — worth stating clearly in the form since Notification Access sounds alarming to reviewers |
| Audio | **No** | — | — | App never records audio, only reads on-screen media metadata |
| Precise/approximate location | No | — | — | Not requested, not used |
| Financial info (card/bank) | **No** | — | — | Google Play Billing handles this entirely; PolyTune never sees it |

¹ "Shared" in Play's specific sense means given to a company for *its own*
purposes (e.g. an ad network) — Supabase/Gemini/RevenueCat/PostHog process
data as service providers under PolyTune's own terms, which is "collected"
not "shared" per Play's definitions. Re-confirm this reading against each
provider's current DPA before submitting; it can change.

² Genuinely uncertain without checking PostHog's and RevenueCat's own
Play Data Safety documentation for their SDKs' default behavior — don't
guess on this section, look it up.

All the "Yes" rows: mark **encrypted in transit** (Supabase/Google/RevenueCat
all use HTTPS/TLS) and **user can request deletion** (true — see Privacy
Policy §7, deletion is via contacting support, not self-service in-app yet).

## Graphic assets — spec, not yet produced

Blocked on the native rebuild (can't screenshot a build that can't get past
the Google Sign-In screen yet) — specs below so this is fast once that's
unblocked:

| Asset | Spec | Status |
|---|---|---|
| App icon | 512×512 PNG, 32-bit with alpha | Have a source mark (`assets/PolyTuneLogo2.png`) — needs export/verification at exact 512×512 |
| Feature graphic | 1024×500 PNG/JPG, no alpha | Not started |
| Phone screenshots | Min 2, JPEG/24-bit PNG, 16:9 or 9:16, 320–3840px on the long side | Blocked — needs a real signed-in build |
| Short promo video (optional) | YouTube link | Not started |

## Content rating & target audience

Play Console's rating questionnaire is answered live in-console (it changes
occasionally and isn't something to pre-fill offline) — but for reference,
PolyTune has no user-generated content shown to other users, no violence, no
mature themes; expect it to land in the lowest content-rating tier. Target
audience: general audience, 13+ (matches the Terms & Conditions' eligibility
clause).
