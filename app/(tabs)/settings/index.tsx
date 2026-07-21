import { useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../hooks/useTheme";
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
      <View className="mb-6 rounded-card border border-mine-border bg-mine-card p-5">
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-xl font-bold text-mine-white">Theme</Text>
            <Text className="mt-1 text-sm text-mine-muted">
              Change the app accent color and save it for later.
            </Text>
          </View>
          <View
            className="rounded-full p-3"
            style={{ backgroundColor: `${accentColor}22` }}
          >
            <MaterialCommunityIcons
              name="palette-outline"
              size={24}
              color={accentColor}
            />
          </View>
        </View>

        <View className="gap-3">
          {THEME_PRESETS.map((preset) => {
            const selected = themeMode === preset.id && !isDiscoMode;
            return (
              <TouchableOpacity
                key={preset.id}
                onPress={() => handleThemeSelection(preset.id)}
                className="flex-row items-center justify-between rounded-xl border px-4 py-3"
                style={{
                  borderColor: selected ? accentColor : "#3F3F46",
                  backgroundColor: selected ? `${accentColor}18` : "#252525",
                }}
              >
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-mine-white">
                    {preset.name}
                  </Text>
                  <Text className="mt-1 text-xs text-mine-muted">
                    {preset.description}
                  </Text>
                </View>
                <View
                  className="ml-3 h-5 w-5 rounded-full border border-white/30"
                  style={{ backgroundColor: preset.accent }}
                />
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            onPress={() => handleThemeSelection("disco")}
            className="flex-row items-center justify-between rounded-xl border px-4 py-3"
            style={{
              borderColor: isDiscoMode ? accentColor : "#3F3F46",
              backgroundColor: isDiscoMode ? `${accentColor}18` : "#252525",
            }}
          >
            <View className="flex-1">
              <Text className="text-sm font-semibold text-mine-white">
                Disco Mode
              </Text>
              <Text className="mt-1 text-xs text-mine-muted">
                The accent color shifts through a rainbow.
              </Text>
            </View>
            <View className="ml-3 flex-row gap-2">
              {DISCO_THEME_COLORS.slice(0, 4).map((color) => (
                <View
                  key={color}
                  className="h-4 w-4 rounded-full border border-white/30"
                  style={{ backgroundColor: color }}
                />
              ))}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View className="rounded-card border border-mine-border bg-mine-card p-5">
        <Text className="text-lg font-semibold text-mine-white">
          Custom Accent
        </Text>
        <Text className="mt-1 text-sm text-mine-muted">
          Pick any hex color and make the app feel uniquely yours.
        </Text>

        <View className="mt-4 flex-row gap-3">
          {colorSwatches.map((color) => (
            <TouchableOpacity
              key={color}
              onPress={() => {
                setCustomColor(color.replace("#", ""));
                void setCustomAccentColor(color);
              }}
              className="h-10 w-10 rounded-full border border-white/30"
              style={{ backgroundColor: color }}
            />
          ))}
        </View>

        <TextInput
          className="mt-4 rounded-xl border border-mine-border bg-mine-input px-4 py-3 text-base text-mine-white"
          value={customColor}
          onChangeText={setCustomColor}
          placeholder="e.g. 22C55E"
          placeholderTextColor="#71717A"
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <TouchableOpacity
          onPress={handleCustomApply}
          className="mt-4 rounded-pill px-4 py-3"
          style={{ backgroundColor: accentColor }}
        >
          <Text className="text-center text-sm font-semibold text-mine-bg">
            Apply Custom Color
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => void resetTheme()}
          className="mt-3 rounded-pill border border-mine-border px-4 py-3"
        >
          <Text className="text-center text-sm font-semibold text-mine-white">
            Reset to Default
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
