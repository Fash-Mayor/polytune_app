import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
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
import * as SecureStore from "expo-secure-store";
// import { vexo } from 'vexo-analytics';

// vexo('625efcf7-a3d3-4109-a674-0b3f6fc39c57')

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
};

const CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || "";
const redirectUri =
  Platform.OS === "web" ? "http://127.0.0.1:8081" : "lyricsmine:///";

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

      // 2. Dynamic Storage Vault
      if (Platform.OS === "web") {
        localStorage.setItem("spotify_token", token.accessToken);
      } else {
        await SecureStore.setItemAsync("spotify_token", token.accessToken);
      }
      //   await SecureStore.setItemAsync("spotify_token", token.accessToken);
      setLoading(false);
      router.replace("/(tabs)/lyrics");
    } catch (error) {
      console.error("Token exchange failed:", error);
      alert("Failed to securely exchange token with Spotify.");
      setLoading(false);
    }
  };

  return (
    <View className="justify-between flex-1 bg-black px-7 py-7">
      <View className="items-center justify-center flex-1">
        <Image source={require("../assets/NuMain.png")} className="w-32 h-32" />
        <Text className="mb-2 text-[48px] font-bold text-[#1DB954]">
          LyricsMine
        </Text>
        <Text className="text-base text-[#A7A7A7]">
          Instantly translate your Spotify playback.
        </Text>
      </View>

      <View className="items-center pb-10">
        <TouchableOpacity
          className="mb-4 w-full items-center rounded-full bg-[#1DB954] px-8 py-4"
          disabled={!request || loading}
          onPress={() => promptAsync()}
        >
          {loading ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text className="text-lg font-bold text-black">
              🎧 Connect Spotify
            </Text>
          )}
        </TouchableOpacity>
        <Text className="text-[10px] font-semibold tracking-[1.5px] text-[#A7A7A7]">
          SECURE CONNECTION VIA SPOTIFY API
        </Text>
      </View>
    </View>
  );
}
