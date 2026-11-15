import { ScrollView, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { SettingsSubHeader } from "../../../components/settings/SettingsSubHeader";
import { useTheme } from "../../../hooks/useTheme";

type RoadmapCardProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  accentColor: string;
};

function RoadmapCard({
  icon,
  title,
  description,
  accentColor,
}: RoadmapCardProps) {
  return (
    <View className="p-5 mb-3.5 border rounded-card border-mine-border bg-mine-card">
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center flex-1 pr-3">
          <View
            className="items-center justify-center w-10 h-10 mr-3 rounded-full"
            style={{ backgroundColor: `${accentColor}22` }}
          >
            <MaterialCommunityIcons name={icon} size={20} color={accentColor} />
          </View>
          <Text className="flex-1 text-base font-outfit-semibold text-mine-white">
            {title}
          </Text>
        </View>

        <View
          className="px-2.5 py-1 rounded-pill border"
          style={{
            borderColor: `${accentColor}55`,
            backgroundColor: `${accentColor}18`,
          }}
        >
          <Text
            className="text-[10px] uppercase font-outfit-semibold"
            style={{ color: accentColor }}
          >
            Coming Soon
          </Text>
        </View>
      </View>

      <Text className="font-sans text-xs leading-5 text-mine-muted">
        {description}
      </Text>
    </View>
  );
}

export default function AccountSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { accentColor } = useTheme();
  const appVersion = Constants.expoConfig?.version ?? "1.3.2";

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
        title="Account & Subscription"
        description="Upcoming account features, legal terms, and app version details."
      />

      <Text className="mb-3 text-xs tracking-wider uppercase font-outfit-semibold text-mine-muted">
        Roadmap
      </Text>

      <RoadmapCard
        icon="crown-outline"
        title="PolyTune Pro Subscription"
        description="Unlock unlimited real-time AI lyric translations, priority cloud streaming, and AI deep-dive language learning breakdowns."
        accentColor={accentColor}
      />

      <RoadmapCard
        icon="account-circle-outline"
        title="Account & Cloud Sync"
        description="Sign in to back up and synchronize your custom themes, karaoke preferences, and lyrics layout across all your devices."
        accentColor={accentColor}
      />

      <RoadmapCard
        icon="shield-check-outline"
        title="Privacy Policy & Terms & Conditions"
        description="Full legal documentation and privacy commitments. PolyTune only reads active media session metadata locally and never stores or transmits your personal notifications."
        accentColor={accentColor}
      />

      <Text className="mt-4 mb-3 text-xs tracking-wider uppercase font-outfit-semibold text-mine-muted">
        App Info
      </Text>

      <View className="flex-row items-center justify-between p-5 border rounded-card border-mine-border bg-mine-card">
        <View className="flex-row items-center">
          <View
            className="items-center justify-center w-11 h-11 mr-3.5 rounded-full"
            style={{ backgroundColor: `${accentColor}22` }}
          >
            <MaterialCommunityIcons
              name="music-circle"
              size={24}
              color={accentColor}
            />
          </View>
          <View>
            <Text className="text-base font-outfit-bold text-mine-white">
              PolyTune
            </Text>
            <Text className="mt-0.5 font-sans text-xs text-mine-muted">
              Real-Time AI Synced Lyrics
            </Text>
          </View>
        </View>

        <View className="items-end">
          <Text className="text-sm font-outfit-semibold text-mine-white">
            v{appVersion}
          </Text>
          <Text className="mt-0.5 font-sans text-xs text-mine-muted">
            Open Beta
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
