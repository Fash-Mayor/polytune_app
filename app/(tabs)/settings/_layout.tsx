import { Stack } from "expo-router";

export const unstable_settings = {
  anchor: "index",
};

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#121212" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="karaoke" />
      <Stack.Screen name="lyrics-layout" />
      <Stack.Screen name="appearance" />
      <Stack.Screen name="account" />
    </Stack>
  );
}
