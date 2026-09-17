import { useEffect, useState } from "react";
import { AppState, Image, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrivacyPermissionModal } from "../components/PrivacyPermissionModal";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { useTheme } from "../hooks/useTheme";
import {
  isNotificationAccessEnabled,
  openNotificationAccessSettings,
} from "../modules/expo-ambient-listener";

const LOGO = require("../assets/PolyTuneLogo.png");

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height, logoSize, isCompact } = useResponsiveLayout();
  const { accentColor } = useTheme();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [checking, setChecking] = useState(true);

  const goToAppIfPermitted = async () => {
    const granted = await isNotificationAccessEnabled();
    if (granted) {
      router.replace("/(tabs)");
    }
    return granted;
  };

  useEffect(() => {
    goToAppIfPermitted().finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        goToAppIfPermitted();
      }
    });
    return () => sub.remove();
  }, []);

  const handleStartListening = () => {
    setShowPrivacyModal(true);
  };

  const handleConfirmPrivacy = async () => {
    setShowPrivacyModal(false);
    await openNotificationAccessSettings();
  };

  if (checking) {
    return <View className="flex-1 bg-mine-bg" />;
  }

  const glowSize = width * 1.15;

  return (
    <View
      className="flex-1 bg-mine-bg"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 12 }}
    >
      <View
        pointerEvents="none"
        className="absolute inset-0 items-center"
        style={{ top: height * 0.12 }}
      >
        <View
          style={{
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            backgroundColor: `${accentColor}22`,
          }}
        />
      </View>

      <View className="items-center justify-center flex-1 px-8">
        <Image
          source={LOGO}
          style={{
            width: logoSize,
            height: logoSize,
            marginBottom: isCompact ? 16 : 24,
          }}
          resizeMode="contain"
        />

        <Text
          className="text-center font-outfit-bold text-mine-white"
          style={{ fontSize: isCompact ? 36 : 42, letterSpacing: 0.5 }}
        >
          PolyTune
        </Text>

        <Text
          className="max-w-xs mt-3 text-center font-outfit-medium text-mine-white/90"
          style={{
            fontSize: isCompact ? 16 : 18,
            lineHeight: isCompact ? 24 : 28,
          }}
        >
          Instantly Translate Your Music
        </Text>
      </View>

      <View className="flex-shrink-0 px-6">
        <TouchableOpacity
          onPress={handleStartListening}
          className="flex-row items-center justify-center py-4 rounded-pill shadow-glow"
          style={{ backgroundColor: accentColor }}
          accessibilityLabel="Start listening"
        >
          <MaterialCommunityIcons name="headphones" size={22} color="#121212" />
          <Text className="ml-2 text-lg font-outfit-bold text-mine-bg">
            Start Listening
          </Text>
        </TouchableOpacity>

        <Text className="mt-4 text-center text-[10px] font-outfit-semibold uppercase tracking-[1.5px] text-mine-dim">
          Secure connection via Android media session
        </Text>
      </View>

      <PrivacyPermissionModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onConfirm={handleConfirmPrivacy}
      />
    </View>
  );
}
