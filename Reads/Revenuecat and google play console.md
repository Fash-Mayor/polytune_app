Getting RevenueCat working end-to-end

Your app's package name is com.fashmayor.lyricsmine (from app.json) — you'll need that a couple of times below. This has several moving pieces across three dashboards (Google Play Console, RevenueCat, Supabase); do them roughly in this order.

1. Google Play Console — the products actually being sold

RevenueCat doesn't sell anything itself on Android — it sits in front of Google Play Billing. Prerequisite: a Google Play Console developer account with this app created there (it can stay in Internal Testing / unpublished — it doesn't need to be live).
1. In Play Console → your app → Monetize → Products → Subscriptions (or In-app products, if you want a one-time "lifetime" unlock instead), create at least one product — e.g. a subscription pro_monthly. Note its Product ID exactly.
2. Monetization setup must be complete (a merchant/payments profile linked to the account) or product creation will be blocked.

2. RevenueCat — project + app

1. Sign up / log in at https://app.revenuecat.com, create a project (e.g. "PolyTune").
2. Project Settings → Apps → add an app → platform Google Play, package name com.fashmayor.lyricsmine.
3. RevenueCat needs read access to your Play Console subscription data to verify purchases server-side: Play Console → Users and permissions → invite a service account (or use one you create in Google Cloud Console) with Financial data / Manage orders / View app information permissions, then upload that service account's JSON key in RevenueCat's app settings. (RevenueCat's own setup wizard walks you through generating this — follow its exact steps, it changes occasionally.)

3. Entitlement + Offering (must match the code exactly)

The code I wrote assumes these two identifiers — use them verbatim or the paywall will silently show nothing purchasable:
1. Entitlements → New → identifier pro.
2. Products → import/add the pro_monthly product from step 1, attach it to the pro entitlement.
3. Offerings → New → identifier default, add a package pointing at that product. Mark it "Current".

4. API key → your app

Project Settings → API Keys → copy the Google Play (Android) key → paste into .env:
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
That's the only key that goes in the app itself — everything else (webhook secret, service account) stays server-side/dashboard-side.

5. Webhook → keeps Supabase in sync

This is what fetch-lyrics actually checks server-side to bypass the quota (not a live RevenueCat API call per request):
1. Pick a random secret string, e.g. openssl rand -hex 32.
2. Set it as a Supabase Edge Function secret: npx supabase secrets set REVENUECAT_WEBHOOK_SECRET=<that value>.
3. RevenueCat → Project Settings → Integrations → Webhooks → add URL https://ygsgbihhzmyrnqmxdfdv.supabase.co/functions/v1/revenuecat-webhook, and set its Authorization header value to that same secret string.
4. Deploy the function once it exists server-side: npx supabase functions deploy revenuecat-webhook (you said you're already handling the fetch-lyrics deploy — do this one the same way).

6. Native rebuild — required before any of this runs on-device

react-native-purchases/react-native-purchases-ui were pre-linked into the native project back on 2026-08-18 but have never actually been exercised in a build — same blocker Google Sign-In is waiting on. Expo Go can't run this at all. You need:
npx expo prebuild --clean
npx expo run:android --variant release   # or eas build --profile preview --platform android
No app.json plugin entry needed for either package — they work off the runtime Purchases.configure() call already in providers/PurchasesProvider.tsx.

7. Testing before it's live

- Add your Google account as a License Tester in Play Console (Setup → License testing) so test purchases don't charge real money.
- Install the app via Internal Testing track (not sideloaded, or Play Billing calls fail) with that tester account signed in.
- Sign into the app → hit the 3-translation daily limit (or Settings → "Upgrade to Pro") → the RevenueCat paywall should show your default offering → complete a test purchase → within a few seconds the webhook should flip your subscribers row and the app should immediately have unlimited translations again.
- If a purchase doesn't unlock anything, check: RevenueCat dashboard → Customers (does the purchase show up under the right app_user_id, which should be your Supabase user's UUID?) → then check the webhook delivery log in RevenueCat for a non-200 response, then Supabase function logs for revenuecat-webhook.