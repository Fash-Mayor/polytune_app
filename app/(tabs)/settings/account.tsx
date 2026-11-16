import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { GoogleSigninButton } from "@react-native-google-signin/google-signin";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { SettingsSection } from "../../../components/settings/SettingsSection";
import { SettingsSubHeader } from "../../../components/settings/SettingsSubHeader";
import { useTheme } from "../../../hooks/useTheme";
import { useAuth } from "../../../hooks/useAuth";
import { usePurchases } from "../../../hooks/usePurchases";
import { PRIVACY_POLICY_URL, TERMS_URL } from "../../../constants/legal";

export default function AccountSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { accentColor } = useTheme();
  const { user, isSigningIn, signInWithGoogle, signOut } = useAuth();
  const {
    isPro,
    isLoading: purchasesLoading,
    presentPaywall,
    restorePurchases,
  } = usePurchases();
  const [isPaywallBusy, setIsPaywallBusy] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (e: any) {
      Alert.alert(
        "Sign-in failed",
        e?.message ?? "Something went wrong. Please try again.",
      );
    }
  };

  const handleUpgrade = async () => {
    setIsPaywallBusy(true);
    try {
      const becamePro = await presentPaywall();
      if (becamePro) {
        Alert.alert("You're Pro!", "Unlimited translations are unlocked.");
      }
    } catch (e: any) {
      Alert.alert(
        "Upgrade failed",
        e?.message ?? "Something went wrong. Please try again.",
      );
    } finally {
      setIsPaywallBusy(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const restored = await restorePurchases();
      Alert.alert(
        restored ? "Restored" : "Nothing to restore",
        restored
          ? "Your Pro subscription is active again."
          : "No previous purchase was found for this account.",
      );
    } catch (e: any) {
      Alert.alert(
        "Restore failed",
        e?.message ?? "Something went wrong. Please try again.",
      );
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-mine-bg"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 20,
      }}
      showsVerticalScrollIndicator={false}
    >
      <SettingsSubHeader
        title="Account & Subscription"
        description="Manage your account, Pro subscription, and legal information."
      />

      <SettingsSection
        icon="account-circle-outline"
        title="Account"
        description={
          user
            ? "Signed in with Google."
            : "Sign in to save your preferences and unlock more later."
        }
        accentColor={accentColor}
      >
        {user ? (
          <>
            <View className="flex-row items-center px-4 py-3 border rounded-xl border-mine-border bg-mine-input">
              {user.user_metadata?.avatar_url ? (
                <Image
                  source={{ uri: user.user_metadata.avatar_url }}
                  className="w-10 h-10 mr-3 rounded-full"
                />
              ) : (
                <View
                  className="items-center justify-center w-10 h-10 mr-3 rounded-full"
                  style={{ backgroundColor: `${accentColor}33` }}
                >
                  <MaterialCommunityIcons
                    name="account"
                    size={20}
                    color={accentColor}
                  />
                </View>
              )}
              <View className="flex-1">
                <Text
                  className="text-sm font-outfit-semibold text-mine-white"
                  numberOfLines={1}
                >
                  {user.user_metadata?.full_name ??
                    user.user_metadata?.name ??
                    "Signed in"}
                </Text>
                <Text
                  className="mt-0.5 text-xs font-sans text-mine-muted"
                  numberOfLines={1}
                >
                  {user.email}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => void signOut()}
              className="px-4 py-3 mt-3 border rounded-pill border-mine-border"
            >
              <Text className="text-sm text-center font-outfit-semibold text-mine-white">
                Sign Out
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <GoogleSigninButton
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Dark}
            disabled={isSigningIn}
            onPress={() => void handleGoogleSignIn()}
            style={{ width: "100%", height: 48 }}
          />
        )}
      </SettingsSection>

      <SettingsSection
        icon={isPro ? "star" : "star-outline"}
        title="Subscription"
        description={
          isPro
            ? "You're on Pro — unlimited translations, no daily limit."
            : "Free plan: 3 new-track translations a day. Cached tracks always stream free."
        }
        accentColor={accentColor}
      >
        {purchasesLoading ? (
          <ActivityIndicator color={accentColor} />
        ) : isPro ? (
          <View className="flex-row items-center px-4 py-3 border rounded-xl border-mine-border bg-mine-input">
            <MaterialCommunityIcons name="star" size={20} color={accentColor} />
            <Text className="ml-2 text-sm font-outfit-semibold text-mine-white">
              Pro — active
            </Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => void handleUpgrade()}
              disabled={isPaywallBusy}
              className="px-4 py-3 rounded-pill"
              style={{
                backgroundColor: accentColor,
                opacity: isPaywallBusy ? 0.6 : 1,
              }}
            >
              <Text className="text-sm text-center font-outfit-semibold text-mine-bg">
                {isPaywallBusy ? "Loading..." : "Upgrade to Pro"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => void handleRestore()}
              disabled={isRestoring}
              className="px-4 py-3 mt-3 border rounded-pill border-mine-border"
            >
              <Text className="text-sm text-center font-outfit-semibold text-mine-white">
                {isRestoring ? "Restoring..." : "Restore Purchases"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </SettingsSection>

      <SettingsSection
        icon="file-document-outline"
        title="Legal"
        description="Privacy Policy and Terms & Conditions."
        accentColor={accentColor}
      >
        <TouchableOpacity
          onPress={() => void WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}
          className="flex-row items-center justify-between px-4 py-3 border rounded-xl border-mine-border bg-mine-input"
        >
          <Text className="text-sm font-outfit-semibold text-mine-white">
            Privacy Policy
          </Text>
          <MaterialCommunityIcons
            name="open-in-new"
            size={16}
            color="#A1A1AA"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => void WebBrowser.openBrowserAsync(TERMS_URL)}
          className="flex-row items-center justify-between px-4 py-3 mt-3 border rounded-xl border-mine-border bg-mine-input"
        >
          <Text className="text-sm font-outfit-semibold text-mine-white">
            Terms &amp; Conditions
          </Text>
          <MaterialCommunityIcons
            name="open-in-new"
            size={16}
            color="#A1A1AA"
          />
        </TouchableOpacity>
      </SettingsSection>

      <Text className="mt-2 mb-2 text-xs text-center font-sans text-mine-dim">
        PolyTune {Constants.expoConfig?.version ?? ""}
      </Text>
    </ScrollView>
  );
}
