import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "../constants/theme";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View
      className="flex-1 justify-between px-7 py-7"
      style={{ backgroundColor: COLORS.background }}
    >
      <View className="flex-1 items-center justify-center">
        <Image
          source={require("../assets/NuMain.png")}
          style={{ width: 128, height: 128 }}
          resizeMode="contain"
        />
        <Text
          className="mb-2 text-[48px] font-bold"
          style={{ color: COLORS.primary }}
        >
          LyricsMine
        </Text>
        <Text
          className="text-center text-lg"
          style={{ color: COLORS.textInactive }}
        >
          Universal Ambient Listener
        </Text>
      </View>

      <View className="items-center pb-10">
        <TouchableOpacity
          className="mb-4 w-full items-center rounded-full px-8 py-4"
          style={{ backgroundColor: COLORS.primary }}
          onPress={() => router.push("/(tabs)/lyrics")}
        >
          <Text
            className="text-lg font-bold"
            style={{ color: COLORS.background }}
          >
            🎧 Start Listening
          </Text>
        </TouchableOpacity>
        <Text
          className="text-[10px] font-semibold tracking-[1.5px]"
          style={{ color: COLORS.textInactive }}
        >
          SYSTEM-LEVEL MEDIA DETECTION
        </Text>
      </View>
    </View>
  );
}
