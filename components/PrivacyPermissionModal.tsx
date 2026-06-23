import React from "react";
import { Modal, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";

type PrivacyPermissionModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function PrivacyPermissionModal({
  visible,
  onClose,
  onConfirm,
}: PrivacyPermissionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/80 px-4 pb-8">
        <View
          className="w-full rounded-3xl border p-6 shadow-2xl max-h-[85%]"
          style={{
            backgroundColor: COLORS.surface,
            borderColor: "rgba(29, 185, 84, 0.3)", // subtle primary/green border
          }}
        >
          {/* Header */}
          <View className="items-center mb-6">
            <View className="p-3 rounded-full mb-3" style={{ backgroundColor: "rgba(29, 185, 84, 0.1)" }}>
              <MaterialCommunityIcons
                name="shield-check"
                size={40}
                color={COLORS.primary}
              />
            </View>
            <Text className="text-xl font-bold text-center" style={{ color: COLORS.primary }}>
              Privacy & Connection Security
            </Text>
            <Text className="text-xs text-center mt-1" style={{ color: COLORS.textInactive }}>
              Why LyricsMine requests notification access
            </Text>
          </View>

          {/* Info Content ScrollView */}
          <ScrollView 
            showsVerticalScrollIndicator={false}
            className="mb-6"
            contentContainerStyle={{ gap: 16 }}
          >
            {/* What we see */}
            <View className="border rounded-xl p-4 flex-row items-start" style={{ backgroundColor: "rgba(29, 185, 84, 0.05)", borderColor: "rgba(29, 185, 84, 0.15)" }}>
              <View className="p-2 rounded-lg mr-3" style={{ backgroundColor: "rgba(29, 185, 84, 0.1)" }}>
                <MaterialCommunityIcons name="playlist-music" size={20} color={COLORS.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold mb-1" style={{ color: COLORS.primary }}>
                  What We Access & Sync
                </Text>
                <Text className="text-xs leading-relaxed" style={{ color: COLORS.textInactive }}>
                  We only monitor active media alerts (e.g. Spotify, YouTube, Apple Music) to fetch track title, artist, play/pause state, and playback position so we can display perfectly synced lyrics.
                </Text>
              </View>
            </View>

            {/* What we NEVER see */}
            <View className="border rounded-xl p-4 flex-row items-start" style={{ backgroundColor: "rgba(239, 68, 68, 0.05)", borderColor: "rgba(239, 68, 68, 0.15)" }}>
              <View className="p-2 rounded-lg mr-3" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
                <MaterialCommunityIcons name="eye-off" size={20} color="#EF4444" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold mb-1 text-red-400">
                  Strict Privacy — What We CANNOT See
                </Text>
                <Text className="text-xs leading-relaxed" style={{ color: COLORS.textInactive }}>
                  LyricsMine <Text className="font-bold text-white">does not and cannot</Text> read your personal text messages, emails, chats, or photos. We have <Text className="font-bold text-white">absolutely zero access</Text> to your bank codes, security tokens, or credit cards.
                </Text>
              </View>
            </View>

            {/* Android warning explainer */}
            <View className="border rounded-xl p-4 flex-row items-start" style={{ backgroundColor: "rgba(245, 158, 11, 0.05)", borderColor: "rgba(245, 158, 11, 0.15)" }}>
              <View className="p-2 rounded-lg mr-3" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)" }}>
                <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold mb-1 text-amber-400">
                  Android's Standard System Warning
                </Text>
                <Text className="text-xs leading-relaxed" style={{ color: COLORS.textInactive }}>
                  On the next screen, Android will display a generic, scary warning that this app can "read all notifications... including personal data." This is Android's default notice for <Text className="font-bold text-white">any</Text> notification listener (e.g., smartwatches, car systems). We ignore everything except media controls.
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View className="gap-3">
            <TouchableOpacity
              onPress={onConfirm}
              className="w-full items-center justify-center rounded-full py-3.5"
              style={{ backgroundColor: COLORS.primary }}
            >
              <Text className="text-base font-bold text-black">
                Continue to Settings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              className="w-full items-center justify-center rounded-full py-3 border"
              style={{ borderColor: COLORS.border }}
            >
              <Text className="text-sm font-bold" style={{ color: COLORS.primary }}>
                Not Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
