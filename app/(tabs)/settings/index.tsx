import { useState, type ReactNode } from "react";
import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../hooks/useTheme";
import { usePreferences } from "../../../hooks/usePreferences";
import {
  DISCO_THEME_COLORS,
  THEME_PRESETS,
  type ThemeMode,
} from "../../../constants/themePresets";

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
  const [customColor, setCustomColor] = useState(accentColor.replace("#", ""));

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

      <View className="p-5 border border-dashed rounded-card border-mine-border">
        <View className="flex-row items-center">
          <MaterialCommunityIcons
            name="account-circle-outline"
            size={22}
            color="#71717A"
          />
          <Text className="ml-2 text-sm font-outfit-semibold text-mine-muted">
            More settings coming soon
          </Text>
        </View>
        <Text className="mt-2 text-xs leading-5 font-sans text-mine-muted">
          Account & sign-in, subscription, and privacy policy / terms will
          show up here once they're built.
        </Text>
      </View>
    </ScrollView>
  );
}
