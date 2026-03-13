// app/editor/[id].js
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, Modal,
  ActivityIndicator, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../src/context/UserContext";
import { useDrafts } from "../../src/context/DraftContext";
import ToneSelector from "../../src/components/ToneSelector";
import VoiceRecorder from "../../src/components/VoiceRecorder";
import MediaPicker from "../../src/components/MediaPicker";
import aiService from "../../src/services/aiService";
import { LINKEDIN_LIMITS } from "../../src/utils/constants";
import { getCharacterCountStatus } from "../../src/utils/validators";
import { getDisplayText } from "../../src/models/Draft";

export default function EditorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { theme, isDarkMode } = useTheme();
  const {
    currentDraft, setCurrentDraft, saveDraft,
    updateDraftTone, uploadMedia, drafts,
  } = useDrafts();
  const insets = useSafeAreaInsets();

  const [editText, setEditText] = useState("");
  const [selectedTone, setSelectedTone] = useState("Professional");
  const [mediaAttachments, setMediaAttachments] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingTone, setIsChangingTone] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showVoiceEdit, setShowVoiceEdit] = useState(false);
  const [isApplyingVoiceEdit, setIsApplyingVoiceEdit] = useState(false);
  const [draft, setDraft] = useState(null);

  const styles = createStyles(theme, isDarkMode, insets);

  // Resolve draft from context or drafts list
  useEffect(() => {
    let resolved = null;
    if (id) {
      resolved = drafts.find((d) => d.id === id) || currentDraft;
    } else {
      resolved = currentDraft;
    }

    if (resolved) {
      setDraft(resolved);
      setCurrentDraft(resolved);
      const text = getDisplayText(resolved) || '';
      setEditText(text);
      setSelectedTone(resolved.tone || 'Professional');
      setMediaAttachments(resolved.mediaAttachments || []);
    }
  }, [id, drafts]);

  useEffect(() => {
    if (draft) {
      const originalText = getDisplayText(draft) || '';
      setHasChanges(
        editText !== originalText || selectedTone !== (draft.tone || 'Professional'),
      );
    }
  }, [editText, selectedTone, draft]);

  const handleToneChange = async (newTone) => {
    setSelectedTone(newTone);
    if (!draft) return;
    setIsChangingTone(true);
    const result = await updateDraftTone(draft.id, newTone);
    if (result.success) {
      setEditText(result.refinedText);
    } else {
      Alert.alert("Error", "Failed to change tone. Please try again.");
    }
    setIsChangingTone(false);
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert("Unsaved Changes", "What would you like to do?", [
        { text: "Cancel", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => router.back() },
        {
          text: "Save Draft",
          onPress: async () => {
            await handleSaveDraft();
            router.back();
          },
        },
      ]);
    } else {
      router.back();
    }
  };

  const handleSaveDraft = async () => {
    if (!draft) return false;
    setIsSaving(true);
    const result = await saveDraft(draft.id, {
      userEditedText: editText,
      tone: selectedTone,
      mediaAttachments,
    });
    setIsSaving(false);
    if (result.success) {
      setHasChanges(false);
      return true;
    }
    Alert.alert("Error", "Failed to save draft.");
    return false;
  };

  const handlePublishOptions = async () => {
    if (!draft) return;
    if (hasChanges) {
      const saved = await handleSaveDraft();
      if (!saved) return;
    }
    router.push(`/publish/options?draftId=${draft.id}`);
  };

  const handleUploadMedia = useCallback(
    async (uri, type, mimeType) => {
      if (!uploadMedia) throw new Error("Upload not available");
      return await uploadMedia(uri, type, mimeType);
    },
    [uploadMedia],
  );

  const handleVoiceEditComplete = useCallback(
    async ({ uri }) => {
      setIsApplyingVoiceEdit(true);
      try {
        const { transcript } = await aiService.transcribeAudio(uri);
        const { refinedText } = await aiService.applyVoiceEdit(
          editText, transcript, selectedTone,
        );
        setEditText(refinedText);
        setHasChanges(true);
        setShowVoiceEdit(false);
      } catch {
        Alert.alert("Error", "Failed to apply voice edit. Please try again.");
      }
      setIsApplyingVoiceEdit(false);
    },
    [editText, selectedTone],
  );

  const charCountStatus = getCharacterCountStatus(editText.length);
  const charCountColor =
    charCountStatus === "error" ? theme.danger
    : charCountStatus === "warning" ? theme.warning
    : theme.textMuted;

  // Loading state while draft resolves
  if (!draft) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={theme.primary} size="large" />
          <Text style={styles.loadingStateText}>Loading draft...</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.emptyBtn}>
            <Text style={styles.emptyBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
                <View style={styles.backBtnInner}>
                  <Text style={styles.backBtnText}>‹</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.title}>Edit Post</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                onPress={() => setShowVoiceEdit(true)}
                style={styles.voiceEditBtn}
                activeOpacity={0.7}
              >
                <View style={styles.headerMicWrap}>
                  <View style={styles.headerMicBody} />
                  <View style={styles.headerMicNeck} />
                </View>
                <Text style={styles.voiceEditLabel}>Edit</Text>
              </TouchableOpacity>
              <View style={styles.toneBadge}>
                <Text style={styles.toneBadgeText}>{selectedTone}</Text>
              </View>
            </View>
          </View>

          {/* Scrollable body */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* AI Notice */}
            <View style={styles.aiNotice}>
              <View style={styles.aiNoticeDot} />
              <Text style={styles.aiNoticeText}>
                AI has refined your transcript · your voice preserved
              </Text>
            </View>

            {/* Text editor */}
            <View style={styles.editorWrap}>
              <TextInput
                value={editText}
                onChangeText={(t) => { setEditText(t); setHasChanges(true); }}
                style={styles.textInput}
                multiline
                placeholder="Your post content..."
                placeholderTextColor={theme.textMuted}
                textAlignVertical="top"
                editable={!isChangingTone}
              />
              {isChangingTone && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator color={theme.primary} size="small" />
                  <Text style={styles.loadingText}>Changing tone...</Text>
                </View>
              )}
              <View style={styles.charCount}>
                <Text style={[styles.charCountText, { color: charCountColor }]}>
                  {editText.length} / {LINKEDIN_LIMITS.MAX_POST_LENGTH}
                </Text>
              </View>
            </View>

            {/* Media Picker */}
            <MediaPicker
              attachments={mediaAttachments}
              onMediaChange={(updated) => { setMediaAttachments(updated); setHasChanges(true); }}
              onUploadMedia={handleUploadMedia}
              disabled={isSaving}
            />

            {/* Tone Selector */}
            <ToneSelector selectedTone={selectedTone} onSelectTone={handleToneChange} />
          </ScrollView>

          {/* Actions */}
          <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
            <TouchableOpacity
              onPress={handleSaveDraft}
              style={styles.saveBtn}
              activeOpacity={0.7}
              disabled={isSaving || !hasChanges}
            >
              <Text style={[styles.saveBtnText, (!hasChanges || isSaving) && styles.saveBtnDisabled]}>
                {isSaving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePublishOptions}
              style={styles.publishBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.publishBtnText}>Publish Options</Text>
              <Text style={styles.publishBtnArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Voice Edit Modal */}
      <Modal
        visible={showVoiceEdit}
        animationType="slide"
        transparent
        onRequestClose={() => setShowVoiceEdit(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Voice Edit</Text>
              <TouchableOpacity onPress={() => setShowVoiceEdit(false)} style={styles.modalCloseBtn}>
                <View style={styles.modalCloseLine1} />
                <View style={styles.modalCloseLine2} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Say your edit instructions, e.g. "make it shorter" or "add a call to action"
            </Text>
            {isApplyingVoiceEdit ? (
              <View style={styles.applyingWrap}>
                <ActivityIndicator color={theme.primary} size="large" />
                <Text style={styles.applyingText}>Applying your edits...</Text>
              </View>
            ) : (
              <VoiceRecorder
                onRecordingComplete={handleVoiceEditComplete}
                processingMessage="Processing instructions..."
                onError={(err) => {
                  Alert.alert("Error", err.message);
                  setShowVoiceEdit(false);
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme, isDarkMode, insets) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.bg },
    container: { flex: 1, paddingHorizontal: 22, paddingTop: 8 },

    loadingState: {
      flex: 1, justifyContent: 'center',
      alignItems: 'center', gap: 16, padding: 20,
    },
    loadingStateText: { fontSize: 14, color: theme.textMuted },
    emptyBtn: {
      padding: 14, borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 1, borderColor: theme.border,
      marginTop: 8,
    },
    emptyBtnText: { fontSize: 14, fontWeight: '600', color: theme.text },

    header: {
      flexDirection: "row", alignItems: "center",
      justifyContent: "space-between", marginBottom: 16,
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
    backBtn: {},
    backBtnInner: {
      width: 36, height: 36, borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 1, borderColor: theme.border,
      justifyContent: "center", alignItems: "center",
    },
    backBtnText: { fontSize: 22, color: theme.textSecondary, marginTop: -2 },
    title: { fontSize: 18, fontWeight: "700", color: theme.text, letterSpacing: -0.3 },

    voiceEditBtn: {
      flexDirection: "row", alignItems: "center", gap: 5,
      paddingVertical: 7, paddingHorizontal: 10,
      borderRadius: 20, backgroundColor: theme.accentGlow,
      borderWidth: 1, borderColor: `${theme.accent}30`,
    },
    headerMicWrap: { alignItems: "center" },
    headerMicBody: {
      width: 8, height: 11, borderRadius: 4,
      borderWidth: 1.5, borderColor: theme.accent,
    },
    headerMicNeck: {
      width: 10, height: 5,
      borderTopLeftRadius: 5, borderTopRightRadius: 5,
      borderWidth: 1.5, borderBottomWidth: 0,
      borderColor: theme.accent, marginTop: 1,
    },
    voiceEditLabel: { fontSize: 11, fontWeight: "600", color: theme.accent },
    toneBadge: {
      paddingVertical: 5, paddingHorizontal: 10,
      borderRadius: 20, backgroundColor: theme.primaryGlow,
      borderWidth: 1, borderColor: `${theme.primary}30`,
    },
    toneBadgeText: { fontSize: 11, fontWeight: "600", color: theme.primary },

    body: { flex: 1 },
    bodyContent: { paddingBottom: 8, gap: 12 },

    aiNotice: {
      flexDirection: "row", alignItems: "center", gap: 8,
      padding: 11, borderRadius: 12,
      backgroundColor: theme.accentGlow,
      borderWidth: 1, borderColor: `${theme.accent}25`,
    },
    aiNoticeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.accent },
    aiNoticeText: { fontSize: 12, color: theme.textSecondary, flex: 1 },

    editorWrap: { minHeight: 180, marginBottom: 4 },
    textInput: {
      minHeight: 160, padding: 14, borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1.5, borderColor: theme.border,
      color: theme.text, fontSize: 14, lineHeight: 22,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: `${theme.surface}CC`,
      borderRadius: 16,
      justifyContent: "center", alignItems: "center", gap: 8,
    },
    loadingText: { fontSize: 13, color: theme.textMuted },
    charCount: { alignItems: "flex-end", marginTop: 6, paddingRight: 4 },
    charCountText: { fontSize: 11 },

    actions: {
      flexDirection: "row", gap: 10,
      paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border,
    },
    saveBtn: {
      flex: 1, padding: 14, borderRadius: 14,
      borderWidth: 1.5, borderColor: theme.border, alignItems: "center",
    },
    saveBtnText: { fontSize: 13, fontWeight: "600", color: theme.textSecondary },
    saveBtnDisabled: { opacity: 0.4 },
    publishBtn: {
      flex: 2.5, flexDirection: "row", padding: 14,
      borderRadius: 14, backgroundColor: theme.primary,
      alignItems: "center", justifyContent: "center", gap: 4,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDarkMode ? 0.4 : 0.2,
      shadowRadius: 12, elevation: 6,
    },
    publishBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
    publishBtnArrow: { fontSize: 18, color: "rgba(255,255,255,0.8)", fontWeight: "600" },

    modalOverlay: { flex: 1, backgroundColor: theme.overlay, justifyContent: "flex-end" },
    modalSheet: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      padding: 24, paddingBottom: insets.bottom + 24, minHeight: 420,
    },
    modalHandle: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: theme.border, alignSelf: "center", marginBottom: 20,
    },
    modalHeader: {
      flexDirection: "row", justifyContent: "space-between",
      alignItems: "center", marginBottom: 8,
    },
    modalTitle: { fontSize: 18, fontWeight: "700", color: theme.text },
    modalCloseBtn: { width: 28, height: 28, justifyContent: "center", alignItems: "center" },
    modalCloseLine1: {
      position: "absolute", width: 16, height: 2,
      backgroundColor: theme.textMuted, borderRadius: 1,
      transform: [{ rotate: "45deg" }],
    },
    modalCloseLine2: {
      position: "absolute", width: 16, height: 2,
      backgroundColor: theme.textMuted, borderRadius: 1,
      transform: [{ rotate: "-45deg" }],
    },
    modalSub: { fontSize: 13, color: theme.textMuted, lineHeight: 20, marginBottom: 24 },
    applyingWrap: {
      flex: 1, justifyContent: "center",
      alignItems: "center", gap: 16, minHeight: 200,
    },
    applyingText: { fontSize: 14, color: theme.textMuted },
  });