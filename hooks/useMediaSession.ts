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

function eventToTrack(event: MediaEvent): CurrentTrack | null {
  if (!event.title.trim()) return null;
  return {
    title: event.title,
    artist: event.artist,
    albumArt: event.albumArt,
  };
}

export function useMediaSession(): MediaSessionState {
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
    const subscription = addMediaListener(applyEvent);
    return () => subscription.remove();
  }, [applyEvent]);

  const refresh = useCallback(async () => {
    const event = await refreshActiveSession();
    applyEvent(event);
    return event;
  }, [applyEvent]);

  return { track, isPlaying, osPositionMs, refresh };
}
