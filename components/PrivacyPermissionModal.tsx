import React from "react";
import { Modal, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";

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
  const { accentColor } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="justify-end flex-1 px-4 pb-8 bg-black/80">
        <View className="max-h-[85%] w-full rounded-3xl border border-mine-primary/30 bg-mine-card p-6 shadow-2xl">
          <View className="items-center mb-6">
            <View className="p-3 mb-3 rounded-full bg-mine-primary/10">
              <MaterialCommunityIcons
                name="shield-check"
                size={40}
                color={accentColor}
              />
            </View>
            <Text
              className="text-xl font-outfit-bold text-center text-mine-primary"
              style={{ color: accentColor }}
            >
              Privacy & Connection Security
            </Text>
            <Text className="mt-1 text-xs text-center text-mine-muted">
              Why PolyTune requests notification access
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            className="mb-6"
            contentContainerStyle={{ gap: 16 }}
          >
            <View className="flex-row items-start p-4 border rounded-xl border-mine-primary/15 bg-mine-primary/5">
              <View className="p-2 mr-3 rounded-lg bg-mine-primary/10">
                <MaterialCommunityIcons
                  name="playlist-music"
                  size={20}
                  color={accentColor}
                />
              </View>
              <View className="flex-1">
                <Text
                  className="mb-1 text-sm font-outfit-bold text-mine-primary"
                  style={{ color: accentColor }}
                >
                  What We Access & Sync
                </Text>
                <Text className="text-xs leading-relaxed text-mine-muted">
                  We only monitor active media alerts (e.g. Spotify, Youtube,
                  Apple Music) to fetch track title, artist, play/pause state,
                  and playback position so we can display perfectly synced
                  lyrics.
                </Text>
              </View>
            </View>

            <View className="flex-row items-start p-4 border rounded-xl border-red-500/15 bg-red-500/5">
              <View className="p-2 mr-3 rounded-lg bg-red-500/10">
                <MaterialCommunityIcons
                  name="eye-off"
                  size={20}
                  color="#EF4444"
                />
              </View>
              <View className="flex-1">
                <Text className="mb-1 text-sm font-outfit-bold text-red-400">
                  Strict Privacy — What We CANNOT See
                </Text>
                <Text className="text-xs leading-relaxed text-mine-muted">
                  PolyTune{" "}
                  <Text className="font-outfit-bold text-white">
                    does not and cannot
                  </Text>{" "}
                  read your messages, emails, chats, or photos. We have{" "}
                  <Text className="font-outfit-bold text-white">
                    absolutely zero access
                  </Text>{" "}
                  to your security tokens or payment details.
                </Text>
              </View>
            </View>

            <View className="flex-row items-start p-4 border rounded-xl border-amber-500/15 bg-amber-500/5">
              <View className="p-2 mr-3 rounded-lg bg-amber-500/10">
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={20}
                  color="#F59E0B"
                />
              </View>
              <View className="flex-1">
                <Text className="mb-1 text-sm font-outfit-bold text-amber-400">
                  Android's Standard System Warning
                </Text>
                <Text className="text-xs leading-relaxed text-mine-muted">
                  Android shows a generic, scary warning that this app can "read
                  all notifications...including personal data". This is
                  Android's default notice for{" "}
                  <Text className="font-outfit-bold text-white">any</Text> notification
                  listener. (e.g. smartwatches, car systems.) We ignore
                  everything except media controls.
                </Text>
              </View>
            </View>
          </ScrollView>

          <View className="gap-3">
            <TouchableOpacity
              onPress={onConfirm}
              className="w-full items-center justify-center rounded-pill py-3.5"
              style={{ backgroundColor: accentColor }}
            >
              <Text className="text-base font-outfit-bold text-mine-bg">
                Continue to Settings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              className="items-center justify-center w-full py-3 border rounded-pill border-mine-primary"
            >
              <Text className="text-sm font-outfit-bold text-mine-primary">
                Not Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
