import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Hides the top header so your custom UI shows
        tabBarStyle: {
          backgroundColor: "#121212",
          borderTopColor: "#1DB954",
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 15,
        },
        tabBarActiveTintColor: "#1DB954",
        tabBarInactiveTintColor: "#A7A7A7",
      }}
    >
      <Tabs.Screen
        name="lyrics"
        options={{
          title: "Lyrics",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="music" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="feedback"
        options={{
          title: "Feedback",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="commenting" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
