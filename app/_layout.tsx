import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Text, TextInput } from "react-native";
import { useFonts } from "expo-font";
import { PostHogProvider } from "posthog-react-native";

SplashScreen.preventAutoHideAsync(); // Prevent the splash screen from auto-hiding

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

  useEffect(() => {
    const textComponent = Text as typeof Text & {
      defaultProps?: { style?: unknown };
    };
    const textInputComponent = TextInput as typeof TextInput & {
      defaultProps?: { style?: unknown };
    };

    textComponent.defaultProps = {
      ...(textComponent.defaultProps ?? {}),
      style: [
        { fontFamily: "Outfit_400Regular" },
        textComponent.defaultProps?.style,
      ],
    };
    textInputComponent.defaultProps = {
      ...(textInputComponent.defaultProps ?? {}),
      style: [
        { fontFamily: "Outfit_400Regular" },
        textInputComponent.defaultProps?.style,
      ],
    };
  }, []);

  return (
    <PostHogProvider
      apiKey={process.env.EXPO_PUBLIC_POSTHOG_KEY!}
      options={{
        host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
        disabled: false,
        captureAppLifecycleEvents: true,
      }}
    >
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
    </PostHogProvider>
  );
}
