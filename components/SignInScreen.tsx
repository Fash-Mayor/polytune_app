import { Alert, Image, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GoogleSigninButton } from "@react-native-google-signin/google-signin";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";

const LOGO = require("../assets/PolyTuneLogo.png");

// The whole app's gate: rendered instead of the Stack navigator whenever
// there's no signed-in Supabase session (see app/_layout.tsx), so nothing
// under app/index.tsx or app/(tabs) is reachable without signing in first -
// and signing out from Settings drops straight back here too, since that
// swap is driven by the same `user` state, not a one-time route check.
export function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { width, height, logoSize, isCompact } = useResponsiveLayout();
  const { accentColor } = useTheme();
  const { isSigningIn, signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (e: any) {
      Alert.alert(
        "Sign-in failed",
        e?.message ?? "Something went wrong. Please try again.",
      );
    }
  };

  const glowSize = width * 1.15;

  return (
    <View
      className="flex-1 bg-mine-bg"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 12 }}
    >
      <View
        pointerEvents="none"
        className="absolute inset-0 items-center"
        style={{ top: height * 0.12 }}
      >
        <View
          style={{
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            backgroundColor: `${accentColor}22`,
          }}
        />
      </View>

      <View className="items-center justify-center flex-1 px-8">
        <Image
          source={LOGO}
          style={{
            width: logoSize,
            height: logoSize,
            marginBottom: isCompact ? 16 : 24,
          }}
          resizeMode="contain"
        />

        <Text
          className="text-center font-outfit-bold text-mine-white"
          style={{ fontSize: isCompact ? 36 : 42, letterSpacing: 0.5 }}
        >
          PolyTune
        </Text>

        <Text
          className="max-w-xs mt-3 italic text-center font-outfit-medium text-mine-white/90"
          style={{
            fontSize: isCompact ? 16 : 18,
            lineHeight: isCompact ? 24 : 28,
          }}
        >
          Instantly Translate Your Music
        </Text>
      </View>

      <View className="flex-shrink-0 px-6">
        <GoogleSigninButton
          size={GoogleSigninButton.Size.Wide}
          color={GoogleSigninButton.Color.Dark}
          disabled={isSigningIn}
          onPress={() => void handleGoogleSignIn()}
          style={{ width: "100%", height: 48 }}
        />

        <Text className="mt-4 text-center text-[10px] font-outfit-semibold uppercase tracking-[1.5px] text-mine-dim">
          Sign in to start translating lyrics
        </Text>
      </View>
    </View>
  );
}
