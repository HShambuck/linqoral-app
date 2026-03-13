// app/(tabs)/index.js
import { useEffect, useState } from "react";
import {
  Animated,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { useDrafts } from "../../src/context/DraftContext";
import { useTheme } from "../../src/context/UserContext";
import { TIPS, getGreeting } from "../../src/utils/constants";
import { formatRelativeTime } from "../../src/utils/validators";

export default function HomeScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { stats, recentDraft, fetchDrafts } = useDrafts();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const styles = createStyles(theme, isDarkMode, insets);

  const profilePicture = user?.linkedIn?.picture || null;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % TIPS.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDrafts();
    setRefreshing(false);
  };

  const tip = TIPS[currentTip];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Animated.ScrollView
        style={[styles.container, { opacity: fadeAnim }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.headline}>{`What's on \nyour mind?`}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push("/(tabs)/settings")}
            activeOpacity={0.8}
          >
            {profilePicture ? (
              <Image
                source={{ uri: profilePicture }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>{user?.initials || "U"}</Text>
            )}
            <View style={styles.avatarRing} />
          </TouchableOpacity>
        </View>

        {/* Primary CTA */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/record")}
          style={styles.primaryCta}
          activeOpacity={0.92}
        >
          <View style={styles.primaryCtaInner}>
            <View style={styles.primaryCtaIconWrap}>
              <View style={styles.micIconOuter}>
                <View style={styles.micIconInner} />
                <View style={styles.micIconBase} />
              </View>
            </View>
            <View style={styles.primaryCtaText}>
              <Text style={styles.primaryCtaTitle}>New Voice Post</Text>
              <Text style={styles.primaryCtaSub}>
                Speak naturally · AI refines
              </Text>
            </View>
            <View style={styles.ctaArrow}>
              <Text style={styles.ctaArrowText}>›</Text>
            </View>
          </View>
          <View style={styles.primaryCtaShine} />
        </TouchableOpacity>

        {/* Continue Draft */}
        {recentDraft && (
          <TouchableOpacity
            onPress={() => router.push(`/editor/${recentDraft.id}`)}
            style={styles.continueDraft}
            activeOpacity={0.75}
          >
            <View style={styles.continueDraftDot} />
            <View style={styles.continueDraftContent}>
              <Text style={styles.continueDraftLabel}>Continue editing</Text>
              <Text style={styles.continueDraftTitle} numberOfLines={1}>
                {recentDraft.title || "Untitled Draft"}
              </Text>
              <Text style={styles.continueDraftTime}>
                {formatRelativeTime(new Date(recentDraft.updatedAt))}
              </Text>
            </View>
            <Text style={styles.continueDraftArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            {
              value: stats.totalDrafts,
              label: "Drafts",
              onPress: () => router.push("/(tabs)/drafts"),
            },
            {
              value: stats.scheduledPosts,
              label: "Scheduled",
              onPress: () => router.push("/(tabs)/drafts"),
            },
            { value: stats.publishedPosts, label: "Published", onPress: null },
          ].map((stat, i) => (
            <TouchableOpacity
              key={i}
              style={styles.statCard}
              onPress={stat.onPress}
              activeOpacity={stat.onPress ? 0.7 : 1}
              disabled={!stat.onPress}
            >
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              {i < 2 && <View style={styles.statDivider} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Insight Card */}
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <View style={styles.insightDot} />
            <Text style={styles.insightLabel}>Insight</Text>
          </View>
          <Text style={styles.insightText}>{tip.text}</Text>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme, isDarkMode, insets) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.bg },
    container: { flex: 1 },
    content: { padding: 22, paddingBottom: 32 + insets.bottom },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 28,
      marginTop: 4,
    },
    headerLeft: { flex: 1 },
    greeting: {
      fontSize: 11,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: theme.textMuted,
      marginBottom: 6,
      fontWeight: "500",
    },
    headline: {
      fontSize: 28,
      fontWeight: "700",
      color: theme.text,
      lineHeight: 34,
      letterSpacing: -0.5,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.primary,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 4,
      overflow: "hidden",
    },
    avatarImage: { width: 42, height: 42, borderRadius: 21 },
    avatarText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 15,
      letterSpacing: 0.5,
    },
    avatarRing: {
      position: "absolute",
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: `${theme.primary}40`,
    },

    primaryCta: {
      borderRadius: 20,
      backgroundColor: theme.primary,
      marginBottom: 14,
      overflow: "hidden",
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDarkMode ? 0.4 : 0.25,
      shadowRadius: 20,
      elevation: 10,
    },
    primaryCtaInner: {
      flexDirection: "row",
      alignItems: "center",
      padding: 20,
      paddingRight: 18,
    },
    primaryCtaIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: "rgba(255,255,255,0.18)",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    micIconOuter: {
      width: 18,
      height: 22,
      borderRadius: 9,
      borderWidth: 2.5,
      borderColor: "#fff",
      justifyContent: "center",
      alignItems: "center",
    },
    micIconInner: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: "#fff",
    },
    micIconBase: {
      position: "absolute",
      bottom: -7,
      width: 14,
      height: 6,
      borderBottomLeftRadius: 7,
      borderBottomRightRadius: 7,
      borderWidth: 2.5,
      borderTopWidth: 0,
      borderColor: "#fff",
    },
    primaryCtaText: { flex: 1 },
    primaryCtaTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: "#fff",
      marginBottom: 3,
      letterSpacing: -0.2,
    },
    primaryCtaSub: {
      fontSize: 12,
      color: "rgba(255,255,255,0.65)",
      letterSpacing: 0.2,
    },
    ctaArrow: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "rgba(255,255,255,0.2)",
      justifyContent: "center",
      alignItems: "center",
    },
    ctaArrowText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "600",
      marginTop: -1,
    },
    primaryCtaShine: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: "rgba(255,255,255,0.25)",
    },

    continueDraft: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 22,
    },
    continueDraftDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.accent,
      marginRight: 14,
      shadowColor: theme.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 4,
    },
    continueDraftContent: { flex: 1 },
    continueDraftLabel: {
      fontSize: 10,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      color: theme.accent,
      marginBottom: 3,
      fontWeight: "600",
    },
    continueDraftTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 2,
    },
    continueDraftTime: { fontSize: 11, color: theme.textMuted },
    continueDraftArrow: { fontSize: 22, color: theme.textMuted, marginLeft: 8 },

    statsRow: {
      flexDirection: "row",
      backgroundColor: theme.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 22,
      overflow: "hidden",
    },
    statCard: {
      flex: 1,
      paddingVertical: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    statDivider: {
      position: "absolute",
      right: 0,
      top: "20%",
      bottom: "20%",
      width: 1,
      backgroundColor: theme.border,
    },
    statValue: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.text,
      letterSpacing: -0.5,
    },
    statLabel: {
      fontSize: 10,
      color: theme.textMuted,
      marginTop: 3,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },

    insightCard: {
      padding: 18,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderLeftWidth: 3,
      borderLeftColor: theme.accent,
    },
    insightHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    insightDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.accent,
      marginRight: 8,
    },
    insightLabel: {
      fontSize: 10,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      color: theme.accent,
      fontWeight: "700",
    },
    insightText: { fontSize: 13, color: theme.textSecondary, lineHeight: 20 },
  });
