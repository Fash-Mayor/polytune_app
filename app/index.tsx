import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthRequest, makeRedirectUri, exchangeCodeAsync, TokenResponse } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { COLORS, SPACING } from '../constants/theme';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

const CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: ['user-read-currently-playing', 'user-read-playback-state'],
      usePKCE: true,
      redirectUri: makeRedirectUri({ scheme: 'lyricsmine' }),
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success' && request?.codeVerifier) {
      setLoading(true);
      exchangeCodeAsync(
        {
          clientId: CLIENT_ID,
          code: response.params.code,
          redirectUri: makeRedirectUri({ scheme: 'lyricsmine' }),
          extraParams: { code_verifier: request.codeVerifier },
        },
        discovery
      )
      .then((token: TokenResponse) => {
        setLoading(false);
        // Push to the lyrics screen and pass the secure token
        router.push({ pathname: '/lyrics', params: { token: token.accessToken } });
      })
      .catch((error) => {
        console.error('Token exchange failed:', error);
        setLoading(false);
      });
    }
  }, [response]);

  return (
    <View style={styles.container}>
      <View style={styles.centerVoid}>
        <Text style={styles.iconPlaceholder}>🎵</Text> 
        <Text style={styles.brandTitle}>LyricsMine</Text>
        <Text style={styles.subtitle}>Instantly translate your Spotify playback.</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryButton} 
          disabled={!request || loading} 
          onPress={() => promptAsync()}
        >
          {loading ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text style={styles.buttonText}>🎧 Connect Spotify</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.securityText}>SECURE CONNECTION VIA SPOTIFY API</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.margin, justifyContent: 'space-between' },
  centerVoid: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconPlaceholder: { fontSize: 64, marginBottom: 16 },
  brandTitle: { fontSize: 48, fontWeight: '700', color: COLORS.textActive, marginBottom: 8 },
  subtitle: { fontSize: 16, color: COLORS.textInactive },
  footer: { paddingBottom: 40, alignItems: 'center' },
  primaryButton: { backgroundColor: COLORS.primary, borderRadius: 9999, paddingVertical: 16, paddingHorizontal: 32, width: '100%', alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#000000', fontSize: 18, fontWeight: '700' },
  securityText: { fontSize: 10, color: COLORS.textInactive, letterSpacing: 1.5, fontWeight: '600' }
});