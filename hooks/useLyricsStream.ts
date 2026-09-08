import { useCallback, useEffect, useRef, useState } from "react";
import EventSource from "react-native-sse";
import { usePostHog } from "posthog-react-native";
import { startLyricsStream, type StreamQuota } from "../services/lyricsStream";
import {
  getOfflineLyrics,
  removeOfflineLyrics,
  saveOfflineLyrics,
} from "../services/offlineLyrics";
import { useAuth } from "./useAuth";
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
  const [quota, setQuota] = useState<StreamQuota | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [isOfflineSaved, setIsOfflineSaved] = useState(false);
  const [refetchToken, setRefetchToken] = useState(0);
  const activeEventSource = useRef<EventSource | null>(null);
  const posthog = usePostHog();
  const { session } = useAuth();
  const accessToken = session?.access_token;

  const trackKey = title && artist ? `${title}::${artist}` : null;

  const closeStream = useCallback(() => {
    activeEventSource.current?.close();
    activeEventSource.current = null;
  }, []);

  // Refetch always hits the network (a manual "resync" is exactly the case
  // where a stale downloaded copy shouldn't be trusted) - the offline
  // lookup below is skipped for exactly the one effect run this triggers.
  const bypassOfflineOnce = useRef(false);
  const refetch = useCallback(() => {
    bypassOfflineOnce.current = true;
    setRefetchToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (!title || !artist || !trackKey) return;

    closeStream();
    setFetchingLyrics(true);
    setLyricsData([]);
    setQuotaExceeded(false);
    setIsOfflineSaved(false);
    // Reset to the safe default until the server tells us otherwise - the
    // server always sends `meta` before the first `item`, so in practice
    // this only matters for the brief window before the stream connects.
    setIsSynced(true);

    const skipOffline = bypassOfflineOnce.current;
    bypassOfflineOnce.current = false;
    let cancelled = false;

    (async () => {
      // Downloaded-for-offline track (Step 5 premium hook, Reads/me.md):
      // zero network requests, works with no session token at all.
      if (!skipOffline) {
        const offline = await getOfflineLyrics(trackKey);
        if (cancelled) return;
        if (offline) {
          setLyricsData(offline.lyricsData);
          setIsSynced(offline.isSynced);
          setIsOfflineSaved(true);
          setFetchingLyrics(false);
          return;
        }
      }

      // The whole app is gated behind sign-in (app/_layout.tsx's Gate), so
      // there should always be a session here - but a token can be
      // mid-refresh, so guard rather than send a request the server will
      // just 401 on.
      if (!accessToken) {
        setFetchingLyrics(false);
        return;
      }

      activeEventSource.current = startLyricsStream(title, artist, accessToken, {
        onLine: (line) => {
          setFetchingLyrics(false);
          setLyricsData((prev) => appendLine(prev, line));
        },
        onMeta: (meta) => {
          setIsSynced(meta.synced);
          if (meta.quota) setQuota(meta.quota);
        },
        onDone: () => setFetchingLyrics(false),
        onError: (message, code) => {
          setFetchingLyrics(false);
          if (code === "quota_exceeded") {
            setQuotaExceeded(true);
            posthog?.capture("Paywall_Hit", { artist, reason: "quota_exceeded" });
          }
        },
      });

      posthog?.capture("Lyrics_Stream_Started", { artist });
    })();

    return () => {
      cancelled = true;
      closeStream();
    };
  }, [title, artist, trackKey, accessToken, refetchToken, closeStream, posthog]);

  const toggleOffline = useCallback(async () => {
    if (!trackKey) return;
    if (isOfflineSaved) {
      await removeOfflineLyrics(trackKey);
      setIsOfflineSaved(false);
      return;
    }
    if (!lyricsData || lyricsData.length === 0) return;
    await saveOfflineLyrics(trackKey, { lyricsData, isSynced });
    setIsOfflineSaved(true);
  }, [trackKey, isOfflineSaved, lyricsData, isSynced]);

  return {
    lyricsData,
    fetchingLyrics,
    isSynced,
    quota,
    quotaExceeded,
    isOfflineSaved,
    toggleOffline,
    refetch,
  };
}
