import { useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SettingsSubHeader } from "../../../components/settings/SettingsSubHeader";
import { useTheme } from "../../../hooks/useTheme";
import {
  DISCO_THEME_COLORS,
  THEME_PRESETS,
  type ThemeMode,
} from "../../../constants/themePresets";

const colorSwatches = [
  "#22C55E",
  "#14B8A6",
  "#38BDF8",
  "#A78BFA",
  "#FB7185",
  "#F59E0B",
];

export default function AppearanceSettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    accentColor,
    themeMode,
    setThemeMode,
    setCustomAccentColor,
    resetTheme,
    isDiscoMode,
  } = useTheme();
  const [customColor, setCustomColor] = useState(
    `#${accentColor.replace(/^#/, "").toUpperCase()}`,
  );

  const handleThemeSelection = async (mode: ThemeMode) => {
    await setThemeMode(mode);
    const preset = THEME_PRESETS.find((entry) => entry.id === mode);
    if (preset) {
      setCustomColor(preset.accent.toUpperCase());
    }
  };

  const handleCustomApply = async () => {
    const normalized = customColor.trim().replace(/^#/, "");
    if (!normalized) {
      Alert.alert("Theme", "Choose a color first.");
      return;
    }

    await setCustomAccentColor(`#${normalized}`);
    setCustomColor(`#${normalized.toUpperCase()}`);
    Alert.alert("Theme Updated", "Your custom accent color has been saved.");
  };

  return (
    <ScrollView
      className="flex-1 bg-mine-bg"
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 28,
        paddingHorizontal: 20,
      }}
      showsVerticalScrollIndicator={false}
    >
      <SettingsSubHeader
        title="Appearance"
        description="Change the app accent color and save it for later."
      />

      <Text className="mb-3 text-base font-outfit-semibold text-mine-white">
        Theme Presets
      </Text>

      <View className="gap-3">
        {THEME_PRESETS.map((preset) => {
          const selected = themeMode === preset.id && !isDiscoMode;
          return (
            <TouchableOpacity
              key={preset.id}
              onPress={() => void handleThemeSelection(preset.id)}
              activeOpacity={0.75}
              className="flex-row items-center justify-between px-4 py-3.5 border rounded-xl"
              style={{
                borderColor: selected ? accentColor : "#3F3F46",
                backgroundColor: selected ? `${accentColor}18` : "#252525",
              }}
            >
              <View className="flex-1 pr-3">
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
          onPress={() => void handleThemeSelection("disco")}
          activeOpacity={0.75}
          className="flex-row items-center justify-between px-4 py-3.5 border rounded-xl"
          style={{
            borderColor: isDiscoMode ? accentColor : "#3F3F46",
            backgroundColor: isDiscoMode ? `${accentColor}18` : "#252525",
          }}
        >
          <View className="flex-1 pr-3">
            <Text className="text-sm font-outfit-semibold text-mine-white">
              Disco Mode
            </Text>
            <Text className="mt-1 font-sans text-xs text-mine-muted">
              The accent color shifts through a rainbow.
            </Text>
          </View>
          <View className="flex-row gap-1.5 ml-3">
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

      <View className="mt-7">
        <Text className="text-base font-outfit-semibold text-mine-white">
          Custom Accent
        </Text>
        <Text className="mt-1 font-sans text-xs text-mine-muted">
          Pick any hex color and make the app feel uniquely yours.
        </Text>

        <View className="flex-row items-center justify-between mt-4">
          {colorSwatches.map((color) => {
            const isSelectedSwatch =
              accentColor.toUpperCase() === color.toUpperCase() && !isDiscoMode;
            return (
              <TouchableOpacity
                key={color}
                onPress={() => {
                  setCustomColor(color.toUpperCase());
                  void setCustomAccentColor(color);
                }}
                activeOpacity={0.8}
                className="items-center justify-center w-12 h-12 rounded-full"
                style={{
                  borderWidth: isSelectedSwatch ? 2 : 0,
                  borderColor: isSelectedSwatch ? color : "transparent",
                  padding: isSelectedSwatch ? 3 : 0,
                }}
              >
                <View
                  className="w-full h-full border rounded-full border-white/25"
                  style={{ backgroundColor: color }}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          className="px-4 py-3.5 mt-4 text-base text-center border rounded-xl border-mine-border bg-mine-card font-outfit-medium text-mine-white"
          value={customColor}
          onChangeText={setCustomColor}
          placeholder="#22C55E"
          placeholderTextColor="#71717A"
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <TouchableOpacity
          onPress={() => void handleCustomApply()}
          activeOpacity={0.85}
          className="px-4 py-3.5 mt-4 rounded-pill"
          style={{ backgroundColor: accentColor }}
        >
          <Text className="text-sm text-center font-outfit-semibold text-mine-bg">
            Apply Custom Color
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setCustomColor("#22C55E");
            void resetTheme();
          }}
          activeOpacity={0.75}
          className="px-4 py-3.5 mt-3 border rounded-pill border-mine-border"
        >
          <Text className="text-sm text-center font-outfit-semibold text-mine-white">
            Reset to Default
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
