export type ThemeMode =
  | "default"
  | "ocean"
  | "violet"
  | "sunset"
  | "custom"
  | "disco";

export type ThemePreset = {
  id: Exclude<ThemeMode, "custom">;
  name: string;
  accent: string;
  description: string;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "default",
    name: "Classic Green",
    accent: "#22C55E",
    description: "The original PolyTune look.",
  },
  {
    id: "ocean",
    name: "Ocean Blue",
    accent: "#38BDF8",
    description: "Fresh and modern blue accents.",
  },
  {
    id: "violet",
    name: "Violet Glow",
    accent: "#A78BFA",
    description: "A deeper purple punch.",
  },
  {
    id: "sunset",
    name: "Sunset Coral",
    accent: "#FB7185",
    description: "Warm and vibrant coral tones.",
  },
];

export const DISCO_THEME_COLORS = [
  "#22C55E",
  "#F43F5E",
  "#3B82F6",
  "#F59E0B",
  "#A855F7",
  "#14B8A6",
];

export const THEME_STORAGE_KEY = "@polytheme:theme";
