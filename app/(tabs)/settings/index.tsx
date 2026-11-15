import type { ReactNode } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { useTheme } from "../../../hooks/useTheme";
import { usePreferences } from "../../../hooks/usePreferences";
import {
  DISCO_THEME_COLORS,
  THEME_PRESETS,
} from "../../../constants/themePresets";

type SettingsLinkCardProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  accentColor: string;
  mutedIcon?: boolean;
  trailingAccessory?: ReactNode;
  onPress: () => void;
};

function SettingsLinkCard({
  icon,
  title,
  subtitle,
  accentColor,
  mutedIcon = false,
  trailingAccessory,
  onPress,
}: SettingsLinkCardProps) {
  const iconColor = mutedIcon ? "#A1A1AA" : accentColor;
  const badgeBg = mutedIcon ? "#3F3F4644" : `${accentColor}22`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className="flex-row items-center p-4 mb-3 border rounded-card border-mine-border bg-mine-card"
    >
      <View
        className="items-center justify-center w-12 h-12 rounded-full"
        style={{ backgroundColor: badgeBg }}
      >
        <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
      </View>

      <View className="flex-1 px-3.5">
        <Text className="text-base font-outfit-semibold text-mine-white">
          {title}
        </Text>
        <Text className="mt-1 font-sans text-xs leading-4 text-mine-muted">
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

export default function SettingsHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { accentColor, themeMode, isDiscoMode, isCustomTheme } = useTheme();
  const { karaokeMode, lyricsLayout, lyricsAlignment } = usePreferences();

  const appVersion = Constants.expoConfig?.version ?? "1.3.2";

  const activeThemeLabel = isDiscoMode
    ? "Disco Mode"
    : isCustomTheme
      ? `Custom (${accentColor.toUpperCase()})`
      : (THEME_PRESETS.find((preset) => preset.id === themeMode)?.name ??
        "Classic Green");

  const lyricsLayoutLabel =
    lyricsLayout === "triple"
      ? "Triple View"
      : lyricsLayout === "single"
        ? "Single Line"
        : "Dual View";

  const alignmentLabel =
    lyricsAlignment === "center" ? "Center aligned" : "Left aligned";

  const navigateTo = (href: Href) => {
    router.push(href);
  };

  return (
    <ScrollView
      className="flex-1 bg-mine-bg"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 28,
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
        title="Karaoke Mode"
        subtitle={`${karaokeMode ? "On" : "Off"} • Sing-along lyric glow`}
        accentColor={accentColor}
        onPress={() => navigateTo("/settings/karaoke")}
      />

      <SettingsLinkCard
        icon="format-align-left"
        title="Lyrics Layout"
        subtitle={`${lyricsLayoutLabel} • ${alignmentLabel}`}
        accentColor={accentColor}
        onPress={() => navigateTo("/settings/lyrics-layout")}
      />

      <SectionHeader label="Personalization" />

      <SettingsLinkCard
        icon="palette-outline"
        title="Appearance"
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
        subtitle={`Subscription, Privacy & Terms • v${appVersion}`}
        accentColor={accentColor}
        mutedIcon
        onPress={() => navigateTo("/settings/account")}
      />
    </ScrollView>
  );
}
