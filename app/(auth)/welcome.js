// app/(auth)/welcome.js
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useTheme } from "../../src/context/UserContext";

const FEATURES = [
  { title: "Voice-First", desc: "Speak naturally, AI handles the rest" },
  { title: "AI-Refined", desc: "Professional polish, your authentic voice" },
  { title: "Schedule & Post", desc: "Publish when engagement peaks" },
];

const AUTH_URL_PUBLIC =
  "https://linqoral-backend-production.up.railway.app/api/publish/linkedin/auth-url-public";

export default function WelcomeScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [isRestoring, setIsRestoring] = useState(false);
  const styles = createStyles(theme, isDarkMode, insets);

  const handleRestoreAccount = async () => {
    setIsRestoring(true);
    try {
      // Call public endpoint directly — no auth token needed
      const res = await fetch(AUTH_URL_PUBLIC);
      const data = await res.json();
      if (!data.authUrl) throw new Error("Could not get LinkedIn auth URL");
      await WebBrowser.openBrowserAsync(data.authUrl, {
        showTitle: false,
        enableBarCollapsing: true,
        showInRecents: false,
      });
    } catch (err) {
      console.warn("Restore account failed:", err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.brandSection}>
          <View style={styles.logoWrap}>
            <View style={styles.logoInner}>
              <View style={styles.logoMicBody} />
              <View style={styles.logoMicNeck} />
              <View style={styles.logoMicBase} />
            </View>
          </View>
          <Text style={styles.appName}>Linqoral</Text>
          <Text style={styles.tagline}>
            Your voice, professionally presented
          </Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIndex}>
                <Text style={styles.featureIndexText}>{i + 1}</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.ctaSection}>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/onboarding")}
            style={styles.primaryBtn}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryBtnText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRestoreAccount}
            style={styles.restoreBtn}
            activeOpacity={0.8}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color="#0A66C2" />
            ) : (
              <>
                <View style={styles.restoreLinkedInBadge}>
                  <Text style={styles.restoreLinkedInText}>in</Text>
                </View>
                <Text style={styles.restoreBtnText}>
                  Restore Previous Account
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme, isDarkMode, insets) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.bg },
    container: {
      flex: 1,
      paddingHorizontal: 28,
      paddingTop: 24,
      paddingBottom: 24,
      justifyContent: "space-between",
    },
    brandSection: { alignItems: "center", paddingTop: 24 },
    logoWrap: {
      width: 80,
      height: 80,
      borderRadius: 26,
      backgroundColor: theme.primary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: isDarkMode ? 0.5 : 0.3,
      shadowRadius: 24,
      elevation: 12,
    },
    logoInner: { alignItems: "center" },
    logoMicBody: {
      width: 18,
      height: 26,
      borderRadius: 9,
      borderWidth: 3,
      borderColor: "#fff",
    },
    logoMicNeck: {
      marginTop: 5,
      width: 24,
      height: 12,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      borderWidth: 3,
      borderBottomWidth: 0,
      borderColor: "#fff",
    },
    logoMicBase: {
      marginTop: 2,
      width: 3,
      height: 7,
      backgroundColor: "#fff",
      borderRadius: 1.5,
    },
    appName: {
      fontSize: 34,
      fontWeight: "800",
      color: theme.text,
      letterSpacing: -1,
      marginBottom: 8,
    },
    tagline: {
      fontSize: 15,
      color: theme.textMuted,
      textAlign: "center",
      lineHeight: 22,
    },
    features: { gap: 16, paddingVertical: 8 },
    featureRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 14,
    },
    featureIndex: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: theme.primaryGlow,
      borderWidth: 1,
      borderColor: `${theme.primary}30`,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 1,
    },
    featureIndexText: { fontSize: 12, fontWeight: "700", color: theme.primary },
    featureText: { flex: 1 },
    featureTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 3,
      letterSpacing: -0.2,
    },
    featureDesc: { fontSize: 13, color: theme.textMuted, lineHeight: 18 },
    ctaSection: { gap: 10 },
    primaryBtn: {
      padding: 18,
      borderRadius: 16,
      backgroundColor: theme.primary,
      alignItems: "center",
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDarkMode ? 0.4 : 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    primaryBtnText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#fff",
      letterSpacing: -0.2,
    },
    restoreBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      padding: 16,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1.5,
      borderColor: "#0A66C2",
      minHeight: 54,
    },
    restoreLinkedInBadge: {
      width: 22,
      height: 22,
      borderRadius: 5,
      backgroundColor: "#0A66C2",
      justifyContent: "center",
      alignItems: "center",
    },
    restoreLinkedInText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "800",
      fontStyle: "italic",
    },
    restoreBtnText: { fontSize: 14, fontWeight: "600", color: "#0A66C2" },
  });
