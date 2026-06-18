import EventSource from "react-native-sse";
import type { LyricLine } from "../types/lyrics";

const SUPABASE_FUNCTION_URL =
  process.env.EXPO_PUBLIC_SUPABASE_FUNCTION_URL ?? "";

export type LyricsStreamCallbacks = {
  onLine: (line: LyricLine) => void;
  onDone: () => void;
  onError: (message: string) => void;
};

export function startLyricsStream(
  title: string,
  artist: string,
  callbacks: LyricsStreamCallbacks,
): EventSource {
  const es = new EventSource(SUPABASE_FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trackTitle: title, artistName: artist }),
  });

  es.addEventListener("message", (event: { data?: string }) => {
    if (!event.data) return;

    try {
      const data = JSON.parse(event.data);

      if (data.error) {
        es.close();
        callbacks.onError(data.error);
        return;
      }

      if (data.item) {
        callbacks.onLine(data.item);
      }

      if (data.done) {
        es.close();
        callbacks.onDone();
      }
    } catch (error) {
      console.error("SSE parse error:", error);
    }
  });

  es.addEventListener("error", () => {
    es.close();
    callbacks.onError("Stream connection failed");
  });

  return es;
}
