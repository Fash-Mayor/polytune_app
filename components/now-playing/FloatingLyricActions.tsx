import { Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";

type FloatingLyricActionsProps = {
  isRomanized: boolean;
  onToggleRomanize: () => void;
  onReportSyncIssue: () => void;
};

export function FloatingLyricActions({
  isRomanized,
  onToggleRomanize,
  onReportSyncIssue,
}: FloatingLyricActionsProps) {
  const { accentColor } = useTheme();

  return (
    <View className="absolute left-0 right-0 flex-row items-center justify-center gap-3 px-5 bottom-6">
      <TouchableOpacity
        onPress={onToggleRomanize}
        className="flex-row items-center rounded-pill border border-mine-border bg-mine-card px-4 py-2.5"
      >
        <MaterialCommunityIcons
          name="translate"
          size={18}
          color={accentColor}
        />
        <Text className="ml-2 text-sm font-semibold text-mine-white">
          {isRomanized ? "Original" : "Romanise"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onReportSyncIssue}
        className="flex-row items-center rounded-pill border border-mine-border bg-mine-card px-4 py-2.5"
      >
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={18}
          color="#FFFFFF"
        />
        <Text className="ml-2 text-sm font-semibold text-mine-white">
          Sync Issue
        </Text>
      </TouchableOpacity>
    </View>
  );
}
