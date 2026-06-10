import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { useState } from "react";

export default function FeedbackScreen() {
  const [type, setType] = useState<"bug" | "translation">("bug");

  const SubmitFeedback = async () => {
    alert(
      "Lol, your submission no dey go anywhere💀. Jk, Implementing Feedback soon🚀",
    );
  };

  return (
    <View className="flex-1 bg-black px-7">
      <View>
        <TouchableOpacity className="py-2">
          <Text className="text-[26px] font-bold text-[#1DB954]">
            Help Improve LyricsMine
          </Text>
        </TouchableOpacity>
      </View>
      <Text className="pt-4 text-base leading-6 text-[#A7A7A7]">
        Your feedback helps us provide a better experience. Please let us know
        if you encountered a bug or if you have suggestions for a better
        translation.
      </Text>

      <Text className="mb-2 mt-8 text-sm font-bold tracking-[1px] text-[#1DB954]">
        FEEDBACK TYPE
      </Text>
      <View className="mb-6 flex-row gap-3">
        <TouchableOpacity
          className={[
            "flex-1 items-center rounded-lg border p-4",
            type === "bug"
              ? "border-[#1DB954] bg-[#121212]"
              : "border-[#A7A7A7] bg-[#121212]",
          ].join(" ")}
          onPress={() => setType("bug")}
        >
          <Text
            className={
              type === "bug"
                ? "font-semibold text-[#1DB954]"
                : "font-semibold text-[#A7A7A7]"
            }
          >
            🐛 Report a Bug
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={[
            "flex-1 items-center rounded-lg border p-4",
            type === "translation"
              ? "border-[#1DB954] bg-[#121212]"
              : "border-[#A7A7A7] bg-[#121212]",
          ].join(" ")}
          onPress={() => setType("translation")}
        >
          <Text
            className={
              type === "translation"
                ? "font-semibold text-[#1DB954]"
                : "font-semibold text-[#A7A7A7]"
            }
          >
            A/文 Suggest Translation
          </Text>
        </TouchableOpacity>
      </View>

      <Text className="mb-2 text-sm font-bold tracking-[1px] text-[#1DB954]">
        DETAILS
      </Text>
      <TextInput
        className="flex-1 rounded-lg border border-[#1DB954] bg-[#121212] p-4 text-base text-[#1DB954]"
        multiline
        placeholder="Please describe the issue or provide your suggested translation here..."
        placeholderTextColor="#A7A7A7"
      />

      <TouchableOpacity
        className="mt-6 items-center rounded-full bg-[#1DB954] p-4"
        onPress={SubmitFeedback}
      >
        <Text className="text-base font-bold text-black">Submit Feedback</Text>
      </TouchableOpacity>
    </View>
  );
}
