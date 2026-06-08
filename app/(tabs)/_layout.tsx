import { Tabs } from 'expo-router';
import { COLORS } from '../../constants/theme';
import { FontAwesome } from '@expo/vector-icons'; // Built-in Expo icons

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Hides the top header so your custom UI shows
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 15,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textInactive,
      }}
    >
      <Tabs.Screen
        name="lyrics"
        options={{
          title: 'Lyrics',
          tabBarIcon: ({ color }) => <FontAwesome name="music" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="feedback"
        options={{
          title: 'Feedback',
          tabBarIcon: ({ color }) => <FontAwesome name="commenting" size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}