// src/components/PaywallModal.js

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useTheme } from "../context/UserContext";
import { useSubscription } from "../context/SubscriptionContext";

const FEATURES = [
  { icon: "∞", label: "Unlimited AI refinements" },
  { icon: "⏱", label: "Unlimited recording length" },
  { icon: "📅", label: "Post scheduling" },
  { icon: "⚡", label: "Priority processing" },
];

export default function PaywallModal({ visible, onClose, reason }) {
  const { theme, isDarkMode } = useTheme();
  const { initializePayment, verifyPayment, fetchStatus } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [currency, setCurrency] = useState("GHS");
  const pendingReference = useRef(null);
  const styles = createStyles(theme, isDarkMode);

  // Listen for deep link callback from Paystack
  useEffect(() => {
    const handleUrl = async ({ url }) => {
      if (!url || !url.includes("subscription-callback")) return;

      const parsed = Linking.parse(url);
      const reference = parsed.queryParams?.reference;
      const error = parsed.queryParams?.error;

      if (error || !reference) {
        setIsLoading(false);
        Alert.alert("Payment incomplete", "Payment was not completed.");
        return;
      }

      // Verify the payment
      try {
        const result = await verifyPayment(reference);
        if (result.success) {
          await fetchStatus();
          onClose?.();
          Alert.alert(
            "🎉 Welcome to Pro!",
            "Your account has been upgraded successfully.",
          );
        } else {
          Alert.alert(
            "Payment incomplete",
            "If you completed payment, please try verifying again.",
          );
        }
      } catch (err) {
        Alert.alert("Error", err.message || "Verification failed.");
      } finally {
        setIsLoading(false);
        pendingReference.current = null;
      }
    };

    const subscription = Linking.addEventListener("url", handleUrl);
    return () => subscription.remove();
  }, [verifyPayment, fetchStatus, onClose]);

  const getTitle = () => {
    switch (reason) {
      case "ai_refinement":
        return "Refinement limit reached";
      case "recording":
        return "Recording limit reached";
      case "scheduling":
        return "Scheduling is Pro only";
      default:
        return "Upgrade to Pro";
    }
  };

  const getSubtitle = () => {
    switch (reason) {
      case "ai_refinement":
        return "You've used your 3 free AI refinements this month.";
      case "recording":
        return "Free plan allows 2 minute recordings.";
      case "scheduling":
        return "Schedule posts to publish at peak engagement times.";
      default:
        return "Unlock the full Linqoral experience.";
    }
  };

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const { authorizationUrl, reference } = await initializePayment(currency);
      pendingReference.current = reference;

      // Open Paystack checkout — deep link listener above handles the result
      await WebBrowser.openBrowserAsync(authorizationUrl, {
        showTitle: false,
        enableBarCollapsing: true,
      });

      // If browser closed without deep link firing (user cancelled manually)
      // give a small window then stop loading
      setTimeout(() => {
        if (pendingReference.current) {
          setIsLoading(false);
          pendingReference.current = null;
        }
      }, 2000);
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "Payment failed. Please try again.",
      );
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.iconWrap}>
            <Text style={styles.iconText}>⚡</Text>
          </View>
          <Text style={styles.title}>{getTitle()}</Text>
          <Text style={styles.subtitle}>{getSubtitle()}</Text>

          <View style={styles.featuresWrap}>
            {FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={styles.featureIconWrap}>
                  <Text style={styles.featureIcon}>{f.icon}</Text>
                </View>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <View style={styles.checkWrap}>
                  <View style={styles.checkLine1} />
                  <View style={styles.checkLine2} />
                </View>
              </View>
            ))}
          </View>

          <View style={styles.currencyRow}>
            {["GHS", "USD"].map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCurrency(c)}
                style={[
                  styles.currencyBtn,
                  currency === c && styles.currencyBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.currencyText,
                    currency === c && styles.currencyTextActive,
                  ]}
                >
                  {c === "GHS" ? "🇬🇭 GHS" : "🌍 USD"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.pricingWrap}>
            <Text style={styles.price}>
              {currency === "GHS" ? "GHS 49" : "$9.99"}
            </Text>
            <Text style={styles.pricePer}>/month</Text>
          </View>

          <Text style={styles.paymentMethods}>
            {currency === "GHS"
              ? "💳 Card · 📱 Mobile Money (MTN, Vodafone, AirtelTigo) · 🏦 Bank"
              : "💳 Card"}
          </Text>

          <TouchableOpacity
            onPress={handleUpgrade}
            style={styles.upgradeBtn}
            activeOpacity={0.88}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.upgradeBtnText}>
                Upgrade to Pro — {currency === "GHS" ? "GHS 49/mo" : "$9.99/mo"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            style={styles.dismissBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.dismissText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme, isDarkMode) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 28,
      paddingBottom: 40,
      alignItems: "center",
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.border,
      marginBottom: 24,
    },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: theme.primaryGlow,
      borderWidth: 1,
      borderColor: `${theme.primary}30`,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    iconText: { fontSize: 28 },
    title: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.text,
      textAlign: "center",
      letterSpacing: -0.5,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 13,
      color: theme.textMuted,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 20,
      paddingHorizontal: 16,
    },
    featuresWrap: { width: "100%", gap: 10, marginBottom: 20 },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 11,
      borderRadius: 12,
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.border,
    },
    featureIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: theme.primaryGlow,
      justifyContent: "center",
      alignItems: "center",
    },
    featureIcon: { fontSize: 13 },
    featureLabel: {
      flex: 1,
      fontSize: 13,
      fontWeight: "500",
      color: theme.text,
    },
    checkWrap: {
      width: 20,
      height: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    checkLine1: {
      position: "absolute",
      width: 6,
      height: 2.5,
      backgroundColor: theme.accent,
      borderRadius: 1.5,
      transform: [{ rotate: "45deg" }, { translateX: -3 }, { translateY: 1 }],
    },
    checkLine2: {
      position: "absolute",
      width: 10,
      height: 2.5,
      backgroundColor: theme.accent,
      borderRadius: 1.5,
      transform: [{ rotate: "-50deg" }, { translateX: 2 }],
    },
    currencyRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
    currencyBtn: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: theme.border,
      alignItems: "center",
    },
    currencyBtnActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryGlow,
    },
    currencyText: { fontSize: 13, fontWeight: "600", color: theme.textMuted },
    currencyTextActive: { color: theme.primary },
    pricingWrap: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 4,
      marginBottom: 6,
    },
    price: {
      fontSize: 30,
      fontWeight: "800",
      color: theme.text,
      letterSpacing: -1,
    },
    pricePer: { fontSize: 14, color: theme.textMuted, marginBottom: 4 },
    paymentMethods: {
      fontSize: 11,
      color: theme.textMuted,
      textAlign: "center",
      marginBottom: 20,
      lineHeight: 18,
    },
    upgradeBtn: {
      width: "100%",
      padding: 16,
      borderRadius: 16,
      backgroundColor: theme.primary,
      alignItems: "center",
      marginBottom: 12,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDarkMode ? 0.4 : 0.2,
      shadowRadius: 16,
      elevation: 8,
      minHeight: 52,
      justifyContent: "center",
    },
    upgradeBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
    dismissBtn: { padding: 12 },
    dismissText: { fontSize: 13, color: theme.textMuted },
  });
