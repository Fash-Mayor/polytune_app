import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";

type SyncIssueModalProps = {
  visible: boolean;
  trackTitle: string;
  trackArtist: string;
  onClose: () => void;
  onSubmit: (note: string) => Promise<void>;
};

type SubmitState = "form" | "submitting" | "success" | "error";

export function SyncIssueModal({
  visible,
  trackTitle,
  trackArtist,
  onClose,
  onSubmit,
}: SyncIssueModalProps) {
  const { accentColor } = useTheme();
  const [note, setNote] = useState("");
  const [state, setState] = useState<SubmitState>("form");
  const [errorMessage, setErrorMessage] = useState("");

  // Reset to a clean form every time the modal is (re)opened for a new report.
  useEffect(() => {
    if (visible) {
      setNote("");
      setState("form");
      setErrorMessage("");
    }
  }, [visible]);

  const handleSubmit = async () => {
    setState("submitting");
    try {
      await onSubmit(note);
      setState("success");
    } catch (err: any) {
      setErrorMessage(err?.message ?? "Something went wrong.");
      setState("error");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="justify-end flex-1 px-4 pb-8 bg-black/80">
        <View className="w-full p-6 border rounded-3xl border-mine-border bg-mine-card">
          {state === "success" ? (
            <View className="items-center py-2">
              <View
                className="items-center justify-center w-14 h-14 mb-4 rounded-full"
                style={{ backgroundColor: `${accentColor}22` }}
              >
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={30}
                  color={accentColor}
                />
              </View>
              <Text className="text-lg text-center font-outfit-bold text-mine-white">
                Thank You!
              </Text>
              <Text className="mt-1 text-sm text-center font-sans text-mine-muted">
                The sync issue has been logged for correction.
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="w-full items-center justify-center rounded-pill py-3.5 mt-6"
                style={{ backgroundColor: accentColor }}
              >
                <Text className="text-base font-outfit-bold text-mine-bg">
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View className="items-center mb-5">
                <View
                  className="items-center justify-center w-14 h-14 mb-3 rounded-full"
                  style={{ backgroundColor: `${accentColor}22` }}
                >
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={28}
                    color={accentColor}
                  />
                </View>
                <Text className="text-xl text-center font-outfit-bold text-mine-white">
                  Report Sync Issue
                </Text>
                <Text
                  className="mt-1 text-sm text-center font-sans text-mine-muted"
                  numberOfLines={1}
                >
                  {trackTitle} — {trackArtist}
                </Text>
              </View>

              <Text className="mb-2 text-xs tracking-widest font-outfit-bold text-mine-muted">
                WHAT'S WRONG? (OPTIONAL)
              </Text>
              <TextInput
                className="min-h-[100px] rounded-xl border border-mine-border bg-mine-input p-4 text-base font-sans text-mine-white"
                multiline
                textAlignVertical="top"
                value={note}
                onChangeText={setNote}
                placeholder="e.g. lyrics are a couple seconds behind, chorus lines missing, romanised text mixed in with the translation..."
                placeholderTextColor="#71717A"
                editable={state !== "submitting"}
              />

              {state === "error" ? (
                <Text className="mt-3 text-sm font-sans text-red-400">
                  {errorMessage}
                </Text>
              ) : null}

              <View className="gap-3 mt-5">
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={state === "submitting"}
                  className="w-full flex-row items-center justify-center rounded-pill py-3.5"
                  style={{
                    backgroundColor: accentColor,
                    opacity: state === "submitting" ? 0.7 : 1,
                  }}
                >
                  {state === "submitting" ? (
                    <ActivityIndicator size="small" color="#121212" />
                  ) : (
                    <Text className="text-base font-outfit-bold text-mine-bg">
                      {state === "error" ? "Try Again" : "Submit Report"}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onClose}
                  disabled={state === "submitting"}
                  className="items-center justify-center w-full py-3 border rounded-pill border-mine-border"
                >
                  <Text className="text-sm font-outfit-semibold text-mine-white">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
