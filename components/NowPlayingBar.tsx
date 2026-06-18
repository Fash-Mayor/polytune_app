import { Image, Text, View } from "react-native";
import { COLORS } from "../constants/theme";
import type { CurrentTrack } from "../types/media";

const PLACEHOLDER_ART = require("../assets/NuMain.png");
const ART_SIZE = 64;

type NowPlayingBarProps = {
  track: CurrentTrack | null;
};

function isValidAlbumArtUri(uri: string | null | undefined): uri is string {
  if (!uri) return false;
  return uri.startsWith("data:") || uri.startsWith("http://") || uri.startsWith("https://") || uri.startsWith("file://");
}

export function NowPlayingBar({ track }: NowPlayingBarProps) {
  const hasAlbumArt = isValidAlbumArtUri(track?.albumArt);

  return (
    <View
      className="flex-row items-center border-b p-4"
      style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }}
    >
      <Image
        source={hasAlbumArt ? { uri: track.albumArt } : PLACEHOLDER_ART}
        style={{
          width: ART_SIZE,
          height: ART_SIZE,
          borderRadius: 8,
          marginRight: 16,
          backgroundColor: COLORS.background,
        }}
        resizeMode="cover"
      />

      {track ? (
        <View className="flex-1">
          <Text
            className="text-base font-bold"
            style={{ color: COLORS.primary }}
            numberOfLines={1}
          >
            {track.title}
          </Text>
          <Text
            className="text-sm"
            style={{ color: COLORS.textInactive }}
            numberOfLines={1}
          >
            {track.artist}
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          <Text className="text-base font-bold" style={{ color: COLORS.primary }}>
            Waiting for Music...
          </Text>
          <Text className="text-sm" style={{ color: COLORS.textInactive }}>
            Play any track on your phone
          </Text>
        </View>
      )}
    </View>
  );
}
