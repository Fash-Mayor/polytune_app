import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export function SettingsSection({
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
