export type LineKind = "o" | "r" | "tr";
export type LyricsSource = "provider" | "user";

export type LyricLine = {
  o: string;
  r: string;
  tr: string;
  timeMs: number;
  source?: LyricsSource;
};

export type LyricsStreamMessage =
  | { item: LyricLine }
  | { meta: { synced: boolean } }
  | { done: true }
  | { error: string };

