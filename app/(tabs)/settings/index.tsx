import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 items-center justify-center bg-mine-bg px-8"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="mb-4 rounded-full bg-mine-card p-5">
        <MaterialCommunityIcons name="cog-outline" size={40} color="#22C55E" />
      </View>
      <Text className="text-2xl font-bold text-mine-white">Settings</Text>
      <Text className="mt-3 text-center text-base text-mine-muted">
        Account, privacy, and notification preferences will live here soon.
      </Text>
    </View>
  );
}
