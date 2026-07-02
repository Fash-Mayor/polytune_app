import type { LyricLine } from "../types/lyrics";

/** Best-effort duration when the OS does not expose track length. */
export function estimateDurationMs(
  lyricsData: LyricLine[] | null,
  positionMs: number,
): number {
  if (lyricsData && lyricsData.length > 0) {
    return lyricsData[lyricsData.length - 1].timeMs + 20_000;
  }
  return Math.max(positionMs + 90_000, 246_000);
}
