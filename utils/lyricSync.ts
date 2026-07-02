import type { LyricLine } from "../types/lyrics";

/** Highest index where line.timeMs <= positionMs (binary search for large lyric sets). */
export function findActiveLineIndex(
  lines: LyricLine[],
  positionMs: number,
): number {
  if (lines.length === 0) return -1;

  let lo = 0;
  let hi = lines.length - 1;
  let result = -1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].timeMs <= positionMs) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return result;
}
