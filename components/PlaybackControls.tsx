import { useCallback } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import { togglePlayback } from "../modules/expo-ambient-listener";

type PlaybackControlsProps = {
  isPlaying: boolean;
  onResync: () => void;
  resyncing?: boolean;
};

export function PlaybackControls({
  isPlaying,
  onResync,
  resyncing = false,
}: PlaybackControlsProps) {
  const handleTogglePlayback = useCallback(async () => {
    try {
      await togglePlayback();
    } catch (error) {
      console.error("togglePlayback failed:", error);
    }
  }, []);

  return (
    <View
      className="absolute bottom-8 right-5 flex-row items-center"
      style={{ gap: 12 }}
    >
      <TouchableOpacity
        onPress={onResync}
        disabled={resyncing}
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: COLORS.surface,
          borderColor: COLORS.border,
          borderWidth: 1,
        }}
        accessibilityLabel="Re-sync playback and lyrics"
      >
        {resyncing ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <MaterialCommunityIcons name="sync" size={22} color={COLORS.primary} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleTogglePlayback}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: COLORS.primary,
        }}
        accessibilityLabel={isPlaying ? "Pause" : "Play"}
      >
        <FontAwesome
          name={isPlaying ? "pause" : "play"}
          size={22}
          color={COLORS.background}
          style={isPlaying ? undefined : { marginLeft: 3 }}
        />
      </TouchableOpacity>
    </View>
  );
}
