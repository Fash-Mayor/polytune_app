import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LyricLine } from "../types/lyrics";

// Step 5's premium hook, per Reads/me.md's sketch: lyrics/romanizations are
// tiny strings, so a downloaded track is just its JSON payload sitting in
// AsyncStorage under `@offline_lyrics_{trackKey}` - no filesystem access,
// no complex sync. useLyricsStream checks this before opening any network
// stream, so a downloaded track loads with zero network requests and works
// with no session token (real offline / airplane-mode use).
const KEY_PREFIX = "@offline_lyrics_";

export type OfflineLyricsPayload = {
  lyricsData: LyricLine[];
  isSynced: boolean;
};

function storageKey(trackKey: string): string {
  return `${KEY_PREFIX}${trackKey}`;
}

export async function saveOfflineLyrics(
  trackKey: string,
  payload: OfflineLyricsPayload,
): Promise<void> {
  await AsyncStorage.setItem(storageKey(trackKey), JSON.stringify(payload));
}

export async function getOfflineLyrics(
  trackKey: string,
): Promise<OfflineLyricsPayload | null> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(trackKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.lyricsData)) return null;
    return { lyricsData: parsed.lyricsData, isSynced: parsed.isSynced !== false };
  } catch (e) {
    console.warn("[OFFLINE LYRICS] Failed to read/parse stored lyrics:", e);
    return null;
  }
}

export async function removeOfflineLyrics(trackKey: string): Promise<void> {
  await AsyncStorage.removeItem(storageKey(trackKey));
}

export async function isOfflineLyricsSaved(trackKey: string): Promise<boolean> {
  const raw = await AsyncStorage.getItem(storageKey(trackKey));
  return raw != null;
}
