export function isValidAlbumArtUri(
  uri: string | null | undefined,
): uri is string {
  if (!uri) return false;

  return /^(data:|https?:\/\/|file:\/\/|content:\/\/|android\.resource:\/\/)/i.test(
    uri,
  );
}

export const PLACEHOLDER_ART = require("../assets/NuMain.png");
