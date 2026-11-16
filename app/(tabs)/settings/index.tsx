import type { ReactNode } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { useTheme } from "../../../hooks/useTheme";
import { usePreferences } from "../../../hooks/usePreferences";
import type { LineKind } from "../../../providers/PreferencesProvider";
import { useAuth } from "../../../hooks/useAuth";
import { usePurchases } from "../../../hooks/usePurchases";
import {
  DISCO_THEME_COLORS,
  THEME_PRESETS,
} from "../../../constants/themePresets";

const LINE_KIND_LABELS: Record<LineKind, string> = {
  o: "Original",
  r: "Romanised",
  tr: "Translation",
};

type SettingsLinkCardProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  accentColor: string;
  trailingAccessory?: ReactNode;
  onPress: () => void;
};

function SettingsLinkCard({
  icon,
  title,
  subtitle,
  accentColor,
  trailingAccessory,
  onPress,
}: SettingsLinkCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className="flex-row items-center p-4 mb-3 border rounded-card border-mine-border bg-mine-card"
    >
      <View
        className="items-center justify-center w-12 h-12 rounded-full"
        style={{ backgroundColor: `${accentColor}22` }}
      >
        <MaterialCommunityIcons name={icon} size={24} color={accentColor} />
      </View>

      <View className="flex-1 px-3.5">
        <Text className="text-base font-outfit-semibold text-mine-white">
          {title}
        </Text>
        <Text
          className="mt-1 font-sans text-xs leading-4 text-mine-muted"
          numberOfLines={2}
        >
          {subtitle}
        </Text>
      </View>

      <View className="flex-row items-center gap-2">
        {trailingAccessory}
        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color="#71717A"
        />
      </View>
    </TouchableOpacity>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <Text className="mt-3 mb-2.5 text-xs tracking-wider uppercase font-outfit-semibold text-mine-muted">
      {label}
    </Text>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { accentColor, themeMode, isDiscoMode, isCustomTheme } = useTheme();
  const { karaokeMode, lineLayout } = usePreferences();
  const { user } = useAuth();
  const { isPro } = usePurchases();

  const activeThemeLabel = isDiscoMode
    ? "Disco Mode"
    : isCustomTheme
      ? `Custom (${accentColor.toUpperCase()})`
      : (THEME_PRESETS.find((preset) => preset.id === themeMode)?.name ??
        "Classic Green");

  const activeLayoutSummary = lineLayout
    .map((kind) => LINE_KIND_LABELS[kind])
    .join(" + ");

  const accountSummary = user
    ? (user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email ??
      "Signed in")
    : "Not signed in";

  const planSummary = isPro ? "Pro" : "Free plan";

  const navigateTo = (href: Href) => {
    router.push(href);
  };

  return (
    <ScrollView
      className="flex-1 bg-mine-bg"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 20,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View className="mb-4">
        <Text className="text-[28px] font-outfit-bold text-mine-white">
          Settings
        </Text>
        <Text className="mt-1 font-sans text-sm text-mine-muted">
          Your PolyTune preferences, all in one place.
        </Text>
      </View>

      <SectionHeader label="Display & Lyrics" />

      <SettingsLinkCard
        icon="microphone-variant"
        title="Karaoke & Lyrics Layout"
        subtitle={`Karaoke ${karaokeMode ? "On" : "Off"} • ${activeLayoutSummary}`}
        accentColor={accentColor}
        onPress={() => navigateTo("/settings/karaoke")}
      />

      <SectionHeader label="Personalization" />

      <SettingsLinkCard
        icon="palette-outline"
        title="Theme"
        subtitle={`${activeThemeLabel} • Accent color & presets`}
        accentColor={accentColor}
        trailingAccessory={
          isDiscoMode ? (
            <View className="flex-row gap-1">
              {DISCO_THEME_COLORS.slice(0, 3).map((color) => (
                <View
                  key={color}
                  className="w-3 h-3 border rounded-full border-white/30"
                  style={{ backgroundColor: color }}
                />
              ))}
            </View>
          ) : (
            <View
              className="w-3.5 h-3.5 border rounded-full border-white/30"
              style={{ backgroundColor: accentColor }}
            />
          )
        }
        onPress={() => navigateTo("/settings/appearance")}
      />

      <SectionHeader label="Account & About" />

      <SettingsLinkCard
        icon="account-circle-outline"
        title="Account & Subscription"
        subtitle={`${accountSummary} • ${planSummary} & Legal`}
        accentColor={accentColor}
        onPress={() => navigateTo("/settings/account")}
      />

      <Text className="mt-4 mb-2 text-xs text-center font-sans text-mine-dim">
        PolyTune {Constants.expoConfig?.version ?? ""}
      </Text>
    </ScrollView>
  );
}
