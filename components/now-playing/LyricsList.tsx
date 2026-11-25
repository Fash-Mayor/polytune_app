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

type LyricsListProps = {
  lyricsData: LyricLine[];
  playbackPositionMs: number;
  isRomanized: boolean;
  /** Unique identifier for the current track so cached row layouts reset on
   * track change without being wiped as SSE lines stream in for the same song. */
  trackKey?: string | null;
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
  const hasO = lineLayout.includes("o");
  const result: string[] = [];

  for (const kind of lineLayout) {
    let raw = "";
    if (kind === "o") {
      // The Original/Romanise pill toggles the Original slot directly.
      raw = isRomanized ? line.r || line.o : line.o;
    } else if (kind === "r") {
      // Keep the Romanised slot as Romanised when Original is also enabled
      // (so toggling the pill can intentionally show two Romanised lines in
      // their configured Settings positions). If Original is turned off and
      // only Romanised is enabled, let the pill toggle it to Original.
      raw = !hasO && isRomanized ? line.o : line.r || line.o;
    } else if (kind === "tr") {
      raw = line.tr;
    }

    const trimmed = raw?.trim();
    if (trimmed) {
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
  trackKey = null,
  isSynced = true,
  lyricsSource = "provider",
  karaokeMode = false,
}: LyricsListProps) {
  const { accentColor } = useTheme();
  const { lineLayout } = usePreferences();
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollViewHeight = useRef(0);
  const lyricLayouts = useRef<Record<number, { y: number; height: number }>>({});
  const lastScrolledIndex = useRef(-1);
  // Timestamp (ms) until which auto-scroll is paused because the user is
  // dragging/flinging. A time-based lock (instead of a boolean that depends on
  // drag/momentum end events all firing) can never get stuck "on".
  const userScrollLockUntil = useRef(0);
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const layoutKey = lineLayout.join(",");

  const activeIndex = useMemo(
    () => (isSynced ? findActiveLineIndex(lyricsData, playbackPositionMs) : -1),
    [isSynced, lyricsData, playbackPositionMs],
  );
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  // New song or new settings layout: cached positions and "already scrolled"
  // state are stale and must be dropped. Deliberately NOT keyed on `lyricsData`
  // so streaming SSE lines for the same song never wipe already-measured rows.
  useEffect(() => {
    lyricLayouts.current = {};
    lastScrolledIndex.current = -1;
    userScrollLockUntil.current = 0;
    if (unlockTimerRef.current) {
      clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = null;
    }
  }, [layoutKey, trackKey]);

  // Prune any stale indices if the list ever shrinks without wiping valid rows.
  useEffect(() => {
    for (const key of Object.keys(lyricLayouts.current)) {
      if (Number(key) >= lyricsData.length) {
        delete lyricLayouts.current[Number(key)];
      }
    }
  }, [lyricsData.length]);

  useEffect(() => {
    return () => {
      if (unlockTimerRef.current) {
        clearTimeout(unlockTimerRef.current);
        unlockTimerRef.current = null;
      }
    };
  }, []);

  const scrollToActive = () => {
    const index = activeIndexRef.current;
    if (!isSynced || index === -1) return;
    if (Date.now() < userScrollLockUntil.current) return;
    if (lastScrolledIndex.current === index) return;

    const layout = lyricLayouts.current[index];
    // Row not measured yet; its onLayout will call us back.
    if (!layout) return;

    const targetOffset =
      scrollViewHeight.current > 0
        ? layout.y + layout.height / 2 - scrollViewHeight.current / 2
        : layout.y - (SCREEN_HEIGHT / 2 - 180);

    lastScrolledIndex.current = index;
    scrollViewRef.current?.scrollTo({
      y: Math.max(0, targetOffset),
      animated: true,
    });
  };

  useEffect(() => {
    scrollToActive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, isSynced, layoutKey, trackKey]);

  const lockForUser = (ms: number, scheduleResume = false) => {
    userScrollLockUntil.current = Date.now() + ms;
    if (unlockTimerRef.current) {
      clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = null;
    }
    if (scheduleResume) {
      unlockTimerRef.current = setTimeout(() => {
        unlockTimerRef.current = null;
        scrollToActive();
      }, ms + 50);
    }
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
        onLayout={(event) => {
          const nextHeight = event.nativeEvent.layout.height;
          if (Math.abs(nextHeight - scrollViewHeight.current) > 1) {
            scrollViewHeight.current = nextHeight;
            lastScrolledIndex.current = -1;
            scrollToActive();
          }
        }}
        onScrollBeginDrag={() => lockForUser(60_000, false)}
        onScrollEndDrag={() => lockForUser(2500, true)}
        onMomentumScrollEnd={() => lockForUser(1500, true)}
      >
        {lyricsData.map((line, index) => {
          // Unsynced lyrics have no notion of a "current" line: don't dim any
          // line (there's nothing to dim it *against*), but don't accent-color
          // every line either - that's reserved for "this is playing right
          // now", which isn't a claim we can make without real timestamps.
          const isHighlighted = isSynced && index === activeIndex;
          const isDimmed = isSynced && !isHighlighted;
          const lineKey = `${line.timeMs}-${index}-${layoutKey}`;
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
                const { y, height } = event.nativeEvent.layout;
                const prev = lyricLayouts.current[index];
                lyricLayouts.current[index] = { y, height };
                if (index === activeIndexRef.current) {
                  const moved =
                    !prev ||
                    Math.abs(prev.y - y) > 2 ||
                    Math.abs(prev.height - height) > 2;
                  if (moved) {
                    lastScrolledIndex.current = -1;
                  }
                  scrollToActive();
                }
              }}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

