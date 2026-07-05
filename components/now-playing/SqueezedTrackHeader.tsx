import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { isValidAlbumArtUri, PLACEHOLDER_ART } from "../../utils/albumArt";
import type { CurrentTrack } from "../../types/media";

type SqueezedTrackHeaderProps = {
  track: CurrentTrack | null;
  onPress: () => void;
  onResync: () => void;
  resyncing?: boolean;
};

export function SqueezedTrackHeader({
  track,
  onPress,
  onResync,
  resyncing = false,
}: SqueezedTrackHeaderProps) {
  const hasArt = isValidAlbumArtUri(track?.albumArt);

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-3 border-b border-mine-primary bg-mine-bg"
    >
      <Image
        key={
          track
            ? `${track.title ?? "unknown"}::${track.artist ?? "unknown"}::${track.albumArt ?? "none"}`
            : "placeholder-art"
        }
        source={hasArt && track ? { uri: track.albumArt } : PLACEHOLDER_ART}
        style={{
          width: 44,
          height: 44,
          borderRadius: 8,
          marginRight: 12,
          backgroundColor: "#252525",
        }}
        resizeMode="cover"
      />

      <View className="flex-1 min-w-0">
        <Text className="text-sm font-bold text-mine-white" numberOfLines={1}>
          {track?.title ?? "Unknown track"}
        </Text>
        <Text className="text-xs text-mine-muted" numberOfLines={1}>
          {track?.artist ?? "Unknown artist"}
        </Text>
      </View>

      <TouchableOpacity
        onPress={onResync}
        disabled={resyncing}
        hitSlop={12}
        className="items-center justify-center w-10 h-10 ml-2 border rounded-full border-mine-border bg-mine-card"
        accessibilityLabel="Re-sync lyrics"
      >
        {resyncing ? (
          <ActivityIndicator size="small" color="#22C55E" />
        ) : (
          <MaterialCommunityIcons name="sync" size={20} color="#22C55E" />
        )}
      </TouchableOpacity>
    </Pressable>
  );
}
