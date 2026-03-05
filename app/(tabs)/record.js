// app/(tabs)/record.js
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/context/UserContext';
import { useDrafts } from '../../src/context/DraftContext';
import VoiceRecorder from '../../src/components/VoiceRecorder';
import ToneSelector from '../../src/components/ToneSelector';

export default function RecordScreen() {
  const router = useRouter();
  const { theme, isDarkMode } = useTheme();
  const { processVoiceRecording, currentDraft } = useDrafts();
  const insets = useSafeAreaInsets();

  const [selectedTone, setSelectedTone] = useState('Professional');
  const [phase, setPhase] = useState('idle');
  const [recorderKey, setRecorderKey] = useState(0);
  const voiceRecorderRef = useRef(null); // ← ref to call setDone/setError on VoiceRecorder

  const styles = createStyles(theme, isDarkMode, insets);

  // Reset everything when navigating away from this screen
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setPhase('idle');
        setRecorderKey(k => k + 1); // forces VoiceRecorder to fully remount = clean slate
      };
    }, [])
  );

  const handleBack = () => {
    if (phase === 'recording') {
      Alert.alert('Cancel Recording?', 'Your recording will be lost.', [
        { text: 'Continue Recording', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  const handleRecordingComplete = async ({ uri }) => {
    setPhase('processing');
    const result = await processVoiceRecording(uri, selectedTone);
    if (result.success) {
      // Tell VoiceRecorder to instantly switch to DONE state — shows Post ready + Review Post button
      voiceRecorderRef.current?.setDone();
    } else {
      // Tell VoiceRecorder to show error state with the message
      voiceRecorderRef.current?.setError(result.error || 'Processing failed');
      setPhase('idle');
    }
  };

  const handleReviewPost = () => {
    const id = currentDraft?.id || currentDraft?._id;
    if (id) {
      router.push(`/editor/${id}`);
    } else {
      Alert.alert('Error', 'Could not find draft. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
            <View style={styles.backBtnInner}>
              <Text style={styles.backBtnText}>‹</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.title}>Voice Post</Text>
          <View style={styles.tonePill}>
            <Text style={styles.tonePillText}>{selectedTone}</Text>
          </View>
        </View>

        {/* Tone Selector — only visible when idle or recording */}
        {(phase === 'idle' || phase === 'recording') && (
          <View style={styles.toneSection}>
            <ToneSelector selectedTone={selectedTone} onSelectTone={setSelectedTone} />
          </View>
        )}

        {/* Recorder */}
        <View style={styles.recorderWrap}>
          <VoiceRecorder
            key={recorderKey}
            ref={voiceRecorderRef}
            onRecordingComplete={handleRecordingComplete}
            onProcessingStart={() => setPhase('processing')}
            onReviewPost={handleReviewPost}
            onError={(err) => {
              Alert.alert('Recording Error', err.message || 'An error occurred.');
              setPhase('idle');
            }}
            processingMessage="Refining your post..."
          />
        </View>

      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme, isDarkMode, insets) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.bg },
  container: { flex: 1, paddingHorizontal: 22 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 20,
  },
  backBtn: { marginRight: 14 },
  backBtnInner: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 1, borderColor: theme.border,
    justifyContent: 'center', alignItems: 'center',
  },
  backBtnText: { fontSize: 22, color: theme.textSecondary, marginTop: -2 },
  title: {
    flex: 1,
    fontSize: 18, fontWeight: '700',
    color: theme.text, letterSpacing: -0.3,
  },
  tonePill: {
    paddingVertical: 5, paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: theme.primaryGlow,
    borderWidth: 1, borderColor: `${theme.primary}30`,
  },
  tonePillText: { fontSize: 11, fontWeight: '600', color: theme.primary, letterSpacing: 0.2 },

  toneSection: { marginBottom: 20 },
  recorderWrap: { flex: 1 },
});