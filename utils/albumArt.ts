export function isValidAlbumArtUri(
  uri: string | null | undefined,
): uri is string {
  if (!uri) return false;
  return (
    uri.startsWith("data:") ||
    uri.startsWith("http://") ||
    uri.startsWith("https://") ||
    uri.startsWith("file://")
  );
}

export const PLACEHOLDER_ART = require("../assets/NuMain.png");
