import { Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type SettingsSubHeaderProps = {
  title: string;
  description: string;
};

export function SettingsSubHeader({
  title,
  description,
}: SettingsSubHeaderProps) {
  const router = useRouter();

  return (
    <View className="mb-6">
      <TouchableOpacity
        onPress={() => router.back()}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        className="self-start -ml-2 mb-3 p-1"
      >
        <MaterialCommunityIcons
          name="chevron-left"
          size={30}
          color="#FFFFFF"
        />
      </TouchableOpacity>
      <Text className="text-[28px] font-outfit-bold text-mine-white">
        {title}
      </Text>
      <Text className="mt-1 font-sans text-sm text-mine-muted">
        {description}
      </Text>
    </View>
  );
}
