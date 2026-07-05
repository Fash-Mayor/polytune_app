import { useEffect, useMemo, useRef } from "react";
import {
  Dimensions,
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import type { LyricLine } from "../../types/lyrics";
import { findActiveLineIndex } from "../../utils/lyricSync";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
// Fine-tuned offset for perfect vertical centering alignment
const SCROLL_CENTER_OFFSET = SCREEN_HEIGHT / 2 - 180;

type LyricsListProps = {
  lyricsData: LyricLine[];
  playbackPositionMs: number;
  isRomanized: boolean;
};

export function LyricsList({
  lyricsData,
  playbackPositionMs,
  isRomanized,
}: LyricsListProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const lyricPositions = useRef<Record<number, number>>({});
  const lastScrolledIndex = useRef(-1);
  const isUserScrolling = useRef(false);

  const activeIndex = useMemo(
    () => findActiveLineIndex(lyricsData, playbackPositionMs),
    [lyricsData, playbackPositionMs],
  );

  useEffect(() => {
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
      contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: SCREEN_HEIGHT / 1.8, paddingTop: 40 }}
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
      {lyricsData.map((line, index) => {
        const isActive = index === activeIndex;
        const lineKey = `${line.timeMs}-${line.o}`;
        const original = isRomanized && line.r ? line.r : line.o;

        return (
          <View
            key={lineKey}
            className="mb-8"
            onLayout={(event) => {
              // Cache immutable layout targets strictly to bypass recalculations
              lyricPositions.current[index] = event.nativeEvent.layout.y;
            }}
          >
            <Text
              className={`text-[25px] font-bold leading-9 ${
                isActive ? "text-mine-primary" : "text-mine-muted"
              }`}
              style={{ opacity: isActive ? 1.0 : 0.3 }}
            >
              {original}
            </Text>
            {line.tr ? (
              <Text
                className={`mt-1 text-[21px] font-medium leading-5  ${
                  isActive ? "text-mine-white" : "text-mine-muted"
                }`}
                style={{ opacity: isActive ? 1.0 : 0.3 }}
              >
                {line.tr}
              </Text>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}