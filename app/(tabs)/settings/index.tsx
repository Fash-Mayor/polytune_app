import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { GoogleSigninButton } from "@react-native-google-signin/google-signin";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { useTheme } from "../../../hooks/useTheme";
import { usePreferences } from "../../../hooks/usePreferences";
import { useAuth } from "../../../hooks/useAuth";
import { usePurchases } from "../../../hooks/usePurchases";
import {
  DISCO_THEME_COLORS,
  THEME_PRESETS,
  type ThemeMode,
} from "../../../constants/themePresets";
import { PRIVACY_POLICY_URL, TERMS_URL } from "../../../constants/legal";

const colorSwatches = [
  "#22C55E",
  "#38BDF8",
  "#A78BFA",
  "#FB7185",
  "#F59E0B",
  "#14B8A6",
];

function SettingsSection({
  icon,
  title,
  description,
  accentColor,
  children,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  accentColor: string;
  children: ReactNode;
}) {
  return (
    <View className="p-5 mb-6 border rounded-card border-mine-border bg-mine-card">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-1 pr-3">
          <Text className="text-xl font-outfit-bold text-mine-white">
            {title}
          </Text>
          <Text className="mt-1 font-sans text-sm text-mine-muted">
            {description}
          </Text>
        </View>
        <View
          className="p-3 rounded-full"
          style={{ backgroundColor: `${accentColor}22` }}
        >
          <MaterialCommunityIcons name={icon} size={24} color={accentColor} />
        </View>
      </View>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    accentColor,
    themeMode,
    setThemeMode,
    setCustomAccentColor,
    resetTheme,
    isDiscoMode,
  } = useTheme();
  const { karaokeMode, setKaraokeMode } = usePreferences();
  const { user, isSigningIn, signInWithGoogle, signOut } = useAuth();
  const { isPro, isLoading: purchasesLoading, presentPaywall, restorePurchases } = usePurchases();
  const [customColor, setCustomColor] = useState(accentColor.replace("#", ""));
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
      if (becamePro) Alert.alert("You're Pro!", "Unlimited translations are unlocked.");
    } catch (e: any) {
      Alert.alert("Upgrade failed", e?.message ?? "Something went wrong. Please try again.");
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
      Alert.alert("Restore failed", e?.message ?? "Something went wrong. Please try again.");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleThemeSelection = async (mode: ThemeMode) => {
    if (mode === "disco") {
      await setThemeMode("disco");
      return;
    }

    await setThemeMode(mode);
  };

  const handleCustomApply = async () => {
    const normalized = customColor.trim().replace(/^#/, "");
    if (!normalized) {
      Alert.alert("Theme", "Choose a color first.");
      return;
    }

    await setCustomAccentColor(`#${normalized}`);
    Alert.alert("Theme Updated", "Your custom accent color has been saved.");
  };

  return (
    <ScrollView
      className="flex-1 bg-mine-bg"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 20,
      }}
    >
      <View className="mb-6">
        <Text className="text-[28px] font-outfit-bold text-mine-white">
          Settings
        </Text>
        <Text className="mt-1 font-sans text-sm text-mine-muted">
          Your PolyTune preferences, all in one place.
        </Text>
      </View>

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
              onPress={handleUpgrade}
              disabled={isPaywallBusy}
              className="px-4 py-3 rounded-pill"
              style={{ backgroundColor: accentColor, opacity: isPaywallBusy ? 0.6 : 1 }}
            >
              <Text className="text-sm text-center font-outfit-semibold text-mine-bg">
                {isPaywallBusy ? "Loading..." : "Upgrade to Pro"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRestore}
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
        icon="microphone-variant"
        title="Karaoke Mode"
        description="Turns the lyrics screen into a sing-along display."
        accentColor={accentColor}
      >
        <View className="flex-row items-center justify-between px-4 py-3 border rounded-xl border-mine-border bg-mine-input">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-outfit-semibold text-mine-white">
              Enable Karaoke Mode
            </Text>
            <Text className="mt-1 font-sans text-xs text-mine-muted">
              Background matches the album art, and the current line pops
              with a colored glow instead of just dimming everything else.
            </Text>
          </View>
          <Switch
            value={karaokeMode}
            onValueChange={setKaraokeMode}
            trackColor={{ false: "#3F3F46", true: `${accentColor}88` }}
            thumbColor={karaokeMode ? accentColor : "#A1A1AA"}
          />
        </View>
      </SettingsSection>

      <SettingsSection
        icon="palette-outline"
        title="Appearance"
        description="Change the app accent color and save it for later."
        accentColor={accentColor}
      >
        <View className="gap-3">
          {THEME_PRESETS.map((preset) => {
            const selected = themeMode === preset.id && !isDiscoMode;
            return (
              <TouchableOpacity
                key={preset.id}
                onPress={() => handleThemeSelection(preset.id)}
                className="flex-row items-center justify-between px-4 py-3 border rounded-xl"
                style={{
                  borderColor: selected ? accentColor : "#3F3F46",
                  backgroundColor: selected ? `${accentColor}18` : "#252525",
                }}
              >
                <View className="flex-1">
                  <Text className="text-sm font-outfit-semibold text-mine-white">
                    {preset.name}
                  </Text>
                  <Text className="mt-1 font-sans text-xs text-mine-muted">
                    {preset.description}
                  </Text>
                </View>
                <View
                  className="w-5 h-5 ml-3 border rounded-full border-white/30"
                  style={{ backgroundColor: preset.accent }}
                />
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            onPress={() => handleThemeSelection("disco")}
            className="flex-row items-center justify-between px-4 py-3 border rounded-xl"
            style={{
              borderColor: isDiscoMode ? accentColor : "#3F3F46",
              backgroundColor: isDiscoMode ? `${accentColor}18` : "#252525",
            }}
          >
            <View className="flex-1">
              <Text className="text-sm font-outfit-semibold text-mine-white">
                Disco Mode
              </Text>
              <Text className="mt-1 font-sans text-xs text-mine-muted">
                The accent color shifts through a rainbow.
              </Text>
            </View>
            <View className="flex-row gap-2 ml-3">
              {DISCO_THEME_COLORS.slice(0, 4).map((color) => (
                <View
                  key={color}
                  className="w-4 h-4 border rounded-full border-white/30"
                  style={{ backgroundColor: color }}
                />
              ))}
            </View>
          </TouchableOpacity>
        </View>

        <View className="h-px my-5 bg-mine-border" />

        <Text className="text-sm font-outfit-semibold text-mine-white">
          Custom Accent
        </Text>
        <Text className="mt-1 font-sans text-xs text-mine-muted">
          Pick any hex color and make the app feel uniquely yours.
        </Text>

        <View className="flex-row gap-3 mt-4">
          {colorSwatches.map((color) => (
            <TouchableOpacity
              key={color}
              onPress={() => {
                setCustomColor(color.replace("#", ""));
                void setCustomAccentColor(color);
              }}
              className="w-10 h-10 border rounded-full border-white/30"
              style={{ backgroundColor: color }}
            />
          ))}
        </View>

        <TextInput
          className="px-4 py-3 mt-4 text-base border rounded-xl border-mine-border bg-mine-input text-mine-white"
          value={customColor}
          onChangeText={setCustomColor}
          placeholder="e.g. 22C55E"
          placeholderTextColor="#71717A"
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <TouchableOpacity
          onPress={handleCustomApply}
          className="px-4 py-3 mt-4 rounded-pill"
          style={{ backgroundColor: accentColor }}
        >
          <Text className="text-sm text-center font-outfit-semibold text-mine-bg">
            Apply Custom Color
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => void resetTheme()}
          className="px-4 py-3 mt-3 border rounded-pill border-mine-border"
        >
          <Text className="text-sm text-center font-outfit-semibold text-mine-white">
            Reset to Default
          </Text>
        </TouchableOpacity>
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
