import { Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type PrimaryActionButtonProps = {
  hasTrack: boolean;
  onPress: () => void;
  compact?: boolean;
};

export function PrimaryActionButton({
  hasTrack,
  onPress,
  compact = false,
}: PrimaryActionButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="mx-4 flex-row items-center justify-center rounded-pill bg-mine-primary shadow-glow"
      style={{ paddingVertical: compact ? 13 : 16 }}
      accessibilityLabel={hasTrack ? "View lyrics" : "Check what's playing"}
    >
      <MaterialCommunityIcons
        name={hasTrack ? "text-box-search-outline" : "music-circle-outline"}
        size={compact ? 20 : 22}
        color="#121212"
        style={{ marginRight: 10 }}
      />
      <Text
        className="font-bold text-mine-bg"
        style={{ fontSize: compact ? 16 : 18 }}
      >
        {hasTrack ? "View Lyrics" : "Check What's Playing"}
      </Text>
    </TouchableOpacity>
  );
}
