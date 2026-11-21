import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ReportingService } from "../../services/reportingService";
import {
  LyricsUploadService,
  cleanPillLines,
} from "../../services/lyricsUploadService";
import { useTheme } from "../../hooks/useTheme";

type FeedbackType = "bug" | "lyrics";
type LyricsTab = "original" | "romanised" | "english";
type NoticeVariant = "success" | "error";

type FeedbackNotice = {
  variant: NoticeVariant;
  title: string;
  message: string;
};

const LYRICS_TABS: { key: LyricsTab; label: string; placeholder: string }[] = [
  {
    key: "original",
    label: "Original",
    placeholder: "Paste the lyrics in their original script...",
  },
  {
    key: "romanised",
    label: "Romanised",
    placeholder: "Paste the romanised lyrics here...",
  },
  {
    key: "english",
    label: "English",
    placeholder: "Paste the English translation here...",
  },
];

export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const { accentColor } = useTheme();
  const [type, setType] = useState<FeedbackType>("bug");
  const [details, setDetails] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [lyricsTab, setLyricsTab] = useState<LyricsTab>("original");
  const [lyrics, setLyrics] = useState<Record<LyricsTab, string>>({
    original: "",
    romanised: "",
    english: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<FeedbackNotice | null>(null);

  const activeLyricsTab = LYRICS_TABS.find((t) => t.key === lyricsTab)!;

  const showNotice = (
    variant: NoticeVariant,
    title: string,
    message: string,
  ) => {
    setNotice({ variant, title, message });
  };

  const submitFeedback = async () => {
    if (submitting) return;

    if (type === "bug") {
      if (!details.trim()) {
        showNotice("error", "Missing Details", "Please describe the bug you encountered before submitting.");
        return;
      }
      setSubmitting(true);
      try {
        await ReportingService.reportBug(details);
        showNotice("success", "Thank You!", "Your bug report has been submitted and logged for review.");
        setDetails("");
      } catch (err: any) {
        showNotice("error", "Submission Error", err?.message ?? "Could not submit your bug report right now. Please try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const cleanTitle = songTitle.trim();
    const cleanArtist = artist.trim();
    if (!cleanTitle || !cleanArtist) {
      showNotice(
        "error",
        "Missing Info",
        "Please enter both the Song Title and Artist.",
      );
      return;
    }

    const filledTabs = LYRICS_TABS.map((tab) => ({
      label: tab.label,
      lines: cleanPillLines(lyrics[tab.key]),
    })).filter((tab) => tab.lines.length > 0);

    if (filledTabs.length === 0) {
      showNotice(
        "error",
        "Missing Lyrics",
        "Please enter lyrics in at least one tab (Original, Romanised, or English).",
      );
      return;
    }

    const expectedLines = filledTabs[0]!.lines.length;
    const hasMismatch = filledTabs.some(
      (tab) => tab.lines.length !== expectedLines,
    );
    if (hasMismatch) {
      const counts = filledTabs
        .map((tab) => `${tab.label}: ${tab.lines.length} lines`)
        .join("\n");
      showNotice(
        "error",
        "Line Count Mismatch",
        `Every filled tab must have the same number of lines so the lyrics stay aligned:\n\n${counts}`,
      );
      return;
    }

    setSubmitting(true);
    try {
      await LyricsUploadService.submitLyrics({
        trackTitle: cleanTitle,
        artistName: cleanArtist,
        original: lyrics.original,
        romanised: lyrics.romanised,
        english: lyrics.english,
      });
      showNotice(
        "success",
        "Thank You!",
        "Your lyrics have been uploaded and are now live whenever this song is played.",
      );
      setSongTitle("");
      setArtist("");
      setLyrics({ original: "", romanised: "", english: "" });
    } catch (err: any) {
      showNotice(
        "error",
        "Upload Failed",
        err?.message ?? "Could not upload lyrics right now. Please try again.",
      );
    } finally {
      setSubmitting(false);
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
      <Text
        className="text-[28px] font-outfit-bold"
        style={{ color: accentColor }}
      >
        Help Improve PolyTune
      </Text>
      <Text className="mt-3 text-base leading-6 font-outfit-medium text-mine-muted">
        Your feedback helps us provide a better experience. Please let us know
        if you encountered a bug, or help out by uploading lyrics for a song.
      </Text>

      <Text className="mt-8 mb-3 text-xs tracking-widest font-outfit-bold text-mine-muted">
        FEEDBACK TYPE
      </Text>

      <View className="flex-row gap-3 mb-6">
        <TouchableOpacity
          onPress={() => setType("bug")}
          className="flex-1 items-center rounded-xl border border-mine-border bg-mine-card p-4"
          style={type === "bug" ? { borderColor: accentColor } : undefined}
        >
          <MaterialCommunityIcons
            name="bug-outline"
            size={22}
            color={type === "bug" ? accentColor : "#71717A"}
          />
          <Text
            className={`mt-2 text-sm ${
              type === "bug" ? "text-mine-white" : "text-mine-muted"
            }`}
          >
            Report a Bug
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setType("lyrics")}
          className="flex-1 items-center rounded-xl border border-mine-border bg-mine-card p-4"
          style={type === "lyrics" ? { borderColor: accentColor } : undefined}
        >
          <MaterialCommunityIcons
            name="file-upload-outline"
            size={22}
            color={type === "lyrics" ? accentColor : "#71717A"}
          />
          <Text
            className={`mt-2 text-sm ${
              type === "lyrics" ? "text-mine-white" : "text-mine-muted"
            }`}
          >
            Upload Lyrics
          </Text>
        </TouchableOpacity>
      </View>

      {type === "bug" ? (
        <>
          <Text className="mb-2 text-xs tracking-widest font-outfit-bold text-mine-muted">
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
          <Text className="text-xl font-outfit-bold text-mine-white">
            Lyrics Upload
          </Text>
          <Text className="mt-2 text-sm leading-5 font-outfit-medium text-mine-muted">
            Paste plain lyrics only — no timestamps needed as only unsynced
            lyrics are supported for now. And one line per lyric line.
          </Text>

          <Text className="mt-5 mb-2 text-sm font-outfit-semibold text-mine-white">
            Song Title
          </Text>
          <TextInput
            className="px-4 py-3 text-base border rounded-xl border-mine-border bg-mine-input text-mine-white"
            value={songTitle}
            onChangeText={setSongTitle}
            placeholder="e.g. Idol"
            placeholderTextColor="#71717A"
          />

          <Text className="mt-4 mb-2 text-sm font-outfit-semibold text-mine-white">
            Artist
          </Text>
          <TextInput
            className="px-4 py-3 text-base border rounded-xl border-mine-border bg-mine-input text-mine-white"
            value={artist}
            onChangeText={setArtist}
            placeholder="e.g. Yoasobi"
            placeholderTextColor="#71717A"
          />

          <Text className="mt-4 mb-2 text-sm font-outfit-semibold text-mine-white">
            Lyrics
          </Text>
          <View className="flex-row gap-2 mb-3">
            {LYRICS_TABS.map((tab) => {
              const active = tab.key === lyricsTab;
              const filled = lyrics[tab.key].trim().length > 0;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setLyricsTab(tab.key)}
                  className="flex-row items-center px-4 py-2 border rounded-pill border-mine-border bg-mine-input"
                  style={
                    active
                      ? {
                          borderColor: accentColor,
                          backgroundColor: accentColor,
                        }
                      : undefined
                  }
                >
                  <Text
                    className={`text-sm font-outfit-semibold ${
                      active ? "text-mine-bg" : "text-mine-muted"
                    }`}
                  >
                    {tab.label}
                  </Text>
                  {filled && !active && (
                    <View
                      className="ml-2 h-1.5 w-1.5 rounded-pill"
                      style={{ backgroundColor: accentColor }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput
            key={lyricsTab}
            className="min-h-[200px] rounded-xl border border-mine-border bg-mine-input p-4 text-base text-mine-white"
            multiline
            textAlignVertical="top"
            value={lyrics[lyricsTab]}
            onChangeText={(text) =>
              setLyrics((prev) => ({ ...prev, [lyricsTab]: text }))
            }
            placeholder={activeLyricsTab.placeholder}
            placeholderTextColor="#71717A"
          />
        </View>
      )}

      <TouchableOpacity
        onPress={submitFeedback}
        disabled={submitting}
        className="flex-row items-center justify-center py-4 mt-6 rounded-pill shadow-glow"
        style={{
          backgroundColor: accentColor,
          opacity: submitting ? 0.7 : 1,
        }}
      >
        {submitting ? (
          <>
            <ActivityIndicator size="small" color="#121212" />
            <Text className="ml-2 text-lg font-outfit-bold text-mine-bg">
              {type === "lyrics" ? "Uploading..." : "Submitting..."}
            </Text>
          </>
        ) : (
          <Text className="text-lg font-outfit-bold text-mine-bg">Submit</Text>
        )}
      </TouchableOpacity>

      <Modal
        visible={notice !== null}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setNotice(null)}
      >
        <Pressable
          className="justify-end flex-1 px-4 bg-black/80"
          style={{ paddingBottom: Math.max(insets.bottom + 16, 32) }}
          onPress={() => setNotice(null)}
        >
          <Pressable
            className="w-full p-6 border rounded-3xl border-mine-border bg-mine-card"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="items-center py-2">
              <View
                className="items-center justify-center w-14 h-14 mb-4 rounded-full"
                style={{
                  backgroundColor:
                    notice?.variant === "error"
                      ? "rgba(248, 113, 113, 0.15)"
                      : `${accentColor}22`,
                }}
              >
                <MaterialCommunityIcons
                  name={
                    notice?.variant === "error"
                      ? "alert-circle-outline"
                      : "check-circle-outline"
                  }
                  size={30}
                  color={notice?.variant === "error" ? "#F87171" : accentColor}
                />
              </View>
              <Text className="text-lg text-center font-outfit-bold text-mine-white">
                {notice?.title}
              </Text>
              <Text className="mt-2 text-sm leading-5 text-center font-sans text-mine-muted">
                {notice?.message}
              </Text>
              <TouchableOpacity
                onPress={() => setNotice(null)}
                className="w-full items-center justify-center rounded-pill py-3.5 mt-6"
                style={{ backgroundColor: accentColor }}
              >
                <Text className="text-base font-outfit-bold text-mine-bg">
                  {notice?.variant === "error" ? "Got It" : "Done"}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
