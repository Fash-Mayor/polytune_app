import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentPlaybackPosition } from "../modules/expo-ambient-listener";

const TICK_MS = 100;

export function usePlaybackPosition(
  isPlaying: boolean,
  trackKey: string | null,
  osPositionMs: number,
) {
  const [positionMs, setPositionMs] = useState(0);
  const osPositionRef = useRef(osPositionMs);
  const lastOsSyncRef = useRef(Date.now());

  useEffect(() => {
    setPositionMs(0);
    osPositionRef.current = 0;
    lastOsSyncRef.current = Date.now();
  }, [trackKey]);

  useEffect(() => {
    osPositionRef.current = osPositionMs;
    lastOsSyncRef.current = Date.now();
    setPositionMs(osPositionMs);
  }, [osPositionMs]);

  useEffect(() => {
    if (!isPlaying || trackKey == null) return;

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - lastOsSyncRef.current;
      setPositionMs(osPositionRef.current + elapsed);
    }, TICK_MS);

    return () => clearInterval(intervalId);
  }, [isPlaying, trackKey]);

  const resync = useCallback(async () => {
    const osMs = await getCurrentPlaybackPosition();
    osPositionRef.current = osMs;
    lastOsSyncRef.current = Date.now();
    setPositionMs(osMs);
    return osMs;
  }, []);

  return { playbackPositionMs: positionMs, resync };
}
