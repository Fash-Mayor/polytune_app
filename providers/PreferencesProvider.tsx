import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { LineKind } from "../types/lyrics";

export type { LineKind };

export const ALL_LINE_KINDS: LineKind[] = ["o", "r", "tr"];
export const DEFAULT_LINE_LAYOUT: LineKind[] = ["o", "tr"];

// General app preferences, separate from ThemeProvider (which only owns
// accent color). This is the home for toggles that live on the
// Settings/Profile page but aren't about color - starting with Karaoke
// Mode and customizable Lyrics Line Layout.
type PreferencesContextValue = {
  karaokeMode: boolean;
  setKaraokeMode: (enabled: boolean) => void;
  lineLayout: LineKind[];
  setLineLayout: (layout: LineKind[]) => void;
  resetLineLayout: () => void;
};

export const PreferencesContext = createContext<PreferencesContextValue | null>(
  null,
);

const PREFERENCES_STORAGE_KEY = "@polytune:preferences";

type StoredPreferences = {
  karaokeMode?: boolean;
  lineLayout?: unknown;
};

function sanitizeLineLayout(raw: unknown): LineKind[] {
  if (!Array.isArray(raw)) return DEFAULT_LINE_LAYOUT;
  const seen = new Set<LineKind>();
  const valid: LineKind[] = [];
  for (const item of raw) {
    if (
      (item === "o" || item === "r" || item === "tr") &&
      !seen.has(item)
    ) {
      seen.add(item);
      valid.push(item);
    }
  }
  return valid.length > 0 ? valid : DEFAULT_LINE_LAYOUT;
}

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
  const [lineLayout, setLineLayoutState] =
    useState<LineKind[]>(DEFAULT_LINE_LAYOUT);
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
        setLineLayoutState(sanitizeLineLayout(stored.lineLayout));
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

  useEffect(() => {
    if (!isLoaded) return;
    void AsyncStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ karaokeMode, lineLayout }),
    );
  }, [isLoaded, karaokeMode, lineLayout]);

  const setKaraokeMode = useCallback((enabled: boolean) => {
    setKaraokeModeState(enabled);
  }, []);

  const setLineLayout = useCallback((layout: LineKind[]) => {
    setLineLayoutState(sanitizeLineLayout(layout));
  }, []);

  const resetLineLayout = useCallback(() => {
    setLineLayoutState(DEFAULT_LINE_LAYOUT);
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      karaokeMode,
      setKaraokeMode,
      lineLayout,
      setLineLayout,
      resetLineLayout,
    }),
    [karaokeMode, setKaraokeMode, lineLayout, setLineLayout, resetLineLayout],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

