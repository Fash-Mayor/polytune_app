# Sale Readiness — Source Code + IP

Locked 2026-09-06. This is the plan for finishing PolyTune for real users
**and** packaging it as a code + IP sale in parallel. Read alongside
`PATHTOBETA2.md` (the functional build list) — this file only adds what
that one doesn't cover: sale packaging.

## Locked assumptions (don't re-litigate these)

- **Selling source code + IP only** — not the Play Store developer
  listing, not the live Supabase project/cached-lyrics DB, not any
  account. The buyer stands up their own infra from docs. No
  account-transfer work needed (no Play Store listing transfer, no
  Supabase project ownership transfer, no RevenueCat account handoff).
- **Zero users at sale time is fine.** This is priced as an asset
  (replacement cost / buy-vs-build), not a revenue multiple. Live
  monetization track record and MAU/retention numbers are **not**
  required before listing it for sale — dropped as a gating requirement.
- Step 5 (monetization) still gets *built* — it's part of finishing the
  app for real users, and a working paywall is worth more to a buyer than
  a stubbed one — it just doesn't need weeks of live conversion data
  first.

## Build order (unchanged from PATHTOBETA2.md, still the critical path)

1. Step 0 — auth header on `fetch-lyrics` (no-regret, do first)
2. Step 1 — re-verify sync/line-alignment after the cache-key fix
3. Step 4 — Authentication (sign-in flow; deps already pre-linked)
4. Step 5 — Monetization: free-trial quota logic, RevenueCat paywall,
   offline-caching hook. Functional QA only, not a live-conversion trial.
5. Step 6 — OTA update verification workflow
6. Step 7 — Privacy Policy/T&C, Settings/Profile page, Play Store
   assets, a small real-user test round (bug-catching, not track-record)
7. Lower priority — `pickBestController` tie-break bug. Cheap fix, worth
   doing: a clean known-issues list reads much better to a buyer than
   one with an open correctness bug on it.

## Sale-packaging todos (new — not in PATHTOBETA2.md)

### A. IP / legal cleanliness
- [ ] License audit: confirm every dependency (JS packages + any Kotlin
      native deps) is permissively licensed (MIT/Apache/BSD) — nothing
      GPL/AGPL-style that would restrict resale or force disclosure.
- [ ] Write a legal-risk disclosure doc for the buyer, covering:
  - Lyrics copyright exposure (per `Comp & Moat.md` — NMPA/publisher
    risk once any lyrics app gets real traffic).
  - The Musixmatch unofficial "desktop app" API — reverse-engineered,
    ToS gray-area, token can rotate.
  - Any other unofficial/reverse-engineered dependency.
  - Disclosed risk gets priced in and protects you from a
    concealment claim later; undisclosed risk is what kills deals or
    triggers refund demands post-sale.
- [ ] Get (or template from the marketplace you list on) an IP
      Assignment Agreement / Bill of Sale for the actual transfer —
      don't draft this from scratch; Flippa/Acquire.com provide
      standard templates for exactly this.
- [ ] Quick trademark/name check on "PolyTune" — confirm no existing
      conflict so the buyer isn't inheriting a naming dispute.

### B. Buyer-facing documentation (this *is* the deliverable — there's no live infra to hand over instead)
- [ ] Architecture overview, buyer-readable (formalize what
      `AGENTS.md`/`Reads/*` already know).
- [ ] Full from-scratch setup guide: every third-party service needed
      (Supabase, Gemini, Groq, Musixmatch token endpoint, LRCLIB,
      lyrics.ovh, RevenueCat, Google Cloud OAuth client, PostHog) with
      signup links — no personal keys included in the handoff.
- [ ] Deployment guide: `eas build`/`eas update` flow, prebuild steps,
      native (Kotlin) module build requirements.
- [ ] DB schema / migration files so the buyer can recreate the
      Supabase schema — they won't get your live cache data, but they
      need the schema to rebuild the caching mechanism itself.
- [ ] Known-issues list (ship it honestly — priced-in risk beats a
      post-sale surprise).

### C. Marketable proof without live users
- [ ] Polished demo video: media detection → synced lyrics →
      translation → romanization → karaoke mode → paywall screen. This
      is the entire "proof it works" since there's no live account to
      test-drive.
- [ ] A signed, sideloadable release APK the buyer can install and try
      directly, so they're not taking your word for it.

### D. Where/how to sell
- [ ] List as a **source code / app-for-sale** listing, not a "SaaS
      business" listing (Flippa's dedicated app/source-code category,
      or Acquire.com — both accept pre-revenue). Direct outreach to the
      indie "floating lyrics" competitors named in `Comp & Moat.md` is
      also worth trying — they already have distribution and would be
      buying the moat (native Android media-session listener + the
      translation/sync pipeline + fallback waterfall), not a revenue
      stream.
- [ ] Write a one-paragraph buy-vs-build pitch: dev-months saved, the
      hard parts already solved (cross-OEM Android media-session
      listener, AI translation pipeline with provider fallbacks, sync
      engine). Price off replacement cost, not a revenue multiple.

## Explicitly dropped for this sale (don't build/chase these)
- Live monetization track record / weeks of conversion data before
  listing.
- MAU/retention analytics as a sale requirement (PostHog wiring itself
  still ships as part of the app, just not needed as sale evidence).
- Any account-transfer prep — Play Store listing, Supabase project,
  RevenueCat account all stay yours; buyer builds their own.
