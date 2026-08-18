import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

// General app preferences, separate from ThemeProvider (which only owns
// accent color). This is the home for toggles that live on the
// Settings/Profile page but aren't about color - starting with Karaoke
// Mode, with room to grow as auth/profile settings land here too.
type PreferencesContextValue = {
  karaokeMode: boolean;
  setKaraokeMode: (enabled: boolean) => void;
};

export const PreferencesContext = createContext<PreferencesContextValue | null>(
  null,
);

const PREFERENCES_STORAGE_KEY = "@polytune:preferences";

type StoredPreferences = { karaokeMode?: boolean };

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

  const setKaraokeMode = useCallback(
    (enabled: boolean) => {
      setKaraokeModeState(enabled);
      if (isLoaded) {
        void AsyncStorage.setItem(
          PREFERENCES_STORAGE_KEY,
          JSON.stringify({ karaokeMode: enabled }),
        );
      }
    },
    [isLoaded],
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({ karaokeMode, setKaraokeMode }),
    [karaokeMode, setKaraokeMode],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}
