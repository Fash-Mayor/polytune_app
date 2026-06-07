import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, SPACING } from '../constants/theme';

// Pulling safely from the .env file
const SUPABASE_FUNCTION_URL = process.env.EXPO_PUBLIC_SUPABASE_FUNCTION_URL || '';

// Helper to convert "[01:14.20]" into 74200 milliseconds
const parseTimecode = (t: string) => {
  if (!t) return 0;
  const match = t.match(/\[(\d+):(\d+\.\d+)\]/);
  if (!match) return 0;
  const mins = parseInt(match[1], 10);
  const secs = parseFloat(match[2]);
  return (mins * 60 + secs) * 1000;
};

export default function LyricsScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [lyricsData, setLyricsData] = useState<{o: string, tr: string, timeMs: number}[] | null>(null);
  const [fetchingLyrics, setFetchingLyrics] = useState<boolean>(false);
  
  // Real-time sync states
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const fetchLyricsFromBackend = async (title: string, artist: string, id: string) => {
    setFetchingLyrics(true);
    setLyricsData(null); 

    try {
      const res = await fetch(SUPABASE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackTitle: title, artistName: artist, spotifyId: id })
      });
      
      const data = await res.json();
      if (data.lyrics) {
        // Map over the lyrics to attach the parsed milliseconds for the sync engine
        const processedLyrics = data.lyrics.map((line: any) => ({
          ...line,
          timeMs: parseTimecode(line.t)
        }));
        setLyricsData(processedLyrics);
      }
      else alert("Could not fetch or translate lyrics for this track.");
    } catch (error) {
      console.error("Network Error:", error);
    } finally {
      setFetchingLyrics(false);
    }
  };

  const fetchCurrentlyPlaying = async () => {
    if (!token) return;
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.status === 200) {
        const data = await res.json();
        setCurrentTrack(data.item);
        
        // Update the sync engine with Spotify's exact timestamp
        setPlaybackPosition(data.progress_ms);
        setIsPlaying(data.is_playing);

        // Only fetch lyrics if it's a new song
        if (!lyricsData || currentTrack?.id !== data.item.id) {
            fetchLyricsFromBackend(data.item.name, data.item.artists[0].name, data.item.id);
        }
      }
    } catch (error) {
      console.error("Spotify API Error:", error);
    }
  };

  // The Local Sync Engine: Ticks forward smoothly while the song plays
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setPlaybackPosition((prev) => prev + 500); // Tick half a second forward
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Determine which lyric line is currently active
  const getActiveIndex = () => {
    if (!lyricsData) return -1;
    // Find the last lyric whose timestamp has passed
    return lyricsData.reduce((latestIdx, line, idx) => {
      if (playbackPosition >= line.timeMs) return idx;
      return latestIdx;
    }, -1);
  };

  const activeIndex = getActiveIndex();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.trackCard}>
        {currentTrack ? (
          <>
            <Image source={{ uri: currentTrack.album.images[0]?.url }} style={styles.albumArt} />
            <View style={styles.trackMeta}>
              <Text style={styles.trackTitle}>{currentTrack.name}</Text>
              <Text style={styles.artistName}>{currentTrack.artists[0]?.name}</Text>
            </View>
          </>
        ) : (
          <View style={styles.trackMeta}>
            <Text style={styles.trackTitle}>Ready to Sync</Text>
            <Text style={styles.artistName}>Play a track on Spotify</Text>
          </View>
        )}
        
        <TouchableOpacity style={styles.ghostButton} onPress={fetchCurrentlyPlaying}>
          <Text style={styles.ghostButtonText}>Check What's Playing</Text>
        </TouchableOpacity>
      </View>

      {fetchingLyrics ? (
        <View style={styles.centerVoid}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching & Translating...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.lyricScroll}>
          {lyricsData && lyricsData.map((line, index) => {
            const isActive = index === activeIndex;
            return (
              <View key={index} style={styles.lyricBlock}>
                <Text style={[styles.originalLine, isActive ? styles.textFull : styles.textDim]}>
                  {line.o}
                </Text>
                {line.tr && (
                  <Text style={[styles.translationLine, isActive ? styles.textDim : styles.textUltraDim]}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerRow: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16 },
  backButton: { paddingVertical: 8 },
  backButtonText: { color: COLORS.textInactive, fontSize: 16, fontWeight: '600' },
  trackCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  albumArt: { width: 48, height: 48, borderRadius: 8, marginRight: 12 },
  trackMeta: { flex: 1 },
  trackTitle: { color: COLORS.textActive, fontSize: 16, fontWeight: '700' },
  artistName: { color: COLORS.textInactive, fontSize: 14 },
  ghostButton: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 9999, paddingVertical: 8, paddingHorizontal: 12 },
  ghostButtonText: { color: COLORS.textActive, fontSize: 12 },
  centerVoid: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: COLORS.textInactive, marginTop: 16, fontSize: 14, fontStyle: 'italic' },
  lyricScroll: { padding: SPACING.margin, paddingBottom: 100 },
  lyricBlock: { marginBottom: SPACING.lyricGap },
  originalLine: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  translationLine: { fontSize: 18, fontWeight: '400' },
  textFull: { color: COLORS.textActive, opacity: 1 },
  textDim: { color: COLORS.textInactive, opacity: 0.8 },
  textUltraDim: { color: COLORS.textInactive, opacity: 0.4 }
});