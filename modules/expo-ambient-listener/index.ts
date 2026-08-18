import { EventEmitter, type EventSubscription } from "expo-modules-core";
import type { MediaEvent } from "../../types/media";
import ExpoAmbientListenerModule from "./src/ExpoAmbientListenerModule";

export type { MediaEvent };

const emitter = new EventEmitter<{
  onMediaChanged: (event: MediaEvent) => void;
}>(ExpoAmbientListenerModule);

function normalizeEvent(event: Partial<MediaEvent>): MediaEvent {
  return {
    title: event.title ?? "",
    artist: event.artist ?? "Unknown Artist",
    albumArt: event.albumArt ?? null,
    isPlaying: event.isPlaying ?? false,
    playbackPositionMs: event.playbackPositionMs ?? 0,
  };
}

export function addMediaListener(
  listener: (event: MediaEvent) => void,
): EventSubscription {
  return emitter.addListener("onMediaChanged", (event) =>
    listener(normalizeEvent(event)),
  );
}

export function togglePlayback(): Promise<void> {
  return ExpoAmbientListenerModule.togglePlayback();
}

export function skipToNext(): Promise<void> {
  return ExpoAmbientListenerModule.skipToNext();
}

export function skipToPrevious(): Promise<void> {
  return ExpoAmbientListenerModule.skipToPrevious();
}

export function getCurrentPlaybackPosition(): Promise<number> {
  return ExpoAmbientListenerModule.getCurrentPlaybackPosition();
}

/** Poll OS media session, re-emit track metadata, and return latest state. */
export function refreshActiveSession(): Promise<MediaEvent> {
  return ExpoAmbientListenerModule.refreshActiveSession().then(normalizeEvent);
}

export function isNotificationAccessEnabled(): Promise<boolean> {
  return ExpoAmbientListenerModule.isNotificationAccessEnabled();
}

export function openNotificationAccessSettings(): Promise<void> {
  return ExpoAmbientListenerModule.openNotificationAccessSettings();
}
