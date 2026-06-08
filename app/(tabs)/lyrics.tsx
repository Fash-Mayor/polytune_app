import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING } from '../../constants/theme';
import * as SecureStore from 'expo-secure-store';
import EventSource from 'react-native-sse'; // The Native Android/iOS streaming fix

const SUPABASE_FUNCTION_URL = process.env.EXPO_PUBLIC_SUPABASE_FUNCTION_URL || '';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LyricsScreen() {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [lyricsData, setLyricsData] = useState<{o: string, r: string, tr: string, timeMs: number}[] | null>(null);
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
      if (Platform.OS === 'web') {
        savedToken = localStorage.getItem('spotify_token');
      } else {
        savedToken = await SecureStore.getItemAsync('spotify_token');
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackTitle: title, artistName: artist, spotifyId: id })
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
            if (currentList.some((line) => line.timeMs === data.item.timeMs && line.o === data.item.o)) {
              return currentList;
            }
            return [...currentList, data.item].sort((a, b) => a.timeMs - b.timeMs);
          });
        }

        if (data.done) {
          es.close();
          setFetchingLyrics(false);
        }
      } catch (e) {
        console.error("Error parsing SSE data:", e);
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
      const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.status === 200) {
        const data = await res.json();
        setCurrentTrack(data.item);
        setPlaybackPosition(data.progress_ms);
        setIsPlaying(data.is_playing);

        if (!lyricsData || currentTrack?.id !== data.item.id) {
            fetchLyricsStream(data.item.name, data.item.artists[0].name, data.item.id);
        }
      } else if (res.status === 204) {
        alert("Spotify connected, but nothing playing!");
      }
    } catch (error) {
      console.error("Spotify API Error:", error);
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
    if (Platform.OS === 'web') localStorage.removeItem('spotify_token');
    else await SecureStore.deleteItemAsync('spotify_token');
    
    setToken(null);
    setCurrentTrack(null);
    setLyricsData(null);
    if (activeEventSource.current) activeEventSource.current.close();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleDisconnect} style={styles.backButton}>
          <Text style={styles.backButtonText}>Disconnect</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => setIsRomanized(!isRomanized)} 
          style={[styles.ghostButton, isRomanized && { borderColor: COLORS.primary }]}
        >
          <Text style={[styles.ghostButtonText, isRomanized && { color: COLORS.primary, fontWeight: '700' }]}>
            {isRomanized ? 'A/文 Romanised' : 'A/文 Original'}
          </Text>
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

      {fetchingLyrics && (!lyricsData || lyricsData.length === 0) ? (
        <View style={styles.centerVoid}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Connecting to Audio Stream...</Text>
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
                  {isRomanized && line.r ? line.r : line.o}
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
  headerRow: { paddingTop: 30, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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