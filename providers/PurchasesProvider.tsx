import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Purchases, { type CustomerInfo } from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import { useAuth } from "../hooks/useAuth";

// Step 5 (Monetization). Entitlement/offering identifiers are a fixed
// convention this code assumes exists in the RevenueCat dashboard - see the
// manual setup notes in Reads/PATHTOBETA2.md's Step 5 entry: an entitlement
// called "pro", one offering ("default" is fine, RevenueCat's own default
// name). Android-only, same reasoning Step 4 used to skip Apple Sign-In -
// no iOS build planned.
const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
const PRO_ENTITLEMENT_ID = "pro";

type PurchasesContextValue = {
  isPro: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  /** Presents the paywall only if the user doesn't already have Pro. Resolves true if they ended up Pro (purchased or restored). */
  presentPaywall: () => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
};

export const PurchasesContext = createContext<PurchasesContextValue | null>(null);

function deriveIsPro(info: CustomerInfo | null): boolean {
  return !!info?.entitlements.active[PRO_ENTITLEMENT_ID];
}

export function PurchasesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Mirrors AuthProvider's `identifiedUserId` ref pattern for PostHog -
  // only a genuine sign-in/sign-out should touch RevenueCat's identity, not
  // every re-render.
  const configuredUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!REVENUECAT_ANDROID_API_KEY) {
      console.error(
        "⚠️ EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY is missing! Purchases/paywall " +
          "will stay inert until it's set - create the API key in the RevenueCat " +
          "dashboard for your Android app.",
      );
      setIsLoading(false);
      return;
    }

    if (!user) {
      // Signed out - drop RevenueCat's identity too so a second account on
      // this device never inherits the first user's purchase state. No-op
      // if Purchases was never configured yet (nothing to log out of).
      if (configuredUserId.current) {
        Purchases.logOut().catch(() => {});
        configuredUserId.current = null;
      }
      setCustomerInfo(null);
      setIsLoading(false);
      return;
    }

    if (configuredUserId.current === user.id) return;
    configuredUserId.current = user.id;

    // RevenueCat's app_user_id IS the Supabase user id - this is what lets
    // the revenuecat-webhook function's `subscribers.user_id` line up with
    // fetch-lyrics/index.ts's quota check.
    Purchases.configure({ apiKey: REVENUECAT_ANDROID_API_KEY, appUserID: user.id });

    setIsLoading(true);
    Purchases.getCustomerInfo()
      .then(setCustomerInfo)
      .catch((e) => console.error("[PURCHASES] getCustomerInfo failed:", e?.message ?? e))
      .finally(() => setIsLoading(false));
  }, [user]);

  useEffect(() => {
    if (!REVENUECAT_ANDROID_API_KEY) return;
    const listener = (info: CustomerInfo) => setCustomerInfo(info);
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  const presentPaywall = useCallback(async () => {
    // Throw rather than silently no-op: every call site already surfaces
    // this via an Alert, and "nothing happened" when you tap Upgrade is a
    // confusing thing to hit while testing a fresh build, vs. a clear
    // "not set up yet" message.
    if (!REVENUECAT_ANDROID_API_KEY) {
      throw new Error("Subscriptions aren't set up yet - check back once Pro is available.");
    }
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: PRO_ENTITLEMENT_ID,
    });
    return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
  }, []);

  const restorePurchases = useCallback(async () => {
    if (!REVENUECAT_ANDROID_API_KEY) {
      throw new Error("Subscriptions aren't set up yet - check back once Pro is available.");
    }
    const info = await Purchases.restorePurchases();
    setCustomerInfo(info);
    return deriveIsPro(info);
  }, []);

  const value = useMemo<PurchasesContextValue>(
    () => ({
      isPro: deriveIsPro(customerInfo),
      isLoading,
      customerInfo,
      presentPaywall,
      restorePurchases,
    }),
    [customerInfo, isLoading, presentPaywall, restorePurchases],
  );

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
}
