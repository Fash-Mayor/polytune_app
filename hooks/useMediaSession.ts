import { useCallback, useEffect, useState } from "react";
import {
  addMediaListener,
  refreshActiveSession,
} from "../modules/expo-ambient-listener";
import type { CurrentTrack, MediaEvent } from "../types/media";

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

function eventToTrack(event: MediaEvent): CurrentTrack | null {
  if (!event.title.trim()) return null;
  return {
    title: event.title,
    artist: event.artist,
    albumArt: event.albumArt,
  };
}

export function useMediaSession(options: UseMediaSessionOptions = {}) {
  const { enabled = true } = options;

  const [track, setTrack] = useState<CurrentTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [osPositionMs, setOsPositionMs] = useState(0);

  const applyEvent = useCallback((event: MediaEvent) => {
    const nextTrack = eventToTrack(event);
    if (nextTrack) setTrack(nextTrack);
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

  return { track, isPlaying, osPositionMs, refresh };
}
