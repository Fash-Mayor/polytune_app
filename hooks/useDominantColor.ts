import { useEffect, useRef, useState } from "react";
import { getColors } from "react-native-image-colors";
import { darkenHexColor } from "../utils/color";
import { isValidAlbumArtUri } from "../utils/albumArt";

/** Matches `mine-bg` in tailwind.config.js - the app's normal dark background. */
const FALLBACK_BG = "#121212";

/**
 * Extracts a readable, dark-toned background color from an album art URI -
 * this is what makes Karaoke Mode's "background matches the song" effect
 * work. Prefers the library's own dark swatches (already tuned to stay
 * readable against text) over the raw dominant/average color, then darkens
 * whatever we get a bit further as a safety margin for unusually bright art.
 *
 * Keeps showing the last resolved color (or the fallback) while a new one
 * is loading/failing, rather than flashing to black on every track change.
 */
export function useDominantColor(uri: string | null | undefined): string {
  const [color, setColor] = useState(FALLBACK_BG);
  const lastUriRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isValidAlbumArtUri(uri)) {
      lastUriRef.current = null;
      setColor(FALLBACK_BG);
      return;
    }

    if (lastUriRef.current === uri) return;
    lastUriRef.current = uri;

    let cancelled = false;

    getColors(uri, { fallback: FALLBACK_BG, cache: true, key: uri })
      .then((result) => {
        if (cancelled) return;

        const picked =
          result.platform === "android"
            ? result.darkVibrant || result.darkMuted || result.dominant || result.average
            : result.platform === "ios"
              ? result.background
              : undefined;

        if (picked) {
          setColor(darkenHexColor(picked, 0.35));
        }
      })
      .catch(() => {
        // Keep whatever was last showing - a failed extraction shouldn't
        // flash the background to black.
      });

    return () => {
      cancelled = true;
    };
  }, [uri]);

  return color;
}
