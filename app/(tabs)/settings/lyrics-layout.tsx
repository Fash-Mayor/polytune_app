import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SettingsSubHeader } from "../../../components/settings/SettingsSubHeader";
import { useTheme } from "../../../hooks/useTheme";
import { usePreferences } from "../../../hooks/usePreferences";
import type {
  LyricsAlignment,
  LyricsLayoutMode,
} from "../../../providers/PreferencesProvider";

const LAYOUT_OPTIONS: {
  id: LyricsLayoutMode;
  name: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  {
    id: "dual",
    name: "Dual View",
    description:
      "Shows the primary lyric line (Original or Romanized) with the translation stacked underneath.",
    icon: "view-agenda-outline",
  },
  {
    id: "triple",
    name: "Triple View",
    description:
      "Stacks Original script, Romanized phonetics, and Translation together on every lyric line.",
    icon: "layers-triple-outline",
  },
  {
    id: "single",
    name: "Single Line",
    description:
      "Displays only the primary lyric line for a clean, compact, distraction-free view.",
    icon: "minus",
  },
];

const ALIGNMENT_OPTIONS: {
  id: LyricsAlignment;
  name: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  {
    id: "left",
    name: "Left Aligned",
    description: "Classic left-aligned lyrics for natural reading flow.",
    icon: "format-align-left",
  },
  {
    id: "center",
    name: "Center Aligned",
    description: "Centered stage-style alignment for a concert feel.",
    icon: "format-align-center",
  },
];

export default function LyricsLayoutSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { accentColor } = useTheme();
  const {
    lyricsLayout,
    setLyricsLayout,
    lyricsAlignment,
    setLyricsAlignment,
  } = usePreferences();

  const alignClass =
    lyricsAlignment === "center" ? "text-center" : "text-left";

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
        title="Lyrics Layout"
        description="Customize how original, romanized, and translated lyrics are stacked and aligned."
      />

      <Text className="mb-3 text-base font-outfit-semibold text-mine-white">
        Display Mode
      </Text>

      <View className="gap-3">
        {LAYOUT_OPTIONS.map((option) => {
          const selected = lyricsLayout === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              onPress={() => setLyricsLayout(option.id)}
              activeOpacity={0.75}
              className="flex-row items-center justify-between px-4 py-3.5 border rounded-xl"
              style={{
                borderColor: selected ? accentColor : "#3F3F46",
                backgroundColor: selected ? `${accentColor}18` : "#252525",
              }}
            >
              <View className="flex-1 pr-3">
                <Text className="text-sm font-outfit-semibold text-mine-white">
                  {option.name}
                </Text>
                <Text className="mt-1 font-sans text-xs leading-4 text-mine-muted">
                  {option.description}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={selected ? "radiobox-marked" : "radiobox-blank"}
                size={22}
                color={selected ? accentColor : "#71717A"}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="h-px my-6 bg-mine-border" />

      <Text className="mb-3 text-base font-outfit-semibold text-mine-white">
        Text Alignment
      </Text>

      <View className="gap-3">
        {ALIGNMENT_OPTIONS.map((option) => {
          const selected = lyricsAlignment === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              onPress={() => setLyricsAlignment(option.id)}
              activeOpacity={0.75}
              className="flex-row items-center justify-between px-4 py-3.5 border rounded-xl"
              style={{
                borderColor: selected ? accentColor : "#3F3F46",
                backgroundColor: selected ? `${accentColor}18` : "#252525",
              }}
            >
              <View className="flex-1 pr-3">
                <Text className="text-sm font-outfit-semibold text-mine-white">
                  {option.name}
                </Text>
                <Text className="mt-1 font-sans text-xs leading-4 text-mine-muted">
                  {option.description}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={option.icon}
                size={20}
                color={selected ? accentColor : "#71717A"}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="h-px my-6 bg-mine-border" />

      <Text className="mb-3 text-base font-outfit-semibold text-mine-white">
        Live Preview
      </Text>

      <View className="p-5 border rounded-card border-mine-border bg-mine-card">
        <Text
          className={`text-xl font-outfit-semibold leading-7 ${alignClass}`}
          style={{ color: accentColor }}
        >
          君を愛してる
        </Text>
        {lyricsLayout === "triple" ? (
          <Text
            className={`mt-1 text-sm font-outfit-medium text-mine-muted ${alignClass}`}
          >
            Kimi o aishiteru
          </Text>
        ) : null}
        {lyricsLayout !== "single" ? (
          <Text
            className={`mt-1.5 text-base font-outfit-medium text-mine-white ${alignClass}`}
          >
            I love you
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}
