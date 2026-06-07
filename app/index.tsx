import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  useAuthRequest,
  makeRedirectUri,
  exchangeCodeAsync,
  TokenResponse,
} from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { COLORS, SPACING } from "../constants/theme";
import * as SecureStore from "expo-secure-store";

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
};

const CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || "";
const redirectUri = "lyricsmine:///";

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: ["user-read-currently-playing", "user-read-playback-state"],
      usePKCE: true,
      redirectUri: redirectUri,
    },
    discovery,
  );

  // Handle auth response from promptAsync
  useEffect(() => {
    if (response?.type === "success" && request?.codeVerifier) {
      exchangeToken(response.params.code, request.codeVerifier);
    }
  }, [response, request]);

  // Handle deep link when app is opened from Spotify redirect
  useEffect(() => {
    const subscription = Linking.addEventListener("url", handleDeepLink);
    return () => subscription.remove();
  }, [request]);

  const handleDeepLink = async (event: { url: string }) => {
    const url = event.url;
    const parsed = Linking.parse(url);
    const queryParams = parsed.queryParams;

    if (!queryParams) {
      return;
    }

    const { code, error } = queryParams as Record<string, string>;

    if (error) {
      alert(`Auth Error: ${error}`);
      return;
    }

    if (code && request?.codeVerifier) {
      exchangeToken(code, request.codeVerifier);
    }
  };

  const exchangeToken = async (code: string, codeVerifier: string) => {
    setLoading(true);
    try {
      const token = await exchangeCodeAsync(
        {
          clientId: CLIENT_ID,
          code: code,
          redirectUri: redirectUri,
          extraParams: { code_verifier: codeVerifier },
        },
        discovery,
      );

      await SecureStore.setItemAsync("spotify_token", token.accessToken);
      setLoading(false);
      router.replace("/lyrics");
    } catch (error) {
      console.error("Token exchange failed:", error);
      alert("Failed to securely exchange token with Spotify.");
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.centerVoid}>
        <Text style={styles.iconPlaceholder}>🎵</Text>
        <Text style={styles.brandTitle}>LyricsMine</Text>
        <Text style={styles.subtitle}>
          Instantly translate your Spotify playback.
        </Text>
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
        <Text style={styles.securityText}>
          SECURE CONNECTION VIA SPOTIFY API
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.margin,
    justifyContent: "space-between",
  },
  centerVoid: { flex: 1, justifyContent: "center", alignItems: "center" },
  iconPlaceholder: { fontSize: 64, marginBottom: 16 },
  brandTitle: {
    fontSize: 48,
    fontWeight: "700",
    color: COLORS.textActive,
    marginBottom: 8,
  },
  subtitle: { fontSize: 16, color: COLORS.textInactive },
  footer: { paddingBottom: 40, alignItems: "center" },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 9999,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: { color: "#000000", fontSize: 18, fontWeight: "700" },
  securityText: {
    fontSize: 10,
    color: COLORS.textInactive,
    letterSpacing: 1.5,
    fontWeight: "600",
  },
});
