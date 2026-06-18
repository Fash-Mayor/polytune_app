import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { useState } from "react";
import { COLORS } from "../../constants/theme";

export default function FeedbackScreen() {
  const [type, setType] = useState<"bug" | "translation">("bug");

  const SubmitFeedback = async () => {
    alert(
      "Lol, your submission no dey go anywhere💀. Jk, Implementing Feedback soon🚀",
    );
  };

  return (
    <View
      className="flex-1 px-7"
      style={{ backgroundColor: COLORS.background }}
    >
      <View>
        <TouchableOpacity className="py-2">
          <Text className="text-[26px] font-bold" style={{ color: COLORS.primary }}>
            Help Improve LyricsMine
          </Text>
        </TouchableOpacity>
      </View>
      <Text
        className="pt-4 text-base leading-6"
        style={{ color: COLORS.textInactive }}
      >
        Your feedback helps us provide a better experience. Please let us know
        if you encountered a bug or if you have suggestions for a better
        translation.
      </Text>

      <Text
        className="mb-2 mt-8 text-sm font-bold tracking-[1px]"
        style={{ color: COLORS.primary }}
      >
        FEEDBACK TYPE
      </Text>
      <View className="mb-6 flex-row gap-3">
        <TouchableOpacity
          className="flex-1 items-center rounded-lg border p-4"
          style={{
            borderColor: type === "bug" ? COLORS.border : COLORS.textInactive,
            backgroundColor: COLORS.surface,
          }}
          onPress={() => setType("bug")}
        >
          <Text
            className="font-semibold"
            style={{
              color: type === "bug" ? COLORS.primary : COLORS.textInactive,
            }}
          >
            🐛 Report a Bug
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 items-center rounded-lg border p-4"
          style={{
            borderColor:
              type === "translation" ? COLORS.border : COLORS.textInactive,
            backgroundColor: COLORS.surface,
          }}
          onPress={() => setType("translation")}
        >
          <Text
            className="font-semibold"
            style={{
              color:
                type === "translation" ? COLORS.primary : COLORS.textInactive,
            }}
          >
            A/文 Suggest Translation
          </Text>
        </TouchableOpacity>
      </View>

      <Text
        className="mb-2 text-sm font-bold tracking-[1px]"
        style={{ color: COLORS.primary }}
      >
        DETAILS
      </Text>
      <TextInput
        className="flex-1 rounded-lg border p-4 text-base"
        style={{
          borderColor: COLORS.border,
          backgroundColor: COLORS.surface,
          color: COLORS.primary,
        }}
        multiline
        placeholder="Please describe the issue or provide your suggested translation here..."
        placeholderTextColor={COLORS.textInactive}
      />

      <TouchableOpacity
        className="mt-6 items-center rounded-full p-4"
        style={{ backgroundColor: COLORS.primary }}
        onPress={SubmitFeedback}
      >
        <Text
          className="text-2xl font-bold"
          style={{ color: COLORS.background }}
        >
          Submit Feedback
        </Text>
      </TouchableOpacity>
    </View>
  );
}
