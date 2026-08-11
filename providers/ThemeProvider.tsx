import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance, type ColorValue } from "react-native";
import {
  DISCO_THEME_COLORS,
  THEME_PRESETS,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from "../constants/themePresets";

type ThemeContextValue = {
  themeMode: ThemeMode;
  accentColor: string;
  setThemeMode: (mode: ThemeMode) => void;
  setCustomAccentColor: (color: string) => void;
  isDiscoMode: boolean;
  isCustomTheme: boolean;
  resetTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const DEFAULT_ACCENT = "#22C55E";

function parseStoredTheme(value: string | null): {
  mode: ThemeMode;
  accent: string;
} {
  if (!value) {
    return { mode: "default", accent: DEFAULT_ACCENT };
  }

  try {
    const parsed = JSON.parse(value) as { mode?: ThemeMode; accent?: string };
    return {
      mode: parsed.mode ?? "default",
      accent: parsed.accent ?? DEFAULT_ACCENT,
    };
  } catch {
    return { mode: "default", accent: DEFAULT_ACCENT };
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("default");
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);
  const [isLoaded, setIsLoaded] = useState(false);

  const persistTheme = useCallback(async (mode: ThemeMode, color: string) => {
    await AsyncStorage.setItem(
      THEME_STORAGE_KEY,
      JSON.stringify({ mode, accent: color }),
    );
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadTheme = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (!mounted) return;

        const storedTheme = parseStoredTheme(storedValue);
        setThemeModeState(storedTheme.mode);
        setAccentColor(storedTheme.accent);
      } catch (error) {
        console.warn("Theme load failed", error);
      } finally {
        if (mounted) setIsLoaded(true);
      }
    };

    void loadTheme();

    return () => {
      mounted = false;
    };
  }, []);

  const setThemeMode = useCallback(
    async (mode: ThemeMode) => {
      if (mode === "custom") {
        setThemeModeState("custom");
        return;
      }

      const preset = THEME_PRESETS.find((entry) => entry.id === mode);
      const nextAccent = preset?.accent ?? DEFAULT_ACCENT;
      setThemeModeState(mode);
      setAccentColor(nextAccent);
      if (isLoaded) {
        await persistTheme(mode, nextAccent);
      }
    },
    [isLoaded, persistTheme],
  );

  const setCustomAccentColor = useCallback(
    async (color: string) => {
      const normalized = color.startsWith("#") ? color : `#${color}`;
      setThemeModeState("custom");
      setAccentColor(normalized);
      if (isLoaded) {
        await persistTheme("custom", normalized);
      }
    },
    [isLoaded, persistTheme],
  );

  const resetTheme = useCallback(async () => {
    setThemeModeState("default");
    setAccentColor(DEFAULT_ACCENT);
    if (isLoaded) {
      await AsyncStorage.removeItem(THEME_STORAGE_KEY);
    }
  }, [isLoaded]);

  const isDiscoMode = themeMode === "disco";
  const isCustomTheme = themeMode === "custom";

  useEffect(() => {
    if (!isLoaded) return;
    void persistTheme(themeMode, accentColor);
  }, [accentColor, isLoaded, persistTheme, themeMode]);

  useEffect(() => {
    if (!isLoaded) return;
    if (themeMode !== "disco") return;

    const interval = setInterval(() => {
      setAccentColor(
        DISCO_THEME_COLORS[
          Math.floor(Math.random() * DISCO_THEME_COLORS.length)
        ],
      );
    }, 900);

    return () => clearInterval(interval);
  }, [isLoaded, themeMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeMode,
      accentColor,
      setThemeMode,
      setCustomAccentColor,
      isDiscoMode,
      isCustomTheme,
      resetTheme,
    }),
    [
      accentColor,
      isCustomTheme,
      isDiscoMode,
      resetTheme,
      setCustomAccentColor,
      setThemeMode,
      themeMode,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
