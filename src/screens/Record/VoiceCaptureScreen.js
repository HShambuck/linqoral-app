import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/UserContext';
import { useDrafts } from '../../context/DraftContext';
import VoiceRecorder from '../../components/VoiceRecorder';
import ToneSelector from '../../components/ToneSelector';
import { SCREENS, TONES } from '../../utils/constants';
import { useFocusEffect } from '@react-navigation/native';

/**
 * VoiceCaptureScreen
 * 
 * Voice-first recording interface.
 * Users speak their thoughts, select a tone, and AI processes the content.
 * 
 * Design Principles:
 * - Voice-First, Not Text-First
 * - Low Cognitive Load
 * - User Control & Trust
 */
const VoiceCaptureScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { processVoiceRecording, isProcessing, currentDraft } = useDrafts();

  const [selectedTone, setSelectedTone] = useState('Professional');
  const [phase, setPhase] = useState('idle'); // idle | recording | processing | done
  const voiceRecorderRef = useRef(null);
  useFocusEffect(
  React.useCallback(() => {
    return () => {
      setPhase('idle');
    };
  }, [])
);

  const styles = createStyles(theme);

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    if (phase === 'recording') {
      Alert.alert(
        'Cancel Recording?',
        'Your recording will be lost.',
        [
          { text: 'Continue Recording', style: 'cancel' },
          {
            text: 'Cancel',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  /**
   * Handle recording complete - process with AI
   */
  const handleRecordingComplete = async ({ uri, durationMs }) => {
    setPhase('processing');

    const result = await processVoiceRecording(uri, selectedTone);

    if (result.success) {
      setPhase('done');
    } else {
      Alert.alert(
        'Processing Failed',
        result.error || 'Failed to process your recording. Please try again.',
        [{ text: 'OK', onPress: () => setPhase('idle') }]
      );
    }
  };

  /**
   * Handle processing start
   */
  const handleProcessingStart = () => {
    setPhase('processing');
  };

  /**
   * Handle recording error
   */
  const handleError = (error) => {
    Alert.alert(
      'Recording Error',
      error.message || 'An error occurred while recording.',
      [{ text: 'OK' }]
    );
    setPhase('idle');
  };

  /**
   * Navigate to editor after successful processing
   */
  const handleReviewPost = () => {
    if (currentDraft) {
      navigation.navigate(SCREENS.EDITOR, { draftId: currentDraft.id });
    }
  };

  /**
   * Update phase from recorder
   */
  const handlePhaseChange = (newPhase) => {
    setPhase(newPhase);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Voice Post</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Tone Selector (only show when not processing/done) */}
        {(phase === 'idle' || phase === 'recording') && (
          <View style={styles.toneSection}>
            <ToneSelector
              selectedTone={selectedTone}
              onSelectTone={setSelectedTone}
              label="Tone"
            />
          </View>
        )}

        {/* Voice Recorder */}
        <View style={styles.recorderContainer}>
          <VoiceRecorder
            ref={voiceRecorderRef}
            onRecordingComplete={handleRecordingComplete}
            onProcessingStart={handleProcessingStart}
            onError={handleError}
            processingMessage="Refining your post..."
          />
        </View>

        {/* Review Button (when done) */}
        {phase === 'done' && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              onPress={handleReviewPost}
              style={styles.reviewButton}
              activeOpacity={0.8}
            >
              <Text style={styles.reviewButtonText}>Review Post →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPhase('idle')}
              style={styles.recordAgainButton}
              activeOpacity={0.7}
            >
              <Text style={styles.recordAgainText}>Record Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <View style={styles.processingCard}>
              <Text style={styles.processingIcon}>✨</Text>
              <Text style={styles.processingTitle}>AI is working...</Text>
              <Text style={styles.processingSubtitle}>
                Preserving your authentic voice
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    container: {
      flex: 1,
      padding: 20,
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    backButton: {
      padding: 4,
    },
    backIcon: {
      fontSize: 24,
      color: theme.textMuted,
    },
    title: {
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      marginLeft: 12,
    },
    headerSpacer: {
      width: 28,
    },

    // Tone Section
    toneSection: {
      marginBottom: 24,
    },

    // Recorder
    recorderContainer: {
      flex: 1,
    },

    // Action Container
    actionContainer: {
      paddingTop: 20,
      gap: 12,
    },
    reviewButton: {
      padding: 16,
      borderRadius: 16,
      backgroundColor: theme.primary,
      alignItems: 'center',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    reviewButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
    },
    recordAgainButton: {
      padding: 14,
      alignItems: 'center',
    },
    recordAgainText: {
      fontSize: 14,
      color: theme.textMuted,
    },

    // Processing Overlay
    processingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    processingCard: {
      padding: 32,
      borderRadius: 20,
      backgroundColor: theme.surface,
      alignItems: 'center',
      minWidth: 200,
    },
    processingIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    processingTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
    },
    processingSubtitle: {
      fontSize: 13,
      color: theme.textMuted,
    },
  });

export default VoiceCaptureScreen;