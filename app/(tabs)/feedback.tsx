import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ReportingService } from "../../services/reportingService";
import { useTheme } from "../../hooks/useTheme";

type FeedbackType = "bug" | "translation";

export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { accentColor } = useTheme();
  const [type, setType] = useState<FeedbackType>("bug");
  const [details, setDetails] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [lyrics, setLyrics] = useState("");

  const submitFeedback = async () => {
    if (type === "bug") {
      if (!details.trim()) {
        Alert.alert("Error", "Please provide details.");
        return;
      }
      try {
        await ReportingService.reportBug(details);
        Alert.alert("Thank You!", "Your bug report has been submitted.");
        setDetails("");
      } catch (err: any) {
        Alert.alert("Submission Error", err.message);
      }
    } else {
      Alert.alert(
        "Not Implemented",
        "Translation submission is not yet implemented.",
      );
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-mine-bg"
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 24,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-[28px] font-bold" style={{ color: accentColor }}>
        Help Improve PolyTune
      </Text>
      <Text className="mt-3 text-base leading-6 text-mine-muted">
        Your feedback helps us provide a better experience. Please let us know
        if you encountered a bug or if you have suggestions for a better
        translation.
      </Text>

      <Text className="mt-8 mb-3 text-xs font-bold tracking-widest text-mine-muted">
        FEEDBACK TYPE
      </Text>

      <View className="flex-row gap-3 mb-6">
        <TouchableOpacity
          onPress={() => setType("bug")}
          className={`flex-1 items-center rounded-xl border p-4 ${
            type === "bug"
              ? "border-mine-primary bg-mine-card"
              : "border-mine-border bg-mine-card"
          }`}
        >
          <MaterialCommunityIcons
            name="bug-outline"
            size={22}
            color={type === "bug" ? accentColor : "#71717A"}
          />
          <Text
            className={`mt-2 text-sm font-semibold ${
              type === "bug" ? "text-mine-white" : "text-mine-muted"
            }`}
          >
            Report a Bug
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setType("translation")}
          className={`flex-1 items-center rounded-xl border p-4 ${
            type === "translation"
              ? "border-mine-primary bg-mine-card"
              : "border-mine-border bg-mine-card"
          }`}
        >
          <MaterialCommunityIcons
            name="translate"
            size={22}
            color={type === "translation" ? accentColor : "#71717A"}
          />
          <Text
            className={`mt-2 text-sm font-semibold ${
              type === "translation" ? "text-mine-white" : "text-mine-muted"
            }`}
          >
            Suggest Translation
          </Text>
        </TouchableOpacity>
      </View>

      {type === "bug" ? (
        <>
          <Text className="mb-2 text-xs font-bold tracking-widest text-mine-muted">
            DETAILS
          </Text>
          <TextInput
            className="min-h-[220px] rounded-xl border border-mine-border bg-mine-input p-4 text-base text-mine-white"
            multiline
            textAlignVertical="top"
            value={details}
            onChangeText={setDetails}
            placeholder="Please describe the issue here..."
            placeholderTextColor="#71717A"
          />
        </>
      ) : (
        <View className="p-5 border rounded-card border-mine-border bg-mine-card">
          <Text className="text-xl font-bold text-mine-white">
            Lyric Suggestion
          </Text>
          <Text className="mt-2 text-sm leading-5 text-mine-muted">
            Only English translations are supported for now. Ensure your lyrics
            contain time stamps, e.g. [00:12.00]
          </Text>

          <Text className="mt-5 mb-2 text-sm font-semibold text-mine-white">
            Song Title
          </Text>
          <TextInput
            className="px-4 py-3 text-base border rounded-xl border-mine-border bg-mine-input text-mine-white"
            value={songTitle}
            onChangeText={setSongTitle}
            placeholder="e.g. Idol"
            placeholderTextColor="#71717A"
          />

          <Text className="mt-4 mb-2 text-sm font-semibold text-mine-white">
            Artist
          </Text>
          <TextInput
            className="px-4 py-3 text-base border rounded-xl border-mine-border bg-mine-input text-mine-white"
            value={artist}
            onChangeText={setArtist}
            placeholder="e.g. Yoasobi"
            placeholderTextColor="#71717A"
          />

          <Text className="mt-4 mb-2 text-sm font-semibold text-mine-white">
            Lyrics
          </Text>
          <TextInput
            className="min-h-[160px] rounded-xl border border-mine-border bg-mine-input p-4 text-base text-mine-white"
            multiline
            textAlignVertical="top"
            value={lyrics}
            onChangeText={setLyrics}
            placeholder="Enter the correct lyrics here..."
            placeholderTextColor="#71717A"
          />
        </View>
      )}

      <TouchableOpacity
        onPress={submitFeedback}
        className="items-center py-4 mt-6 rounded-pill shadow-glow"
        style={{ backgroundColor: accentColor }}
      >
        <Text className="text-lg font-bold text-mine-bg">Submit Feedback</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
