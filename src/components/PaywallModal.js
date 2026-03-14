// src/components/PaywallModal.js

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Animated,
} from 'react-native';
import { useTheme } from '../context/UserContext';
import { useSubscription } from '../context/SubscriptionContext';

const FEATURES = [
  { icon: '∞', label: 'Unlimited AI refinements' },
  { icon: '⏱', label: 'Unlimited recording length' },
  { icon: '📅', label: 'Post scheduling' },
  { icon: '⚡', label: 'Priority processing' },
];

export default function PaywallModal({ visible, onClose, reason }) {
  const { theme, isDarkMode } = useTheme();
  const { upgrade } = useSubscription();
  const styles = createStyles(theme, isDarkMode);

  const handleUpgrade = async () => {
    // TODO: integrate with RevenueCat or Stripe
    // For now show coming soon
    onClose?.();
  };

  const getTitle = () => {
    switch (reason) {
      case 'ai_refinement': return 'Refinement limit reached';
      case 'recording': return 'Recording limit reached';
      case 'scheduling': return 'Scheduling is Pro only';
      default: return 'Upgrade to Pro';
    }
  };

  const getSubtitle = () => {
    switch (reason) {
      case 'ai_refinement': return "You've used your 3 free AI refinements this month.";
      case 'recording': return "Free plan allows 2 minute recordings.";
      case 'scheduling': return "Schedule posts to publish at peak engagement times.";
      default: return 'Unlock the full Linqoral experience.';
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

          {/* Header */}
          <View style={styles.iconWrap}>
            <Text style={styles.iconText}>⚡</Text>
          </View>
          <Text style={styles.title}>{getTitle()}</Text>
          <Text style={styles.subtitle}>{getSubtitle()}</Text>

          {/* Features */}
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

          {/* Pricing */}
          <View style={styles.pricingWrap}>
            <Text style={styles.price}>$9.99</Text>
            <Text style={styles.pricePer}>/month</Text>
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={handleUpgrade}
            style={styles.upgradeBtn}
            activeOpacity={0.88}
          >
            <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.dismissBtn} activeOpacity={0.7}>
            <Text style={styles.dismissText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme, isDarkMode) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 40,
    alignItems: 'center',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: theme.border,
    marginBottom: 24,
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: theme.primaryGlow,
    borderWidth: 1, borderColor: `${theme.primary}30`,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  iconText: { fontSize: 28 },
  title: {
    fontSize: 20, fontWeight: '800',
    color: theme.text, textAlign: 'center',
    letterSpacing: -0.5, marginBottom: 8,
  },
  subtitle: {
    fontSize: 13, color: theme.textMuted,
    textAlign: 'center', lineHeight: 20,
    marginBottom: 24, paddingHorizontal: 16,
  },
  featuresWrap: {
    width: '100%', gap: 12, marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 12,
    backgroundColor: theme.surfaceElevated,
    borderWidth: 1, borderColor: theme.border,
  },
  featureIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: theme.primaryGlow,
    justifyContent: 'center', alignItems: 'center',
  },
  featureIcon: { fontSize: 14 },
  featureLabel: {
    flex: 1, fontSize: 13,
    fontWeight: '500', color: theme.text,
  },
  checkWrap: {
    width: 20, height: 20, justifyContent: 'center', alignItems: 'center',
  },
  checkLine1: {
    position: 'absolute', width: 6, height: 2.5,
    backgroundColor: theme.accent, borderRadius: 1.5,
    transform: [{ rotate: '45deg' }, { translateX: -3 }, { translateY: 1 }],
  },
  checkLine2: {
    position: 'absolute', width: 10, height: 2.5,
    backgroundColor: theme.accent, borderRadius: 1.5,
    transform: [{ rotate: '-50deg' }, { translateX: 2 }],
  },
  pricingWrap: {
    flexDirection: 'row', alignItems: 'flex-end',
    gap: 4, marginBottom: 20,
  },
  price: {
    fontSize: 32, fontWeight: '800',
    color: theme.text, letterSpacing: -1,
  },
  pricePer: { fontSize: 14, color: theme.textMuted, marginBottom: 6 },
  upgradeBtn: {
    width: '100%', padding: 16,
    borderRadius: 16, backgroundColor: theme.primary,
    alignItems: 'center', marginBottom: 12,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDarkMode ? 0.4 : 0.2,
    shadowRadius: 16, elevation: 8,
  },
  upgradeBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  dismissBtn: { padding: 12 },
  dismissText: { fontSize: 13, color: theme.textMuted },
});