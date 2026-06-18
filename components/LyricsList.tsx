import { useEffect, useMemo, useRef } from "react";
import {
  Dimensions,
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { COLORS, SPACING } from "../constants/theme";
import type { LyricLine } from "../types/lyrics";
import { findActiveLineIndex } from "../utils/lyricSync";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SCROLL_CENTER_OFFSET = SCREEN_HEIGHT / 2 - 250;

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
    scrollViewRef.current?.scrollTo({
      y: Math.max(0, targetY - SCROLL_CENTER_OFFSET),
      animated: true,
    });
  }, [activeIndex]);

  const handleScrollBegin = () => {
    isUserScrolling.current = true;
  };

  const handleScrollEnd = (_event: NativeSyntheticEvent<NativeScrollEvent>) => {
    isUserScrolling.current = false;
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      contentContainerStyle={{
        padding: SPACING.margin,
        paddingBottom: SCREEN_HEIGHT / 2,
      }}
      showsVerticalScrollIndicator={false}
      onScrollBeginDrag={handleScrollBegin}
      onMomentumScrollEnd={handleScrollEnd}
      onScrollEndDrag={handleScrollEnd}
    >
      {lyricsData.map((line, index) => {
        const isActive = index === activeIndex;
        const lineKey = `${line.timeMs}-${line.o}`;

        return (
          <View
            key={lineKey}
            className="mb-8"
            onLayout={(event) => {
              lyricPositions.current[index] = event.nativeEvent.layout.y;
            }}
          >
            <Text
              className="text-[28px] font-bold"
              style={{
                color: isActive ? COLORS.textActive : COLORS.textInactive,
                opacity: isActive ? 1 : 0.5,
              }}
            >
              {isRomanized && line.r ? line.r : line.o}
            </Text>
            {line.tr ? (
              <Text
                className="text-[23px] font-semibold"
                style={{
                  color: isActive ? "#ffffff" : COLORS.textInactive,
                  opacity: isActive ? 1 : 0.4,
                }}
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
