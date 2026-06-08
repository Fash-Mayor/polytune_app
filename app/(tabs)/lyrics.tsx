import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router'; // Removed useLocalSearchParams since we use the vault now
import { COLORS, SPACING } from '../../constants/theme';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_FUNCTION_URL = process.env.EXPO_PUBLIC_SUPABASE_FUNCTION_URL || '';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

  // Secure Auth State
  const [token, setToken] = useState<string | null>(null);

  // Core Data States
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [lyricsData, setLyricsData] = useState<{o: string, tr: string, timeMs: number}[] | null>(null);
  const [fetchingLyrics, setFetchingLyrics] = useState<boolean>(false);
  
  // Sync Engine States
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Auto-Scroll Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const lyricPositions = useRef<{ [key: number]: number }>({});

  // 1. Pull the token from the encrypted vault when the screen loads
  useEffect(() => {
    const loadToken = async () => {
      let savedToken = null;
    if (Platform.OS === 'web') {
      savedToken = localStorage.getItem('spotify_token');
    } else {
      savedToken = await SecureStore.getItemAsync('spotify_token');
    }
    
    if (savedToken) setToken(savedToken);
    else alert("Security Error: No access token found.");
  };
    //   const savedToken = await SecureStore.getItemAsync('spotify_token');
    //   if (savedToken) setToken(savedToken);
    //   else alert("Security Error: No access token found. Please reconnect Spotify.");
    // };
    loadToken();
  }, []);

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
        const processedLyrics = data.lyrics.map((line: any) => ({
          ...line,
          timeMs: parseTimecode(line.t)
        }));
        setLyricsData(processedLyrics);
      } else {
        alert("Could not fetch or translate lyrics for this track.");
      }
    } catch (error) {
      console.error("Network Error:", error);
    } finally {
      setFetchingLyrics(false);
    }
  };

  const fetchCurrentlyPlaying = async () => {
    if (!token) {
      alert("Authentication failed: Loading token from vault. Please try again in a second.");
      return;
    }
    
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.status === 200) {
        const data = await res.json();
        setCurrentTrack(data.item);
        
        setPlaybackPosition(data.progress_ms);
        setIsPlaying(data.is_playing);

        if (!lyricsData || currentTrack?.id !== data.item.id) {
            fetchLyricsFromBackend(data.item.name, data.item.artists[0].name, data.item.id);
        }
      } else if (res.status === 204) {
        alert("Spotify is connected, but nothing is currently playing. Start a song and try again!");
      } else {
        alert(`Spotify API returned an unexpected status: ${res.status}`);
      }
    } catch (error) {
      console.error("Spotify API Error:", error);
      alert("Failed to reach Spotify. Check your network connection.");
    }
  };

  // 2. Local Sync Engine Tick
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

  // 3. The Auto-Scroll Trigger
  useEffect(() => {
    if (activeIndex !== -1 && lyricPositions.current[activeIndex] !== undefined) {
      const targetY = lyricPositions.current[activeIndex];
      const centerOffset = (SCREEN_HEIGHT / 2) - 250; 
      
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, targetY - centerOffset),
        animated: true,
      });
    }
  }, [activeIndex]);

  const handleDisconnect = async () => {
    // Clear the vault
    if (Platform.OS === 'web') {
      localStorage.removeItem('spotify_token');
    } else {
      await SecureStore.deleteItemAsync('spotify_token');
    }
    
    // Clear the local state
    setToken(null);
    setCurrentTrack(null);
    setLyricsData(null);
    
    // Route back to the connect screen
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleDisconnect} style={styles.backButton}>
          <Text style={styles.backButtonText}>Disconnect</Text>
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
          <Text style={styles.ghostButtonText}>Sync Playback</Text>
        </TouchableOpacity>
      </View>

      {fetchingLyrics ? (
        <View style={styles.centerVoid}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching & Translating...</Text>
        </View>
      ) : (
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.lyricScroll}
          showsVerticalScrollIndicator={false}
        >
          {lyricsData && lyricsData.map((line, index) => {
            const isActive = index === activeIndex;
            return (
              <View 
                key={index} 
                style={styles.lyricBlock}
                onLayout={(event) => {
                  lyricPositions.current[index] = event.nativeEvent.layout.y;
                }}
              >
                <Text style={[styles.originalLine, isActive ? styles.textFull : styles.textDim]}>
                  {line.tr}
                </Text>
                {line.tr && (
                  <Text style={[styles.translationLine, isActive ? styles.textDim : styles.textUltraDim]}>
                    {line.o}
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
  headerRow: { paddingTop: 30, paddingHorizontal: 16, paddingBottom: 12 },
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
  lyricScroll: { padding: SPACING.margin, paddingBottom: SCREEN_HEIGHT / 2 }, 
  lyricBlock: { marginBottom: SPACING.lyricGap },
  originalLine: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  translationLine: { fontSize: 18, fontWeight: '400' },
  textFull: { color: COLORS.textActive, opacity: 1 },
  textDim: { color: COLORS.textInactive, opacity: 0.8 },
  textUltraDim: { color: COLORS.textInactive, opacity: 0.4 }
});