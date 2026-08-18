export type LyricLine = {
  o: string;
  r: string;
  tr: string;
  timeMs: number;
};

export type LyricsStreamMessage =
  | { item: LyricLine }
  | { meta: { synced: boolean } }
  | { done: true }
  | { error: string };
