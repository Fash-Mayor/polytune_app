export type MediaEvent = {
  title: string;
  artist: string;
  albumArt: string | null;
  isPlaying: boolean;
  playbackPositionMs: number;
};

export type CurrentTrack = {
  title: string;
  artist: string;
  albumArt: string | null;
};
