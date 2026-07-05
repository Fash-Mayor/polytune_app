import { useCallback, useEffect, useRef, useState } from "react";
import {
  addMediaListener,
  refreshActiveSession,
} from "../modules/expo-ambient-listener";
import type { CurrentTrack, MediaEvent } from "../types/media";
import { isValidAlbumArtUri } from "../utils/albumArt";

type MediaSessionState = {
  track: CurrentTrack | null;
  isPlaying: boolean;
  osPositionMs: number;
  refresh: () => Promise<MediaEvent>;
};

type UseMediaSessionOptions = {
  /** When false, the native listener is not subscribed. */
  enabled?: boolean;
};

function eventToTrack(
  event: MediaEvent,
  previousTrack: CurrentTrack | null,
): CurrentTrack | null {
  const title = event.title?.trim();
  if (!title) return previousTrack;

  return {
    title,
    artist: event.artist?.trim() || previousTrack?.artist || "Unknown Artist",
    albumArt: event.albumArt ?? null,
  };
}

export function useMediaSession(options: UseMediaSessionOptions = {}) {
  const { enabled = true } = options;

  const [track, setTrack] = useState<CurrentTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [osPositionMs, setOsPositionMs] = useState(0);
  const artRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const artRetryTrackKeyRef = useRef<string | null>(null);

  const applyEvent = useCallback((event: MediaEvent) => {
    setTrack((previousTrack) => {
      const nextTrack = eventToTrack(event, previousTrack);
      return nextTrack ?? previousTrack;
    });
    setIsPlaying(event.isPlaying);
    setOsPositionMs(event.playbackPositionMs);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setTrack(null);
      setIsPlaying(false);
      setOsPositionMs(0);
      return;
    }

    const subscription = addMediaListener(applyEvent);
    return () => subscription.remove();
  }, [enabled, applyEvent]);

  const refresh = useCallback(async () => {
    if (!enabled) {
      return {
        title: "",
        artist: "Unknown Artist",
        albumArt: null,
        isPlaying: false,
        playbackPositionMs: 0,
      };
    }

    const event = await refreshActiveSession();
    applyEvent(event);
    return event;
  }, [enabled, applyEvent]);

  useEffect(() => {
    if (artRetryTimerRef.current) {
      clearTimeout(artRetryTimerRef.current);
      artRetryTimerRef.current = null;
    }

    if (!enabled || !track?.title) {
      artRetryTrackKeyRef.current = null;
      return;
    }

    if (isValidAlbumArtUri(track.albumArt)) {
      artRetryTrackKeyRef.current = null;
      return;
    }

    const trackKey = `${track.title}::${track.artist ?? "Unknown Artist"}`;
    if (artRetryTrackKeyRef.current === trackKey) {
      return;
    }

    artRetryTrackKeyRef.current = trackKey;

    let attempts = 0;
    const retryAlbumArt = async () => {
      attempts += 1;
      const refreshedEvent = await refresh();
      if (isValidAlbumArtUri(refreshedEvent.albumArt) || attempts >= 6) {
        artRetryTrackKeyRef.current = null;
        return;
      }

      artRetryTimerRef.current = setTimeout(() => {
        void retryAlbumArt();
      }, 600);
    };

    void retryAlbumArt();

    return () => {
      if (artRetryTimerRef.current) {
        clearTimeout(artRetryTimerRef.current);
        artRetryTimerRef.current = null;
      }
    };
  }, [enabled, refresh, track?.title, track?.artist, track?.albumArt]);

  return { track, isPlaying, osPositionMs, refresh };
}
