// app/publish/options.js

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Linking, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../src/context/UserContext';
import { useAuth } from '../../src/context/AuthContext';
import { useDrafts } from '../../src/context/DraftContext';
import publishService from '../../src/services/publishService';
import { getDisplayText } from '../../src/models/Draft';

export default function PublishOptionsScreen() {
  const router = useRouter();
  const { draftId } = useLocalSearchParams();
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { currentDraft, drafts } = useDrafts();
  const insets = useSafeAreaInsets();

  const draft = currentDraft || drafts.find((d) => d.id === draftId);

  const [selectedMode, setSelectedMode] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState(null);

  const styles = createStyles(theme, isDarkMode, insets);

  // LinkedIn profile picture or initials fallback
  const profilePicture = user?.linkedIn?.picture || null;
  const displayName = user?.displayName || 'User';
  const initials = user?.initials || displayName.charAt(0).toUpperCase();
  const linkedInName = user?.linkedIn?.connected
    ? `${user.linkedIn.firstName || ''} ${user.linkedIn.lastName || ''}`.trim()
    : displayName;

  const handleBack = () => router.back();

  const handlePostNow = async () => {
    if (!draft) return;
    Alert.alert(
      'Publish Now?',
      'Your post will be published immediately to LinkedIn.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          onPress: async () => {
            setIsPublishing(true);
            try {
              const result = await publishService.publishNow(draft.id);
              setPublishedUrl(result.linkedInPostUrl);
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to publish.');
            } finally {
              setIsPublishing(false);
            }
          },
        },
      ]
    );
  };

  const handleSchedule = () => {
    if (!draft) return;
    router.push(`/publish/schedule?draftId=${draft.id}`);
  };

  const handleCopyText = async () => {
    if (!draft) return;
    const text = getDisplayText(draft);
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert(
        'Copied!',
        'Your post has been copied to clipboard. Open LinkedIn to paste it.',
        [
          { text: 'OK' },
          {
            text: 'Open LinkedIn',
            onPress: () => Linking.openURL('https://www.linkedin.com/feed/'),
          },
        ]
      );
    } catch {
      Alert.alert('Error', 'Failed to copy text.');
    }
  };

  const handleConfirm = () => {
    if (selectedMode === 'now') handlePostNow();
    else if (selectedMode === 'schedule') handleSchedule();
  };

  // ─── Success Screen ───────────────────────────────────────────────────────
  if (publishedUrl) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.successContainer}>
          {/* Animated checkmark ring */}
          <View style={styles.successRingOuter}>
            <View style={styles.successRingInner}>
              <View style={styles.successCheck}>
                <View style={styles.checkLine1} />
                <View style={styles.checkLine2} />
              </View>
            </View>
          </View>

          <Text style={styles.successTitle}>Post is Live! 🎉</Text>
          <Text style={styles.successSub}>
            Your post has been published to LinkedIn successfully.
          </Text>

          <TouchableOpacity
            style={styles.viewPostBtn}
            onPress={() => Linking.openURL(publishedUrl)}
            activeOpacity={0.85}
          >
            <Text style={styles.viewPostBtnText}>View on LinkedIn</Text>
            <Text style={styles.viewPostArrow}>↗</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.7}
          >
            <Text style={styles.doneBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Empty State ──────────────────────────────────────────────────────────
  if (!draft) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Draft not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayText = getDisplayText(draft);
  const previewText = displayText.length > 120
    ? displayText.substring(0, 120) + '...'
    : displayText;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
            <View style={styles.backBtnInner}>
              <Text style={styles.backIcon}>‹</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.title}>Publish Options</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Preview Card */}
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            {profilePicture ? (
              <Image
                source={{ uri: profilePicture }}
                style={styles.previewAvatarImage}
              />
            ) : (
              <View style={styles.previewAvatar}>
                <Text style={styles.previewAvatarText}>{initials}</Text>
              </View>
            )}
            <View style={styles.previewInfo}>
              <Text style={styles.previewName}>{linkedInName}</Text>
              <Text style={styles.previewMeta}>
                {user?.linkedIn?.connected ? 'LinkedIn · Just now' : 'Preview'}
              </Text>
            </View>
            <View style={styles.linkedInBadge}>
              <Text style={styles.linkedInBadgeText}>in</Text>
            </View>
          </View>
          <Text style={styles.previewText}>{previewText}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            onPress={() => setSelectedMode('now')}
            style={[styles.optionCard, selectedMode === 'now' && styles.optionCardSelectedPrimary]}
            activeOpacity={0.8}
          >
            <View style={[styles.optionIcon, selectedMode === 'now' && styles.optionIconSelectedPrimary]}>
              <View style={styles.rocketIcon}>
                <View style={styles.rocketBody} />
                <View style={styles.rocketFlame} />
              </View>
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, selectedMode === 'now' && styles.optionTitleWhite]}>
                Post Now
              </Text>
              <Text style={[styles.optionDescription, selectedMode === 'now' && styles.optionDescWhite]}>
                Publish immediately to LinkedIn
              </Text>
            </View>
            {selectedMode === 'now' && <View style={styles.selectedDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedMode('schedule')}
            style={[styles.optionCard, selectedMode === 'schedule' && styles.optionCardSelectedAccent]}
            activeOpacity={0.8}
          >
            <View style={[styles.optionIcon, selectedMode === 'schedule' && styles.optionIconSelectedAccent]}>
              <View style={styles.calendarIcon}>
                <View style={styles.calendarTop} />
                <View style={styles.calendarBody} />
              </View>
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, selectedMode === 'schedule' && { color: theme.accent }]}>
                Schedule
              </Text>
              <Text style={styles.optionDescription}>
                Pick the best time for engagement
              </Text>
            </View>
            {selectedMode === 'schedule' && <View style={[styles.selectedDot, { backgroundColor: theme.accent }]} />}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCopyText}
            style={styles.optionCard}
            activeOpacity={0.8}
          >
            <View style={styles.optionIconNeutral}>
              <View style={styles.clipboardIcon}>
                <View style={styles.clipboardTop} />
                <View style={styles.clipboardBody} />
              </View>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Copy Text</Text>
              <Text style={styles.optionDescription}>Paste manually into LinkedIn</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />

        {/* Confirm Button */}
        {selectedMode && (
          <TouchableOpacity
            onPress={handleConfirm}
            style={[
              styles.confirmButton,
              selectedMode === 'now' ? styles.confirmButtonPrimary : styles.confirmButtonAccent,
            ]}
            activeOpacity={0.85}
            disabled={isPublishing}
          >
            {isPublishing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>
                {selectedMode === 'now' ? 'Confirm & Publish' : 'Choose Date & Time'}
              </Text>
            )}
          </TouchableOpacity>
        )}

        <View style={{ height: insets.bottom + 16 }} />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme, isDarkMode, insets) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.bg },
  container: { flex: 1, paddingHorizontal: 22, paddingTop: 8 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 20, marginTop: 4,
  },
  backButton: {},
  backBtnInner: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1, borderColor: theme.border,
    justifyContent: 'center', alignItems: 'center',
  },
  backIcon: { fontSize: 22, color: theme.textSecondary, marginTop: -2 },
  title: {
    flex: 1, fontSize: 18, fontWeight: '700',
    color: theme.text, marginLeft: 12, letterSpacing: -0.3,
  },
  headerSpacer: { width: 36 },

  // Preview card
  previewCard: {
    padding: 16, borderRadius: 16,
    backgroundColor: theme.surface,
    borderWidth: 1, borderColor: theme.border,
    marginBottom: 20,
  },
  previewHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 10, gap: 10,
  },
  previewAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: theme.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  previewAvatarImage: {
    width: 38, height: 38, borderRadius: 19,
  },
  previewAvatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  previewInfo: { flex: 1 },
  previewName: { fontSize: 13, fontWeight: '600', color: theme.text },
  previewMeta: { fontSize: 11, color: theme.textMuted },
  linkedInBadge: {
    width: 24, height: 24, borderRadius: 6,
    backgroundColor: '#0A66C2',
    justifyContent: 'center', alignItems: 'center',
  },
  linkedInBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', fontStyle: 'italic' },
  previewText: { fontSize: 13, color: theme.textSecondary, lineHeight: 20 },

  // Options
  optionsContainer: { gap: 10 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 18, borderRadius: 16,
    backgroundColor: theme.surface,
    borderWidth: 1.5, borderColor: theme.border,
  },
  optionCardSelectedPrimary: {
    backgroundColor: theme.primary, borderColor: theme.primary,
  },
  optionCardSelectedAccent: {
    backgroundColor: theme.accentGlow, borderColor: theme.accent,
  },
  optionIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: theme.primaryGlow,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  optionIconSelectedPrimary: { backgroundColor: 'rgba(255,255,255,0.2)' },
  optionIconSelectedAccent: { backgroundColor: 'rgba(56,232,196,0.15)' },
  optionIconNeutral: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: theme.surfaceHigh,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  optionContent: { flex: 1 },
  optionTitle: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 2 },
  optionTitleWhite: { color: '#fff' },
  optionDescription: { fontSize: 12, color: theme.textMuted },
  optionDescWhite: { color: 'rgba(255,255,255,0.7)' },
  selectedDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#fff',
  },

  // Geometric icons
  rocketIcon: { alignItems: 'center' },
  rocketBody: {
    width: 10, height: 14, borderRadius: 5,
    borderWidth: 2, borderColor: theme.primary,
  },
  rocketFlame: {
    width: 6, height: 6,
    borderBottomLeftRadius: 3, borderBottomRightRadius: 3,
    backgroundColor: theme.primary, marginTop: -2,
  },
  calendarIcon: { alignItems: 'center' },
  calendarTop: {
    width: 14, height: 4, borderRadius: 2,
    backgroundColor: theme.accent, marginBottom: 2,
  },
  calendarBody: {
    width: 14, height: 10, borderRadius: 2,
    borderWidth: 2, borderColor: theme.accent,
  },
  clipboardIcon: { alignItems: 'center' },
  clipboardTop: {
    width: 8, height: 4, borderRadius: 2,
    backgroundColor: theme.textMuted, marginBottom: 1,
  },
  clipboardBody: {
    width: 12, height: 10, borderRadius: 2,
    borderWidth: 2, borderColor: theme.textMuted,
  },

  spacer: { flex: 1 },

  confirmButton: {
    padding: 16, borderRadius: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDarkMode ? 0.4 : 0.2,
    shadowRadius: 12, elevation: 6,
  },
  confirmButtonPrimary: {
    backgroundColor: theme.primary,
    shadowColor: theme.primary,
  },
  confirmButtonAccent: {
    backgroundColor: theme.accent,
    shadowColor: theme.accent,
  },
  confirmButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Success screen
  successContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 40, backgroundColor: theme.bg,
  },
  successRingOuter: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: `${theme.accent}20`,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 28,
  },
  successRingInner: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: `${theme.accent}30`,
    justifyContent: 'center', alignItems: 'center',
  },
  successCheck: {
    width: 40, height: 40,
    justifyContent: 'center', alignItems: 'center',
  },
  checkLine1: {
    position: 'absolute',
    width: 12, height: 3, borderRadius: 2,
    backgroundColor: theme.accent,
    bottom: 12, left: 6,
    transform: [{ rotate: '45deg' }],
  },
  checkLine2: {
    position: 'absolute',
    width: 22, height: 3, borderRadius: 2,
    backgroundColor: theme.accent,
    bottom: 14, right: 4,
    transform: [{ rotate: '-55deg' }],
  },
  successTitle: {
    fontSize: 26, fontWeight: '800',
    color: theme.text, marginBottom: 10,
    textAlign: 'center', letterSpacing: -0.5,
  },
  successSub: {
    fontSize: 14, color: theme.textMuted,
    textAlign: 'center', lineHeight: 22,
    marginBottom: 36,
  },
  viewPostBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 16, backgroundColor: '#0A66C2',
    marginBottom: 12,
    shadowColor: '#0A66C2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  viewPostBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  viewPostArrow: { fontSize: 16, color: '#fff' },
  doneBtn: {
    paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 1.5, borderColor: theme.border,
  },
  doneBtnText: { fontSize: 14, fontWeight: '600', color: theme.textSecondary },

  // Empty state
  emptyContainer: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', padding: 20,
  },
  emptyText: { fontSize: 16, color: theme.textMuted, marginBottom: 20 },
  emptyButton: {
    padding: 14, borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1, borderColor: theme.border,
  },
  emptyButtonText: { fontSize: 14, fontWeight: '600', color: theme.text },
});