/** Blends a `#rrggbb` hex color toward black by `amount` (0-1). Used to keep
 * album-art-derived backgrounds dark enough for white lyric text to stay
 * readable, regardless of how bright the source color is. */
export function darkenHexColor(hex: string, amount: number): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return hex;

  const blend = (channel: number) => Math.round(channel * (1 - amount));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");

  return `#${toHex(blend(r))}${toHex(blend(g))}${toHex(blend(b))}`;
}
