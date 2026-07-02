import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from 'react'
import { AnalyticsService } from "../services/analytics";

SplashScreen.preventAutoHideAsync(); // Prevent the splash screen from auto-hiding

export default function RootLayout() {
  
  useEffect(() => {
    // Initialize Mixpanel analytics when the app starts
    AnalyticsService.init();
    SplashScreen.hideAsync();
  }, []);


  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#121212" },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}
