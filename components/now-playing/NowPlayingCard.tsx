import { Image, Text, TouchableOpacity, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { isValidAlbumArtUri, PLACEHOLDER_ART } from "../../utils/albumArt";
import { formatMs } from "../../utils/formatTime";
import type { CurrentTrack } from "../../types/media";

type NowPlayingCardProps = {
  track: CurrentTrack | null;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  onTogglePlayback: () => void;
  artSize: number;
  padding: number;
  playButtonSize: number;
  isCompact: boolean;
};

export function NowPlayingCard({
  track,
  isPlaying,
  positionMs,
  durationMs,
  onTogglePlayback,
  artSize,
  padding,
  playButtonSize,
  isCompact,
}: NowPlayingCardProps) {
  const hasArt = isValidAlbumArtUri(track?.albumArt);
  const progress = durationMs > 0 ? Math.min(positionMs / durationMs, 1) : 0;

  return (
    <View
      className="mx-4 rounded-card border border-mine-border bg-mine-card"
      style={{ padding }}
    >
      <View className="items-center">
        <Image
          source={hasArt && track ? { uri: track.albumArt } : PLACEHOLDER_ART}
          style={{
            width: artSize,
            height: artSize,
            borderRadius: 14,
            marginBottom: isCompact ? 10 : 16,
            backgroundColor: "#121212",
          }}
          resizeMode="cover"
        />

        <Text
          className="text-center font-bold text-mine-white"
          style={{ fontSize: isCompact ? 18 : 22, marginBottom: 4 }}
          numberOfLines={2}
        >
          {track?.title ?? "No track detected"}
        </Text>
        <Text
          className="text-center text-mine-muted"
          style={{ fontSize: isCompact ? 13 : 15, marginBottom: isCompact ? 10 : 16 }}
          numberOfLines={1}
        >
          {track?.artist ?? "Play music on your phone"}
        </Text>

        <View className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-mine-border">
          <View
            className="h-full rounded-full bg-mine-primary"
            style={{ width: `${progress * 100}%` }}
          />
        </View>

        <View
          className="w-full flex-row justify-between"
          style={{ marginBottom: isCompact ? 10 : 16 }}
        >
          <Text className="text-xs text-mine-muted">{formatMs(positionMs)}</Text>
          <Text className="text-xs text-mine-muted">{formatMs(durationMs)}</Text>
        </View>

        <TouchableOpacity
          onPress={onTogglePlayback}
          disabled={!track}
          className="items-center justify-center rounded-full bg-mine-white"
          style={{ width: playButtonSize, height: playButtonSize }}
          accessibilityLabel={isPlaying ? "Pause" : "Play"}
        >
          <FontAwesome
            name={isPlaying ? "pause" : "play"}
            size={isCompact ? 20 : 24}
            color="#121212"
            style={isPlaying ? undefined : { marginLeft: 4 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
