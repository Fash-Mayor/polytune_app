import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

export type LyricsLayoutMode = "dual" | "triple" | "single";
export type LyricsAlignment = "left" | "center";

// General app preferences, separate from ThemeProvider (which only owns
// accent color). This is the home for toggles and display options that
// live under Settings -> Display & Lyrics.
type PreferencesContextValue = {
  karaokeMode: boolean;
  setKaraokeMode: (enabled: boolean) => void;
  lyricsLayout: LyricsLayoutMode;
  setLyricsLayout: (layout: LyricsLayoutMode) => void;
  lyricsAlignment: LyricsAlignment;
  setLyricsAlignment: (alignment: LyricsAlignment) => void;
};

export const PreferencesContext = createContext<PreferencesContextValue | null>(
  null,
);

const PREFERENCES_STORAGE_KEY = "@polytune:preferences";

type StoredPreferences = {
  karaokeMode?: boolean;
  lyricsLayout?: LyricsLayoutMode;
  lyricsAlignment?: LyricsAlignment;
};

function parseStoredPreferences(value: string | null): StoredPreferences {
  if (!value) return {};
  try {
    return JSON.parse(value) as StoredPreferences;
  } catch {
    return {};
  }
}

export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [karaokeMode, setKaraokeModeState] = useState(false);
  const [lyricsLayout, setLyricsLayoutState] =
    useState<LyricsLayoutMode>("dual");
  const [lyricsAlignment, setLyricsAlignmentState] =
    useState<LyricsAlignment>("left");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadPreferences = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(
          PREFERENCES_STORAGE_KEY,
        );
        if (!mounted) return;
        const stored = parseStoredPreferences(storedValue);
        setKaraokeModeState(stored.karaokeMode ?? false);
        setLyricsLayoutState(stored.lyricsLayout ?? "dual");
        setLyricsAlignmentState(stored.lyricsAlignment ?? "left");
      } catch (error) {
        console.warn("Preferences load failed", error);
      } finally {
        if (mounted) setIsLoaded(true);
      }
    };

    void loadPreferences();

    return () => {
      mounted = false;
    };
  }, []);

  const persistPreferences = useCallback(
    (next: StoredPreferences) => {
      if (!isLoaded) return;
      void AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(next));
    },
    [isLoaded],
  );

  const setKaraokeMode = useCallback(
    (enabled: boolean) => {
      setKaraokeModeState(enabled);
      persistPreferences({
        karaokeMode: enabled,
        lyricsLayout,
        lyricsAlignment,
      });
    },
    [lyricsAlignment, lyricsLayout, persistPreferences],
  );

  const setLyricsLayout = useCallback(
    (layout: LyricsLayoutMode) => {
      setLyricsLayoutState(layout);
      persistPreferences({
        karaokeMode,
        lyricsLayout: layout,
        lyricsAlignment,
      });
    },
    [karaokeMode, lyricsAlignment, persistPreferences],
  );

  const setLyricsAlignment = useCallback(
    (alignment: LyricsAlignment) => {
      setLyricsAlignmentState(alignment);
      persistPreferences({
        karaokeMode,
        lyricsLayout,
        lyricsAlignment: alignment,
      });
    },
    [karaokeMode, lyricsLayout, persistPreferences],
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({
      karaokeMode,
      setKaraokeMode,
      lyricsLayout,
      setLyricsLayout,
      lyricsAlignment,
      setLyricsAlignment,
    }),
    [
      karaokeMode,
      setKaraokeMode,
      lyricsLayout,
      setLyricsLayout,
      lyricsAlignment,
      setLyricsAlignment,
    ],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}
