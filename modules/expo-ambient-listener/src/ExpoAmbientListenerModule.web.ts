import { registerWebModule, NativeModule } from "expo";
import type { MediaEvent } from "../../types/media";

class ExpoAmbientListenerModule extends NativeModule<{
  togglePlayback: () => Promise<void>;
  getCurrentPlaybackPosition: () => Promise<number>;
  refreshActiveSession: () => Promise<MediaEvent>;
  isNotificationAccessEnabled: () => Promise<boolean>;
  openNotificationAccessSettings: () => Promise<void>;
}> {
  async togglePlayback(): Promise<void> {}

  async getCurrentPlaybackPosition(): Promise<number> {
    return 0;
  }

  async refreshActiveSession(): Promise<MediaEvent> {
    return {
      title: "",
      artist: "Unknown Artist",
      albumArt: null,
      isPlaying: false,
      playbackPositionMs: 0,
    };
  }

  async isNotificationAccessEnabled(): Promise<boolean> {
    return false;
  }

  async openNotificationAccessSettings(): Promise<void> {}
}

export default registerWebModule(
  ExpoAmbientListenerModule,
  "ExpoAmbientListenerModule",
);
