import { useCallback, useEffect, useRef, useState } from "react";
import EventSource from "react-native-sse";
import { usePostHog } from "posthog-react-native";
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
  const [isSynced, setIsSynced] = useState(true);
  const [refetchToken, setRefetchToken] = useState(0);
  const activeEventSource = useRef<EventSource | null>(null);
  const posthog = usePostHog();

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
    // Reset to the safe default until the server tells us otherwise - the
    // server always sends `meta` before the first `item`, so in practice
    // this only matters for the brief window before the stream connects.
    setIsSynced(true);

    activeEventSource.current = startLyricsStream(title, artist, {
      onLine: (line) => {
        setFetchingLyrics(false);
        setLyricsData((prev) => appendLine(prev, line));
      },
      onMeta: (meta) => setIsSynced(meta.synced),
      onDone: () => setFetchingLyrics(false),
      onError: () => setFetchingLyrics(false),
    });

    posthog?.capture("Lyrics_Stream_Started", { artist });

    return closeStream;
  }, [title, artist, refetchToken, closeStream, posthog]);

  return { lyricsData, fetchingLyrics, isSynced, refetch };
}
