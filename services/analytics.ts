import { Mixpanel } from 'mixpanel-react-native';

// Replace with your actual Mixpanel Project Token from your dashboard
const MIXPANEL_TOKEN = "YOUR_MIXPANEL_PROJECT_TOKEN";

// Initialize Mixpanel with automatic tracking features enabled
export const mixpanel = new Mixpanel(MIXPANEL_TOKEN, true);

export const AnalyticsService = {
  async init(): Promise<void> {
    try {
      await mixpanel.init();
      console.log("[ANALYTICS] Mixpanel initialized successfully.");
    } catch (error) {
      console.error("[ANALYTICS ERROR] Failed to initialize Mixpanel:", error);
    }
  },

  /**
   * Track specific user behaviors
   * @param eventName Name of the action (e.g., 'Viewed Lyrics')
   * @param properties Metadata details (e.g., { artist: 'SHAUN', track: 'Way Back Home' })
   */
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    mixpanel.track(eventName, properties);
  },

  /**
   * Identify a user across sessions once they log in
   * @param userId Unique identifier (e.g., Supabase user UUID)
   */
  identifyUser(userId: string): void {
    mixpanel.identify(userId);
  },

  /**
   * Set global user properties (e.g., tier type)
   */
  setUserProperties(properties: Record<string, any>): void {
    mixpanel.getPeople().set(properties);
  },

  reset(): void {
    mixpanel.reset();
  }
};