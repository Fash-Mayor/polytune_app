import { supabase } from "../utils/supabase";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_FUNCTION_URL =
  process.env.EXPO_PUBLIC_SUPABASE_FUNCTION_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

function resolveUploadLyricsUrl(): string {
  if (SUPABASE_FUNCTION_URL.includes("/fetch-lyrics")) {
    return SUPABASE_FUNCTION_URL.replace("/fetch-lyrics", "/upload-lyrics");
  }
  const base = SUPABASE_URL.replace(/\/+$/, "");
  return `${base}/functions/v1/upload-lyrics`;
}

const UPLOAD_LYRICS_URL = resolveUploadLyricsUrl();

/**
 * Strips any accidental [mm:ss.xx] timestamps, collapses extra spaces, and
 * removes empty lines so client-side line counting matches the server 1:1.
 */
export function cleanPillLines(rawText: string): string[] {
  if (!rawText) return [];
  return rawText
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/\[\d+:\d+(?::\d+)?(?:\.\d+)?\]/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((line) => line.length > 0);
}

export type SubmitLyricsInput = {
  trackTitle: string;
  artistName: string;
  original: string;
  romanised: string;
  english: string;
};

export const LyricsUploadService = {
  async submitLyrics(input: SubmitLyricsInput): Promise<{ lineCount: number }> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;
    if (!accessToken) {
      throw new Error("Please sign in to upload lyrics.");
    }

    const response = await fetch(UPLOAD_LYRICS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        action: "upload",
        trackTitle: input.trackTitle,
        artistName: input.artistName,
        original: input.original,
        romanised: input.romanised,
        english: input.english,
      }),
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      throw new Error(`Upload failed (HTTP ${response.status}).`);
    }

    if (!response.ok || data?.error) {
      throw new Error(
        data?.error || `Lyrics upload failed (HTTP ${response.status}).`,
      );
    }

    return { lineCount: data?.lineCount ?? 0 };
  },

  /**
   * Non-blocking background check triggered when a user-uploaded track finishes
   * streaming. If the user upload is >= 7 days old, `upload-lyrics` checks
   * LRCLIB -> Musixmatch -> lyrics.ovh in the background and upgrades the cache
   * row to `source = 'provider'` for the next play.
   */
  recheckProvidersInBackground(
    trackTitle: string,
    artistName: string,
    accessToken: string | undefined,
  ): void {
    if (!accessToken || !trackTitle || !artistName) return;

    fetch(UPLOAD_LYRICS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        action: "recheck_providers",
        trackTitle,
        artistName,
      }),
    }).catch(() => {
      // Silent background task — never disturb playback on failure
    });
  },
};
