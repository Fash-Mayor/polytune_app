import { Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import type { LayoutChangeEvent } from "react-native";

type LyricLineProps = {
  original: string;
  translation: string | null;
  isHighlighted: boolean;
  isDimmed: boolean;
  karaokeMode: boolean;
  accentColor: string;
  onLayout: (event: LayoutChangeEvent) => void;
};

export function LyricLine({
  original,
  translation,
  isHighlighted,
  isDimmed,
  karaokeMode,
  accentColor,
  onLayout,
}: LyricLineProps) {
  // Scale (a transform) instead of fontSize: transforms don't affect layout
  // flow in RN, so the "pop" doesn't shift the cached scroll-target Y
  // positions of the lines below it - fontSize would.
  const popStyle = useAnimatedStyle(
    () => ({
      transform: [
        {
          scale: withSpring(karaokeMode && isHighlighted ? 1.06 : 1, {
            damping: 14,
            stiffness: 180,
          }),
        },
      ],
    }),
    [karaokeMode, isHighlighted, accentColor],
  );

  // Padding stays constant regardless of highlight state (only the color
  // toggles) so this glow pill never changes the line's box size either -
  // same reasoning as the scale transform above.
  const glowStyle = useAnimatedStyle(
    () => ({
      backgroundColor:
        karaokeMode && isHighlighted ? `${accentColor}26` : "transparent",
    }),
    [karaokeMode, isHighlighted, accentColor],
  );

  return (
    <Animated.View
      className="-mx-4 px-4 py-1 mb-8 rounded-2xl"
      style={glowStyle}
      onLayout={onLayout}
    >
      <Animated.View style={popStyle}>
        <Text
          className={`text-[25px] font-outfit-semibold leading-9 pb-1 ${
            isDimmed ? "text-mine-muted" : "text-mine-white"
          }`}
          style={{
            opacity: isDimmed ? 0.3 : 1.0,
            ...(isHighlighted ? { color: accentColor } : {}),
          }}
        >
          {original}
        </Text>
        {translation ? (
          <Text
            className={`mt-1 text-[21px] font-outfit-medium leading-7 pb-1 ${
              isDimmed ? "text-mine-muted" : "text-mine-white"
            }`}
            style={{ opacity: isDimmed ? 0.3 : 1.0 }}
          >
            {translation}
          </Text>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}
