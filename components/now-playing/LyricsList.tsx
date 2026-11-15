import { useEffect, useMemo, useRef } from "react";
import {
  Dimensions,
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { LyricLine } from "../../types/lyrics";
import { findActiveLineIndex } from "../../utils/lyricSync";
import { useTheme } from "../../hooks/useTheme";
import { LyricLine as LyricLineRow } from "./LyricLine";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
// Fine-tuned offset for perfect vertical centering alignment
const SCROLL_CENTER_OFFSET = SCREEN_HEIGHT / 2 - 180;

type LyricsListProps = {
  lyricsData: LyricLine[];
  playbackPositionMs: number;
  isRomanized: boolean;
  /** False for unsynced sources (e.g. lyrics.ovh) - their `timeMs` is just a
   * sort-order index, not a real playback position, so highlighting/
   * auto-scrolling against it would be meaningless (or actively wrong). */
  isSynced?: boolean;
  /** Karaoke Mode: pop/glow the active line. No-ops naturally when unsynced,
   * since there's never a highlighted line to pop/glow without real timing. */
  karaokeMode?: boolean;
};

export function LyricsList({
  lyricsData,
  playbackPositionMs,
  isRomanized,
  isSynced = true,
  karaokeMode = false,
}: LyricsListProps) {
  const { accentColor } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const lyricPositions = useRef<Record<number, number>>({});
  const lastScrolledIndex = useRef(-1);
  const isUserScrolling = useRef(false);

  const activeIndex = useMemo(
    () => (isSynced ? findActiveLineIndex(lyricsData, playbackPositionMs) : -1),
    [isSynced, lyricsData, playbackPositionMs],
  );

  useEffect(() => {
    if (!isSynced) return;
    if (activeIndex === -1) return;
    if (isUserScrolling.current) return;
    if (lastScrolledIndex.current === activeIndex) return;

    const targetY = lyricPositions.current[activeIndex];
    if (targetY === undefined) return;

    lastScrolledIndex.current = activeIndex;

    // Smoothly transition to position with native system physics deceleration
    scrollViewRef.current?.scrollTo({
      y: Math.max(0, targetY - SCROLL_CENTER_OFFSET),
      animated: true,
    });
  }, [activeIndex]);

  return (
    <ScrollView
      ref={scrollViewRef}
      className="flex-1"
      contentContainerStyle={{
        paddingHorizontal: 28,
        paddingBottom: SCREEN_HEIGHT / 1.8,
        paddingTop: 40,
      }}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16} // Maximizes scroll listener interaction responsiveness
      decelerationRate="fast"
      onScrollBeginDrag={() => {
        isUserScrolling.current = true;
      }}
      onMomentumScrollEnd={() => {
        isUserScrolling.current = false;
      }}
      onScrollEndDrag={() => {
        isUserScrolling.current = false;
      }}
    >
      {!isSynced ? (
        <View className="flex-row items-center self-center px-3 py-1.5 mb-6 border rounded-pill border-mine-border bg-mine-card">
          <MaterialCommunityIcons name="sync-off" size={14} color={accentColor} />
          <Text className="ml-1.5 text-xs font-outfit-semibold text-mine-muted">
            Unsynced Lyrics
          </Text>
        </View>
      ) : null}
      {lyricsData.map((line, index) => {
        // Unsynced lyrics have no notion of a "current" line: don't dim any
        // line (there's nothing to dim it *against*), but don't accent-color
        // every line either - that's reserved for "this is playing right
        // now", which isn't a claim we can make without real timestamps.
        const isHighlighted = isSynced && index === activeIndex;
        const isDimmed = isSynced && !isHighlighted;
        const lineKey = `${line.timeMs}-${line.o}`;
        const original = isRomanized && line.r ? line.r : line.o;

        return (
          <LyricLineRow
            key={lineKey}
            original={original}
            translation={line.tr || null}
            isHighlighted={isHighlighted}
            isDimmed={isDimmed}
            karaokeMode={karaokeMode}
            accentColor={accentColor}
            onLayout={(event) => {
              // Cache immutable layout targets strictly to bypass recalculations
              lyricPositions.current[index] = event.nativeEvent.layout.y;
            }}
          />
        );
      })}
    </ScrollView>
  );
}
