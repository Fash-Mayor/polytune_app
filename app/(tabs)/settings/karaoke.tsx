import { ScrollView, Switch, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SettingsSubHeader } from "../../../components/settings/SettingsSubHeader";
import { useTheme } from "../../../hooks/useTheme";
import { usePreferences } from "../../../hooks/usePreferences";

export default function KaraokeSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { accentColor } = useTheme();
  const { karaokeMode, setKaraokeMode } = usePreferences();

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
        title="Karaoke Mode"
        description="Turns the lyrics screen into a sing-along display."
      />

      <View className="p-5 mb-4 border rounded-card border-mine-border bg-mine-card">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-base font-outfit-semibold text-mine-white">
              Enable Karaoke Mode
            </Text>
            <Text className="mt-1.5 font-sans text-xs leading-5 text-mine-muted">
              Background matches the album art, and the current line pops with a
              colored glow instead of just dimming everything else.
            </Text>
          </View>
          <Switch
            value={karaokeMode}
            onValueChange={setKaraokeMode}
            trackColor={{ false: "#3F3F46", true: `${accentColor}88` }}
            thumbColor={karaokeMode ? accentColor : "#A1A1AA"}
          />
        </View>
      </View>

      <Text className="mt-3 mb-3 text-base font-outfit-semibold text-mine-white">
        What Karaoke Mode Includes
      </Text>

      <View className="gap-3">
        <View className="flex-row items-start p-4 border rounded-card border-mine-border bg-mine-card">
          <View
            className="p-2.5 rounded-full mr-3.5"
            style={{ backgroundColor: `${accentColor}22` }}
          >
            <MaterialCommunityIcons
              name="palette-swatch-outline"
              size={20}
              color={accentColor}
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-outfit-semibold text-mine-white">
              Album Art Atmosphere
            </Text>
            <Text className="mt-1 font-sans text-xs leading-5 text-mine-muted">
              Extracts the dominant color from the currently playing track's
              cover art to tint the lyrics stage dynamically.
            </Text>
          </View>
        </View>

        <View className="flex-row items-start p-4 border rounded-card border-mine-border bg-mine-card">
          <View
            className="p-2.5 rounded-full mr-3.5"
            style={{ backgroundColor: `${accentColor}22` }}
          >
            <MaterialCommunityIcons
              name="star-four-points-outline"
              size={20}
              color={accentColor}
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-outfit-semibold text-mine-white">
              Active Lyric Glow & Pop
            </Text>
            <Text className="mt-1 font-sans text-xs leading-5 text-mine-muted">
              Highlights the active synced lyric line with a soft spring scale
              and glowing pill backdrop in your chosen accent color.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
