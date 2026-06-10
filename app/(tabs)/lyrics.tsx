import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import EventSource from "react-native-sse"; // The Native Android/iOS streaming fix

const SUPABASE_FUNCTION_URL =
  process.env.EXPO_PUBLIC_SUPABASE_FUNCTION_URL || "";
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function LyricsScreen() {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [lyricsData, setLyricsData] = useState<
    { o: string; r: string; tr: string; timeMs: number }[] | null
  >(null);
  const [fetchingLyrics, setFetchingLyrics] = useState<boolean>(false);
  const [isRomanized, setIsRomanized] = useState<boolean>(false);
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const lyricPositions = useRef<{ [key: number]: number }>({});

  // Track the active SSE connection so we can cancel it if the user skips a song midway
  const activeEventSource = useRef<EventSource | null>(null);

  useEffect(() => {
    const loadToken = async () => {
      let savedToken = null;
      if (Platform.OS === "web") {
        savedToken = localStorage.getItem("spotify_token");
      } else {
        savedToken = await SecureStore.getItemAsync("spotify_token");
      }
      if (savedToken) setToken(savedToken);
      else alert("Security Error: No access token found.");
    };
    loadToken();
  }, []);

  const fetchLyricsStream = (title: string, artist: string, id: string) => {
    if (activeEventSource.current) {
      activeEventSource.current.close();
    }

    setFetchingLyrics(true);
    setLyricsData([]);

    const es = new EventSource(SUPABASE_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackTitle: title,
        artistName: artist,
        spotifyId: id,
      }),
    });

    activeEventSource.current = es;

    es.addEventListener("message", (event: any) => {
      if (!event.data) return;

      try {
        const data = JSON.parse(event.data);

        if (data.error) {
          alert(data.error);
          es.close();
          setFetchingLyrics(false);
          return;
        }

        if (data.item) {
          // As soon as the first line arrives, hide the loading spinner
          setFetchingLyrics(false);

          setLyricsData((prev) => {
            const currentList = prev || [];
            // Prevent duplicate line rendering
            if (
              currentList.some(
                (line) =>
                  line.timeMs === data.item.timeMs && line.o === data.item.o,
              )
            ) {
              return currentList;
            }
            return [...currentList, data.item].sort(
              (a, b) => a.timeMs - b.timeMs,
            );
          });
        }

        if (data.done) {
          es.close();
          setFetchingLyrics(false);
        }
      } catch (e) {
        console.error("Error parsing SSE data:", e);
        alert("An error occurred while receiving lyrics data." + e);
      }
    });

    es.addEventListener("error", (error) => {
      console.error("EventSource connection error:", error);
      es.close();
      setFetchingLyrics(false);
    });
  };

  const fetchCurrentlyPlaying = async () => {
    if (!token) {
      alert("Authentication failed: Loading token from vault.");
      return;
    }

    try {
      const res = await fetch(
        "https://api.spotify.com/v1/me/player/currently-playing",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.status === 200) {
        const data = await res.json();
        setCurrentTrack(data.item);
        setPlaybackPosition(data.progress_ms);
        setIsPlaying(data.is_playing);

        if (!lyricsData || currentTrack?.id !== data.item.id) {
          fetchLyricsStream(
            data.item.name,
            data.item.artists[0].name,
            data.item.id,
          );
        }
      } else if (res.status === 204) {
        alert("Spotify is connected, but nothing is playing!");
      } else if (res.status === 401) {
        alert("Unauthorized, Reconnect Spotify.");
      }
    } catch (error) {
      console.error("Spotify API Error:", error);
      alert("Failed to fetch currently playing track." + error);
    }
  };

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setPlaybackPosition((prev) => prev + 500);
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const getActiveIndex = () => {
    if (!lyricsData) return -1;
    return lyricsData.reduce((latestIdx, line, idx) => {
      if (playbackPosition >= line.timeMs) return idx;
      return latestIdx;
    }, -1);
  };

  const activeIndex = getActiveIndex();

  useEffect(() => {
    if (
      activeIndex !== -1 &&
      lyricPositions.current[activeIndex] !== undefined
    ) {
      const targetY = lyricPositions.current[activeIndex];
      const centerOffset = SCREEN_HEIGHT / 2 - 250;

      scrollViewRef.current?.scrollTo({
        y: Math.max(0, targetY - centerOffset),
        animated: true,
      });
    }
  }, [activeIndex]);

  const handleDisconnect = async () => {
    if (Platform.OS === "web") localStorage.removeItem("spotify_token");
    else await SecureStore.deleteItemAsync("spotify_token");

    setToken(null);
    setCurrentTrack(null);
    setLyricsData(null);
    if (activeEventSource.current) activeEventSource.current.close();
    router.replace("/");
  };

  return (
    <View className="flex-1 bg-black">
      <View className="flex-row items-center justify-between px-4 pt-8 pb-3">
        <TouchableOpacity onPress={handleDisconnect} className="py-1">
          <Text className="text-base font-semibold text-[#A7A7A7]">
            Disconnect
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsRomanized(!isRomanized)}
          className={[
            "rounded-full border border-[#1DB954] px-3 py-2",
            isRomanized ? "border-[#1DB954]" : "border-[#1DB954]",
          ].join(" ")}
        >
          <Text
            className={
              isRomanized
                ? "text-xs font-bold text-[#1DB954]"
                : "text-xs text-[#1DB954]"
            }
          >
            {isRomanized ? "A/文 Romanised" : "A/文 Original"}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center border-b border-[#1DB954] bg-[#121212] p-4">
        {currentTrack ? (
          <>
            <Image
              source={{ uri: currentTrack.album.images[0]?.url }}
              className="w-12 h-12 mr-3 rounded-lg"
            />
            <View className="flex-1">
              <Text className="text-base font-bold text-[#1DB954]">
                {currentTrack.name}
              </Text>
              <Text className="text-sm text-[#A7A7A7]">
                {currentTrack.artists[0]?.name}
              </Text>
            </View>
          </>
        ) : (
          <View className="flex-1">
            <Text className="text-base font-bold text-[#1DB954]">
              Ready to Sync
            </Text>
            <Text className="text-sm text-[#A7A7A7]">
              Play a track on Spotify
            </Text>
          </View>
        )}

        <TouchableOpacity
          className="rounded-full border border-[#1DB954] px-3 py-2"
          onPress={fetchCurrentlyPlaying}
        >
          <Text className="text-xs text-[#1DB954]">Sync Playback</Text>
        </TouchableOpacity>
      </View>

      {fetchingLyrics && (!lyricsData || lyricsData.length === 0) ? (
        <View className="items-center justify-center flex-1">
          <ActivityIndicator size="large" color="#1DB954" />
          <Text className="mt-4 text-sm italic text-[#A7A7A7]">
            Connecting to Audio Stream...
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            padding: 28,
            paddingBottom: SCREEN_HEIGHT / 2,
          }}
          showsVerticalScrollIndicator={false}
        >
          {lyricsData &&
            lyricsData.map((line, index) => {
              const isActive = index === activeIndex;
              return (
                <View
                  key={index}
                  className="mb-8"
                  onLayout={(event) => {
                    lyricPositions.current[index] = event.nativeEvent.layout.y;
                  }}
                >
                  <Text
                    className={
                      isActive
                        ? "text-[28px] font-bold text-[#1DB954] opacity-100"
                        : "text-[28px] font-bold text-[#A7A7A7] opacity-50"
                    }
                  >
                    {isRomanized && line.r ? line.r : line.o}
                  </Text>
                  {line.tr && (
                    <Text
                      className={
                        isActive
                          ? "text-[23px] font-semibold text-[#ffffff] opacity-100"
                          : "text-[23px] font-semibold text-[#A7A7A7] opacity-40"
                      }
                    >
                      {line.tr}
                    </Text>
                  )}
                </View>
              );
            })}
        </ScrollView>
      )}
    </View>
  );
}
