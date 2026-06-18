import { useState } from "react";
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";
import { LyricsList } from "../../components/LyricsList";
import { NowPlayingBar } from "../../components/NowPlayingBar";
import { PlaybackControls } from "../../components/PlaybackControls";
import { COLORS } from "../../constants/theme";
import { useLyricsStream } from "../../hooks/useLyricsStream";
import { useMediaSession } from "../../hooks/useMediaSession";
import { usePlaybackPosition } from "../../hooks/usePlaybackPosition";
import {
  isNotificationAccessEnabled,
  openNotificationAccessSettings,
} from "../../modules/expo-ambient-listener";

export default function LyricsScreen() {
  const [isRomanized, setIsRomanized] = useState(false);
  const [resyncing, setResyncing] = useState(false);

  const { track, isPlaying, osPositionMs, refresh } = useMediaSession();
  const trackKey = track ? `${track.title}::${track.artist}` : null;

  const { lyricsData, fetchingLyrics, refetch } = useLyricsStream(
    track?.title,
    track?.artist,
  );

  const { playbackPositionMs, resync } = usePlaybackPosition(
    isPlaying,
    trackKey,
    osPositionMs,
  );

  const handleResync = async () => {
    setResyncing(true);
    try {
      const hasAccess = await isNotificationAccessEnabled();
      if (!hasAccess) {
        Alert.alert(
          "Enable media access",
          "For accurate time sync, album art, and play/pause controls, allow LyricsMine notification access in the next screen.",
          [
            { text: "Not now", style: "cancel" },
            {
              text: "Open settings",
              onPress: () => openNotificationAccessSettings(),
            },
          ],
        );
      }

      await refresh();
      await resync();
      refetch();
    } finally {
      setResyncing(false);
    }
  };

  const showLoading =
    fetchingLyrics && (!lyricsData || lyricsData.length === 0);

  return (
    <View className="flex-1" style={{ backgroundColor: COLORS.background }}>
      <View className="flex-row items-center justify-between px-4 pb-3 pt-8">
        <Text className="text-base font-bold" style={{ color: COLORS.primary }}>
          LyricsMine Live
        </Text>
        <TouchableOpacity
          onPress={() => setIsRomanized((prev) => !prev)}
          className="rounded-full border px-3 py-2"
          style={{ borderColor: COLORS.border }}
        >
          <Text className="text-xs font-bold" style={{ color: COLORS.primary }}>
            {isRomanized ? "A/文 Romanised" : "A/文 Original"}
          </Text>
        </TouchableOpacity>
      </View>

      <NowPlayingBar track={track} />

      {showLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text
            className="mt-4 text-sm italic"
            style={{ color: COLORS.textInactive }}
          >
            Streaming translations from cloud...
          </Text>
        </View>
      ) : lyricsData && lyricsData.length > 0 ? (
        <LyricsList
          lyricsData={lyricsData}
          playbackPositionMs={playbackPositionMs}
          isRomanized={isRomanized}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <Text
            className="text-center text-base"
            style={{ color: COLORS.textInactive }}
          >
            {track
              ? "No lyrics found for this track yet. Tap sync to retry."
              : "Start playing music, or tap sync to detect the current track."}
          </Text>
        </View>
      )}

      <PlaybackControls
        isPlaying={isPlaying}
        onResync={handleResync}
        resyncing={resyncing}
      />
    </View>
  );
}
