import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, AppState, Text, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePostHog } from "posthog-react-native";
import { FloatingLyricActions } from "../../components/now-playing/FloatingLyricActions";
import { LyricsList } from "../../components/now-playing/LyricsList";
import { NowPlayingCard } from "../../components/now-playing/NowPlayingCard";
import { PrimaryActionButton } from "../../components/now-playing/PrimaryActionButton";
import { SqueezedTrackHeader } from "../../components/now-playing/SqueezedTrackHeader";
import { PrivacyPermissionModal } from "../../components/PrivacyPermissionModal";
import { useLyricsStream } from "../../hooks/useLyricsStream";
import { useMediaSession } from "../../hooks/useMediaSession";
import { usePlaybackPosition } from "../../hooks/usePlaybackPosition";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import {
  isNotificationAccessEnabled,
  openNotificationAccessSettings,
  togglePlayback,
} from "../../modules/expo-ambient-listener";
import { estimateDurationMs } from "../../utils/estimateDuration";
import { ReportingService } from "../../services/reportingService";
import { useTheme } from "../../hooks/useTheme";

const TRANSITION_MS = 480;

export default function NowPlayingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { accentColor } = useTheme();
  const progress = useSharedValue(0);
  const { isCompact, artSize, cardPadding, sectionGap, playButtonSize } =
    useResponsiveLayout();

  const [listeningEnabled, setListeningEnabled] = useState(false);
  const [isRomanized, setIsRomanized] = useState(false);
  const [resyncing, setResyncing] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [lyricsVisible, setLyricsVisible] = useState(false);
  const posthog = usePostHog();
  const lastTrackedTitleRef = useRef<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      const granted = await isNotificationAccessEnabled();
      if (!granted) {
        router.replace("/");
        return;
      }
      setListeningEnabled(true);
    };

    verify();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") verify();
    });
    return () => sub.remove();
  }, [router]);

  const { track, isPlaying, osPositionMs, refresh } = useMediaSession({
    enabled: listeningEnabled,
  });
  const trackKey = track ? `${track.title}::${track.artist}` : null;

  useEffect(() => {
    if (!track?.title) {
      lastTrackedTitleRef.current = null;
      return;
    }

    if (lastTrackedTitleRef.current === track.title) return;

    lastTrackedTitleRef.current = track.title;
    posthog?.capture("Song_Detected", {
      artist: track.artist || "Unknown Artist",
    });
  }, [posthog, track?.title]);

  const { lyricsData, fetchingLyrics, refetch } = useLyricsStream(
    listeningEnabled ? track?.title : undefined,
    listeningEnabled ? track?.artist : undefined,
  );

  const { playbackPositionMs, resync } = usePlaybackPosition(
    isPlaying,
    trackKey,
    osPositionMs,
  );

  const durationMs = estimateDurationMs(lyricsData, playbackPositionMs);
  const hasTrack = track != null;

  const openLyrics = useCallback(() => {
    setLyricsVisible(true);
    progress.value = withTiming(1, {
      duration: TRANSITION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const closeLyrics = useCallback(() => {
    progress.value = withTiming(
      0,
      { duration: TRANSITION_MS, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(setLyricsVisible)(false);
      },
    );
  }, [progress]);

  const handlePrimaryAction = async () => {
    if (!hasTrack) {
      await refresh();
      return;
    }
    openLyrics();
  };

  const handleResync = async () => {
    setResyncing(true);
    try {
      const hasAccess = await isNotificationAccessEnabled();
      if (!hasAccess) {
        setShowPrivacyModal(true);
        return;
      }
      await refresh();
      await resync();
      refetch();
    } finally {
      setResyncing(false);
    }
  };

  const handleSyncIssue = () => {
    const title = track?.title ?? "Unknown track";
    const artist = track?.artist ?? "Unknown artist";

    Alert.alert(
      "Report Sync Issue",
      `Do you want to report a sync or translation issue for "${title}" by ${artist}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Report",
          onPress: async () => {
            if (!track?.title || !track?.artist) return;

            try {
              // Call the abstracted service method
              await ReportingService.reportSyncIssue(track.title, track.artist);

              Alert.alert(
                "Thank You!",
                "The sync issue has been logged for correction.",
              );
            } catch (err: any) {
              Alert.alert("Submission Error", err.message);
            }
          },
        },
      ],
    );
  };

  const handleTogglePlayback = async () => {
    try {
      await togglePlayback();
    } catch (error) {
      console.error("togglePlayback failed:", error);
    }
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.35, 1], [0, 0, 1]),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [-16, 0]) }],
    pointerEvents: progress.value > 0.5 ? "auto" : "none",
  }));

  const dashboardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.55], [1, 0]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -48]) },
      { scale: interpolate(progress.value, [0, 1], [1, 0.94]) },
    ],
    pointerEvents: progress.value < 0.45 ? "auto" : "none",
  }));

  const lyricsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.35, 1], [0, 1]),
    transform: [{ translateY: interpolate(progress.value, [0, 1], [100, 0]) }],
    pointerEvents: progress.value > 0.55 ? "auto" : "none",
  }));

  const showLoading =
    lyricsVisible && fetchingLyrics && (!lyricsData || lyricsData.length === 0);

  if (!listeningEnabled) {
    return (
      <View className="items-center justify-center flex-1 bg-mine-bg">
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-mine-bg" style={{ paddingTop: insets.top }}>
      <Animated.View
        style={headerAnimatedStyle}
        className="absolute top-0 left-0 right-0 z-20"
        pointerEvents="box-none"
      >
        <View style={{ paddingTop: insets.top }}>
          <SqueezedTrackHeader
            track={track}
            onPress={closeLyrics}
            onResync={handleResync}
            resyncing={resyncing}
          />
        </View>
      </Animated.View>

      <Animated.View style={[dashboardAnimatedStyle, { flex: 1 }]}>
        <View
          className="justify-center flex-1 min-h-0"
          style={{ paddingTop: 4 }}
        >
          <NowPlayingCard
            track={track}
            isPlaying={isPlaying}
            positionMs={playbackPositionMs}
            durationMs={durationMs}
            onTogglePlayback={handleTogglePlayback}
            artSize={artSize}
            padding={cardPadding}
            playButtonSize={playButtonSize}
            isCompact={isCompact}
          />
        </View>

        <View
          className="flex-shrink-0"
          style={{ paddingBottom: sectionGap, paddingTop: sectionGap }}
        >
          <PrimaryActionButton
            hasTrack={hasTrack}
            onPress={handlePrimaryAction}
            compact={isCompact}
          />
        </View>
      </Animated.View>

      {lyricsVisible && (
        <Animated.View
          style={[
            lyricsAnimatedStyle,
            {
              position: "absolute",
              top: insets.top + 56,
              left: 0,
              right: 0,
              bottom: 0,
            },
          ]}
          className="z-10"
        >
          {showLoading ? (
            <View className="items-center justify-center flex-1">
              <ActivityIndicator size="large" color={accentColor} />
              <Text className="mt-4 text-sm italic text-mine-muted">
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
            <View className="items-center justify-center flex-1 px-8">
              <Text className="text-base text-center text-mine-muted">
                {track
                  ? "No lyrics found for this track. Tap sync to retry."
                  : "Start playing music to see synced lyrics."}
              </Text>
            </View>
          )}

          <FloatingLyricActions
            isRomanized={isRomanized}
            onToggleRomanize={() => setIsRomanized((prev) => !prev)}
            onReportSyncIssue={handleSyncIssue}
          />
        </Animated.View>
      )}

      <PrivacyPermissionModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onConfirm={async () => {
          setShowPrivacyModal(false);
          await openNotificationAccessSettings();
        }}
      />
    </View>
  );
}
