import { useCallback, useEffect, useRef, useState } from "react";
import EventSource from "react-native-sse";
import { startLyricsStream } from "../services/lyricsStream";
import type { LyricLine } from "../types/lyrics";

function appendLine(prev: LyricLine[] | null, line: LyricLine): LyricLine[] {
  const currentList = prev ?? [];
  if (
    currentList.some(
      (existing) => existing.timeMs === line.timeMs && existing.o === line.o,
    )
  ) {
    return currentList;
  }
  return [...currentList, line].sort((a, b) => a.timeMs - b.timeMs);
}

export function useLyricsStream(
  title: string | undefined,
  artist: string | undefined,
) {
  const [lyricsData, setLyricsData] = useState<LyricLine[] | null>(null);
  const [fetchingLyrics, setFetchingLyrics] = useState(false);
  const [refetchToken, setRefetchToken] = useState(0);
  const activeEventSource = useRef<EventSource | null>(null);

  const closeStream = useCallback(() => {
    activeEventSource.current?.close();
    activeEventSource.current = null;
  }, []);

  const refetch = useCallback(() => {
    setRefetchToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (!title || !artist) return;

    closeStream();
    setFetchingLyrics(true);
    setLyricsData([]);

    activeEventSource.current = startLyricsStream(title, artist, {
      onLine: (line) => {
        setFetchingLyrics(false);
        setLyricsData((prev) => appendLine(prev, line));
      },
      onDone: () => setFetchingLyrics(false),
      onError: () => setFetchingLyrics(false),
    });

    return closeStream;
  }, [title, artist, refetchToken, closeStream]);

  return { lyricsData, fetchingLyrics, refetch };
}
