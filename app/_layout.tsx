import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import { PostHogProvider } from "posthog-react-native";
import { ThemeProvider } from "../providers/ThemeProvider";
import { PreferencesProvider } from "../providers/PreferencesProvider";
import { AuthProvider } from "../providers/AuthProvider";
import { PurchasesProvider } from "../providers/PurchasesProvider";
import { useAuth } from "../hooks/useAuth";
import { SignInScreen } from "../components/SignInScreen";

SplashScreen.preventAutoHideAsync(); // Prevent the splash screen from auto-hiding

// Auth is the outermost gate for the entire app: nothing under
// app/index.tsx (the permission flow) or app/(tabs) is reachable without a
// signed-in Supabase session. Swapping the whole navigator here - instead
// of a route-level redirect - means a sign-out from deep inside Settings
// drops straight back to the sign-in screen too, from any screen, since
// it's driven by the same `user` state rather than a one-time route check.
function Gate() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <View className="flex-1 bg-mine-bg" />;
  }

  if (!user) {
    return <SignInScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#121212" },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular: require("../assets/fonts/Outfit-Regular.ttf"),
    Outfit_500Medium: require("../assets/fonts/Outfit-Medium.ttf"),
    Outfit_600SemiBold: require("../assets/fonts/Outfit-SemiBold.ttf"),
    Outfit_700Bold: require("../assets/fonts/Outfit-Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  return (
    <PostHogProvider
      apiKey={process.env.EXPO_PUBLIC_POSTHOG_KEY!}
      options={{
        host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
        disabled: false,
        captureAppLifecycleEvents: true,
      }}
    >
      <AuthProvider>
        <PurchasesProvider>
          <ThemeProvider>
            <PreferencesProvider>
              <SafeAreaProvider>
                <StatusBar style="light" />
                <Gate />
              </SafeAreaProvider>
            </PreferencesProvider>
          </ThemeProvider>
        </PurchasesProvider>
      </AuthProvider>
    </PostHogProvider>
  );
}
