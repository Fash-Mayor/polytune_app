import { useEffect, useMemo, useRef } from "react";
import {
  Dimensions,
  ScrollView,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { LineKind, LyricLine, LyricsSource } from "../../types/lyrics";
import { findActiveLineIndex } from "../../utils/lyricSync";
import { useTheme } from "../../hooks/useTheme";
import { usePreferences } from "../../hooks/usePreferences";
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
  /** Whether these lyrics came from an external provider or a user upload. */
  lyricsSource?: LyricsSource;
  /** Karaoke Mode: pop/glow the active line. No-ops naturally when unsynced,
   * since there's never a highlighted line to pop/glow without real timing. */
  karaokeMode?: boolean;
};

function resolveLinesForRow(
  line: LyricLine,
  lineLayout: LineKind[],
  isRomanized: boolean,
): string[] {
  const hasBothOAndR = lineLayout.includes("o") && lineLayout.includes("r");

  const effectiveLayout =
    hasBothOAndR && isRomanized
      ? lineLayout.map((k) => (k === "o" ? "r" : k === "r" ? "o" : k))
      : lineLayout;

  const result: string[] = [];

  for (const kind of effectiveLayout) {
    let raw = "";
    if (kind === "o") {
      raw = !hasBothOAndR && isRomanized ? line.r || line.o : line.o;
    } else if (kind === "r") {
      raw = hasBothOAndR ? line.r : isRomanized ? line.o : line.r || line.o;
    } else if (kind === "tr") {
      raw = line.tr;
    }

    const trimmed = raw?.trim();
    if (trimmed && !result.includes(trimmed)) {
      result.push(trimmed);
    }
  }

  const fallback = line.o?.trim() || line.tr?.trim() || line.r?.trim();
  if (result.length === 0 && fallback) {
    result.push(fallback);
  }

  return result;
}

export function LyricsList({
  lyricsData,
  playbackPositionMs,
  isRomanized,
  isSynced = true,
  lyricsSource = "provider",
  karaokeMode = false,
}: LyricsListProps) {
  const { accentColor } = useTheme();
  const { lineLayout } = usePreferences();
  const scrollViewRef = useRef<ScrollView>(null);
  const lyricPositions = useRef<Record<number, number>>({});
  const lastScrolledIndex = useRef(-1);
  // Timestamp (ms) until which auto-scroll is paused because the user is
  // dragging/flinging. A time-based lock (instead of a boolean that depends on
  // drag/momentum end events all firing) can never get stuck "on".
  const userScrollLockUntil = useRef(0);

  const layoutKey = lineLayout.join(",");

  const activeIndex = useMemo(
    () => (isSynced ? findActiveLineIndex(lyricsData, playbackPositionMs) : -1),
    [isSynced, lyricsData, playbackPositionMs],
  );
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  // New song or new layout: cached positions and "already scrolled" state
  // are stale and must be dropped.
  useEffect(() => {
    lyricPositions.current = {};
    lastScrolledIndex.current = -1;
    userScrollLockUntil.current = 0;
  }, [layoutKey, lyricsData]);

  const scrollToActive = () => {
    const index = activeIndexRef.current;
    if (!isSynced || index === -1) return;
    if (Date.now() < userScrollLockUntil.current) return;
    if (lastScrolledIndex.current === index) return;

    const targetY = lyricPositions.current[index];
    // Row not measured yet; its onLayout will call us back.
    if (targetY === undefined) return;

    lastScrolledIndex.current = index;
    scrollViewRef.current?.scrollTo({
      y: Math.max(0, targetY - SCROLL_CENTER_OFFSET),
      animated: true,
    });
  };

  useEffect(() => {
    scrollToActive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, isSynced, lyricsData]);

  const lockForUser = (ms: number) => {
    userScrollLockUntil.current = Date.now() + ms;
  };

  return (
    <View className="flex-1">
      {!isSynced ? (
        <View
          pointerEvents="none"
          className="absolute left-0 right-0 z-10 items-center"
          style={{ top: 14 }}
        >
          <View className="flex-row items-center px-3 py-1.5 border rounded-pill border-mine-border bg-mine-card">
            <MaterialCommunityIcons
              name={lyricsSource === "user" ? "account-music-outline" : "sync-off"}
              size={14}
              color={accentColor}
            />
            <Text className="ml-1.5 text-xs font-outfit-semibold text-mine-muted">
              {lyricsSource === "user" ? "User Upload" : "Unsynced Lyrics"}
            </Text>
          </View>
        </View>
      ) : null}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 28,
          paddingBottom: SCREEN_HEIGHT / 1.8,
          paddingTop: !isSynced ? 64 : 40,
        }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16} // Maximizes scroll listener interaction responsiveness
        decelerationRate="fast"
        onScrollBeginDrag={() => lockForUser(60_000)}
        onScrollEndDrag={() => lockForUser(2500)}
        onMomentumScrollEnd={() => lockForUser(1500)}
      >
        {lyricsData.map((line, index) => {
          // Unsynced lyrics have no notion of a "current" line: don't dim any
          // line (there's nothing to dim it *against*), but don't accent-color
          // every line either - that's reserved for "this is playing right
          // now", which isn't a claim we can make without real timestamps.
          const isHighlighted = isSynced && index === activeIndex;
          const isDimmed = isSynced && !isHighlighted;
          const lineKey = `${line.timeMs}-${line.o}-${layoutKey}`;
          const lines = resolveLinesForRow(line, lineLayout, isRomanized);

          return (
            <LyricLineRow
              key={lineKey}
              lines={lines}
              isHighlighted={isHighlighted}
              isDimmed={isDimmed}
              karaokeMode={karaokeMode}
              accentColor={accentColor}
              onLayout={(event) => {
                // Cache immutable layout targets strictly to bypass recalculations
                lyricPositions.current[index] = event.nativeEvent.layout.y;
                if (index === activeIndexRef.current) scrollToActive();
              }}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

