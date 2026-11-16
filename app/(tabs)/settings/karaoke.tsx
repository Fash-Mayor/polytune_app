import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SettingsSection } from "../../../components/settings/SettingsSection";
import { SettingsSubHeader } from "../../../components/settings/SettingsSubHeader";
import { useTheme } from "../../../hooks/useTheme";
import { usePreferences } from "../../../hooks/usePreferences";
import {
  ALL_LINE_KINDS,
  DEFAULT_LINE_LAYOUT,
  type LineKind,
} from "../../../providers/PreferencesProvider";

const LINE_KIND_META: Record<
  LineKind,
  { label: string; description: string; sample: string }
> = {
  o: {
    label: "Original",
    description: "Lyrics in the song's native script",
    sample: "夜に駆ける",
  },
  r: {
    label: "Romanised",
    description: "Phonetic pronunciation in Latin letters",
    sample: "Yoru ni kakeru",
  },
  tr: {
    label: "Translation",
    description: "Translated meaning of each line",
    sample: "Racing into the night",
  },
};

export default function KaraokeAndLyricsLayoutScreen() {
  const insets = useSafeAreaInsets();
  const { accentColor } = useTheme();
  const {
    karaokeMode,
    setKaraokeMode,
    lineLayout,
    setLineLayout,
    resetLineLayout,
  } = usePreferences();

  const orderedDisplayKinds: LineKind[] = [
    ...lineLayout,
    ...ALL_LINE_KINDS.filter((k) => !lineLayout.includes(k)),
  ];

  const handleMoveLine = (kind: LineKind, direction: -1 | 1) => {
    const index = lineLayout.indexOf(kind);
    if (index === -1) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= lineLayout.length) return;
    const next = [...lineLayout];
    const [removed] = next.splice(index, 1);
    next.splice(targetIndex, 0, removed);
    setLineLayout(next);
  };

  const handleToggleLine = (kind: LineKind, enabled: boolean) => {
    if (enabled) {
      if (!lineLayout.includes(kind)) {
        setLineLayout([...lineLayout, kind]);
      }
      return;
    }

    if (lineLayout.length <= 1) {
      Alert.alert(
        "Lyrics Layout",
        "At least one lyric line must remain visible.",
      );
      return;
    }

    setLineLayout(lineLayout.filter((k) => k !== kind));
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
        title="Karaoke & Lyrics Layout"
        description="Configure sing-along mode and customize how lyric lines are displayed."
      />

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
      </SettingsSection>

      <SettingsSection
        icon="format-line-spacing"
        title="Lyrics Layout"
        description="Choose which lyric lines to display and reorder them from top to bottom."
        accentColor={accentColor}
      >
        <View className="gap-3">
          {orderedDisplayKinds.map((kind) => {
            const meta = LINE_KIND_META[kind];
            const activeIndex = lineLayout.indexOf(kind);
            const isEnabled = activeIndex !== -1;
            const canMoveUp = isEnabled && activeIndex > 0;
            const canMoveDown =
              isEnabled && activeIndex < lineLayout.length - 1;

            return (
              <View
                key={kind}
                className="flex-row items-center justify-between px-4 py-3 border rounded-xl border-mine-border bg-mine-input"
                style={{ opacity: isEnabled ? 1 : 0.6 }}
              >
                <View
                  className="items-center justify-center mr-3 rounded-full w-7 h-7"
                  style={{
                    backgroundColor: isEnabled
                      ? `${accentColor}26`
                      : "#3F3F46",
                  }}
                >
                  <Text
                    className="text-xs font-outfit-bold"
                    style={{
                      color: isEnabled ? accentColor : "#A1A1AA",
                    }}
                  >
                    {isEnabled ? activeIndex + 1 : "–"}
                  </Text>
                </View>

                <View className="flex-1 pr-2">
                  <Text className="text-sm font-outfit-semibold text-mine-white">
                    {meta.label}
                  </Text>
                  <Text className="mt-0.5 font-sans text-xs text-mine-muted">
                    {meta.description}
                  </Text>
                </View>

                <View className="flex-row items-center gap-1">
                  <TouchableOpacity
                    onPress={() => handleMoveLine(kind, -1)}
                    disabled={!canMoveUp}
                    accessibilityLabel={`Move ${meta.label} up`}
                    className="items-center justify-center w-8 h-8 border rounded-lg border-mine-border"
                    style={{ opacity: canMoveUp ? 1 : 0.3 }}
                  >
                    <MaterialCommunityIcons
                      name="chevron-up"
                      size={20}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleMoveLine(kind, 1)}
                    disabled={!canMoveDown}
                    accessibilityLabel={`Move ${meta.label} down`}
                    className="items-center justify-center w-8 h-8 mr-1 border rounded-lg border-mine-border"
                    style={{ opacity: canMoveDown ? 1 : 0.3 }}
                  >
                    <MaterialCommunityIcons
                      name="chevron-down"
                      size={20}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>

                  <Switch
                    value={isEnabled}
                    onValueChange={(val) => handleToggleLine(kind, val)}
                    trackColor={{ false: "#3F3F46", true: `${accentColor}88` }}
                    thumbColor={isEnabled ? accentColor : "#A1A1AA"}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <View className="p-4 mt-4 border rounded-xl border-mine-border bg-mine-bg">
          <Text className="mb-2 text-xs tracking-wider uppercase font-outfit-semibold text-mine-muted">
            Preview
          </Text>
          {lineLayout.map((kind, idx) => {
            const sampleText = LINE_KIND_META[kind].sample;
            return idx === 0 ? (
              <Text
                key={kind}
                className="text-[22px] font-outfit-semibold leading-8 pb-0.5"
                style={{ color: accentColor }}
              >
                {sampleText}
              </Text>
            ) : (
              <Text
                key={kind}
                className="mt-1 text-[18px] font-outfit-medium leading-6 pb-0.5 text-mine-white"
              >
                {sampleText}
              </Text>
            );
          })}
        </View>

        {lineLayout.join(",") !== DEFAULT_LINE_LAYOUT.join(",") ? (
          <TouchableOpacity
            onPress={resetLineLayout}
            className="px-4 py-3 mt-3 border rounded-pill border-mine-border"
          >
            <Text className="text-sm text-center font-outfit-semibold text-mine-white">
              Reset Layout to Default
            </Text>
          </TouchableOpacity>
        ) : null}
      </SettingsSection>
    </ScrollView>
  );
}
