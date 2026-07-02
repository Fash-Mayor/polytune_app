import { useWindowDimensions } from "react-native";

const COMPACT_HEIGHT = 860;

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isCompact = height < COMPACT_HEIGHT;

  const artSize = Math.round(
    Math.min(width * 0.42, isCompact ? height * 0.17 : height * 0.22, 208),
  );
  const logoSize = Math.round(Math.min(width * 0.52, height * 0.28, 220));
  const cardPadding = isCompact ? 12 : 20;
  const sectionGap = isCompact ? 8 : 16;
  const playButtonSize = isCompact ? 52 : 64;

  return {
    width,
    height,
    isCompact,
    artSize,
    logoSize,
    cardPadding,
    sectionGap,
    playButtonSize,
  };
}
