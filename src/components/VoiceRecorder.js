// src/components/VoiceRecorder.js
import { Audio } from "expo-av";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/UserContext";
import { RECORDING_CONFIG } from "../utils/constants";
import { formatDuration, validateRecordingDuration } from "../utils/validators";

const PHASES = {
  IDLE: "idle",
  RECORDING: "recording",
  PROCESSING: "processing",
  DONE: "done",
  ERROR: "error",
};

// ── CHANGE 1: wrapped with forwardRef and added ref parameter ──
const VoiceRecorder = forwardRef(
  (
    {
      onRecordingComplete,
      onProcessingStart,
      onError,
      onReviewPost,
      processingMessage = "Refining your post...",
    },
    ref,
  ) => {
    const { theme, isDarkMode } = useTheme();
    const styles = createStyles(theme, isDarkMode);

    const [phase, setPhase] = useState(PHASES.IDLE);
    const [duration, setDuration] = useState(0);
    const [errorMessage, setErrorMessage] = useState(null);

    const recordingRef = useRef(null);
    const durationIntervalRef = useRef(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const pulseOpacity = useRef(new Animated.Value(0.4)).current;
    const waveformValues = useRef(
      Array.from({ length: 20 }, () => new Animated.Value(3)),
    ).current;
    const dotAnim = useRef([
      new Animated.Value(0.3),
      new Animated.Value(0.3),
      new Animated.Value(0.3),
    ]).current;

    // ── CHANGE 2: added useImperativeHandle so parent can call setDone/setError/reset ──
    useImperativeHandle(ref, () => ({
      setDone: () => setPhase(PHASES.DONE),
      setError: (msg) => {
        setErrorMessage(msg || "Processing failed");
        setPhase(PHASES.ERROR);
      },
      reset: () => {
        setPhase(PHASES.IDLE);
        setDuration(0);
        setErrorMessage(null);
      },
    }));

    useEffect(() => {
      Audio.requestPermissionsAsync();
      Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      return () => {
        // cleanup on unmount
        if (durationIntervalRef.current)
          clearInterval(durationIntervalRef.current);
        if (recordingRef.current) {
          recordingRef.current.stopAndUnloadAsync().catch(() => {});
          recordingRef.current = null;
        }
        setPhase(PHASES.IDLE);
        setDuration(0);
      };
    }, []);

    useEffect(() => {
      if (phase === PHASES.RECORDING) {
        const pulse = Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(pulseAnim, {
                toValue: 1.18,
                duration: 900,
                useNativeDriver: true,
              }),
              Animated.timing(pulseOpacity, {
                toValue: 0.15,
                duration: 900,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 900,
                useNativeDriver: true,
              }),
              Animated.timing(pulseOpacity, {
                toValue: 0.4,
                duration: 900,
                useNativeDriver: true,
              }),
            ]),
          ]),
        );
        pulse.start();
        const waveInterval = setInterval(() => {
          waveformValues.forEach((anim) => {
            Animated.timing(anim, {
              toValue: Math.random() * 28 + 3,
              duration: 120,
              useNativeDriver: false,
            }).start();
          });
        }, 120);
        return () => {
          pulse.stop();
          clearInterval(waveInterval);
        };
      }
      if (phase === PHASES.PROCESSING) {
        const animateDots = () => {
          dotAnim.forEach((anim, i) => {
            Animated.sequence([
              Animated.delay(i * 180),
              Animated.loop(
                Animated.sequence([
                  Animated.timing(anim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                  }),
                  Animated.timing(anim, {
                    toValue: 0.3,
                    duration: 400,
                    useNativeDriver: true,
                  }),
                ]),
              ),
            ]).start();
          });
        };
        animateDots();
      }
    }, [phase]);

    const startRecording = async () => {
      try {
        setErrorMessage(null);
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== "granted")
          throw new Error("Microphone permission required");
        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync({
          android: {
            extension: ".m4a",
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: RECORDING_CONFIG.SAMPLE_RATE,
            numberOfChannels: RECORDING_CONFIG.CHANNELS,
            bitRate: RECORDING_CONFIG.BIT_RATE,
          },
          ios: {
            extension: ".m4a",
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: RECORDING_CONFIG.SAMPLE_RATE,
            numberOfChannels: RECORDING_CONFIG.CHANNELS,
            bitRate: RECORDING_CONFIG.BIT_RATE,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: "audio/webm",
            bitsPerSecond: RECORDING_CONFIG.BIT_RATE,
          },
        });
        await recording.startAsync();
        recordingRef.current = recording;
        setPhase(PHASES.RECORDING);
        setDuration(0);
        durationIntervalRef.current = setInterval(() => {
          setDuration((prev) => {
            const next = prev + 1000;
            if (next >= RECORDING_CONFIG.MAX_DURATION_MS) stopRecording();
            return next;
          });
        }, 1000);
      } catch (error) {
        setErrorMessage(error.message || "Failed to start recording");
        setPhase(PHASES.ERROR);
        onError?.(error);
      }
    };

    const stopRecording = async () => {
      try {
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
        if (!recordingRef.current) return;
        const validation = validateRecordingDuration(duration);
        if (!validation.isValid) {
          setErrorMessage(validation.error);
          setPhase(PHASES.ERROR);
          await recordingRef.current.stopAndUnloadAsync();
          recordingRef.current = null;
          return;
        }
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        recordingRef.current = null;
        setPhase(PHASES.PROCESSING);
        onProcessingStart?.();
        onRecordingComplete?.({ uri, durationMs: duration });
      } catch (error) {
        setErrorMessage(error.message || "Failed to stop recording");
        setPhase(PHASES.ERROR);
        onError?.(error);
      }
    };

    const cancelRecording = async () => {
      if (durationIntervalRef.current)
        clearInterval(durationIntervalRef.current);
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (e) {}
        recordingRef.current = null;
      }
      setPhase(PHASES.IDLE);
      setDuration(0);
      setErrorMessage(null);
    };

    const handlePress = () => {
      if (phase === PHASES.IDLE || phase === PHASES.ERROR) startRecording();
      else if (phase === PHASES.RECORDING) stopRecording();
      else if (phase === PHASES.DONE) {
        setPhase(PHASES.IDLE);
        setDuration(0);
      }
    };

    // Idle
    const renderIdle = () => (
      <View style={styles.stateWrap}>
        <Text style={styles.idleHint}>Tap to start recording</Text>
        <TouchableOpacity
          onPress={handlePress}
          style={styles.mainButton}
          activeOpacity={0.85}
        >
          <View style={styles.micIcon}>
            <View style={styles.micBody} />
            <View style={styles.micNeck} />
            <View style={styles.micBase} />
          </View>
        </TouchableOpacity>
        <Text style={styles.idleSubHint}>
          Speak naturally · AI handles formatting
        </Text>
      </View>
    );

    // Recording
    const renderRecording = () => (
      <View style={styles.stateWrap}>
        <View style={styles.durationRow}>
          <View style={styles.recDot} />
          <Text style={styles.durationText}>{formatDuration(duration)}</Text>
        </View>

        <View style={styles.pulseWrap}>
          <Animated.View
            style={[
              styles.pulseRing,
              styles.pulseRing1,
              { transform: [{ scale: pulseAnim }], opacity: pulseOpacity },
            ]}
          />
          <Animated.View
            style={[
              styles.pulseRing,
              styles.pulseRing2,
              { transform: [{ scale: pulseAnim }], opacity: pulseOpacity },
            ]}
          />
          <TouchableOpacity
            onPress={handlePress}
            style={styles.stopButton}
            activeOpacity={0.85}
          >
            <View style={styles.stopIcon} />
          </TouchableOpacity>
        </View>

        <View style={styles.waveform}>
          {waveformValues.map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.waveBar,
                { height: anim, opacity: 0.5 + (i % 3) * 0.15 },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity onPress={cancelRecording} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );

    // Processing
    const renderProcessing = () => (
      <View style={styles.stateWrap}>
        <View style={styles.processingCard}>
          <View style={styles.processingIconWrap}>
            <View style={styles.sparkle1} />
            <View style={styles.sparkle2} />
            <View style={styles.sparkle3} />
          </View>
          <Text style={styles.processingTitle}>{processingMessage}</Text>
          <Text style={styles.processingSubtitle}>
            Preserving your authentic voice
          </Text>
          <View style={styles.dotsRow}>
            {dotAnim.map((anim, i) => (
              <Animated.View
                key={i}
                style={[styles.loadingDot, { opacity: anim }]}
              />
            ))}
          </View>
        </View>
      </View>
    );

    // Done
    const renderDone = () => (
      <View style={styles.stateWrap}>
        <View style={styles.doneCard}>
          <View style={styles.doneCheckWrap}>
            <View style={styles.doneCheckLine1} />
            <View style={styles.doneCheckLine2} />
          </View>
          <Text style={styles.doneTitle}>Post ready</Text>
          <Text style={styles.doneSub}>Review and edit before publishing</Text>

          <TouchableOpacity
            onPress={onReviewPost}
            style={styles.reviewButton}
            activeOpacity={0.8}
          >
            <Text style={styles.reviewButtonText}>Review Post →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setPhase(PHASES.IDLE);
              setDuration(0);
            }}
            style={styles.recordAgainButton}
            activeOpacity={0.7}
          >
            <Text style={styles.recordAgainText}>Record Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );

    // Error
    const renderError = () => (
      <View style={styles.stateWrap}>
        <View style={styles.errorCard}>
          <View style={styles.errorIconWrap}>
            <View style={styles.errorLine1} />
            <View style={styles.errorLine2} />
          </View>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMsg}>{errorMessage}</Text>
          <TouchableOpacity onPress={handlePress} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );

    return (
      <View style={styles.container}>
        {phase === PHASES.IDLE && renderIdle()}
        {phase === PHASES.RECORDING && renderRecording()}
        {phase === PHASES.PROCESSING && renderProcessing()}
        {phase === PHASES.DONE && renderDone()}
        {phase === PHASES.ERROR && renderError()}
      </View>
    );
    // ── CHANGE 3: closing }); instead of }; because of forwardRef wrapper ──
  },
);

const createStyles = (theme, isDarkMode) =>
  StyleSheet.create({
    container: { flex: 1, alignItems: "center", justifyContent: "center" },
    stateWrap: { alignItems: "center", width: "100%" },
    reviewButton: {
      marginTop: 24,
      paddingVertical: 16,
      paddingHorizontal: 40,
      borderRadius: 16,
      backgroundColor: theme.primary,
      alignItems: "center",
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    reviewButtonText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#fff",
    },
    recordAgainButton: {
      paddingTop: 14,
      alignItems: "center",
    },
    recordAgainText: {
      fontSize: 14,
      color: theme.textMuted,
    },

    // Idle
    idleHint: {
      fontSize: 12,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      color: theme.textMuted,
      marginBottom: 32,
      fontWeight: "500",
    },
    mainButton: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: theme.primary,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isDarkMode ? 0.5 : 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    micIcon: { alignItems: "center", justifyContent: "center" },
    micBody: {
      width: 16,
      height: 22,
      borderRadius: 8,
      borderWidth: 2.5,
      borderColor: "#fff",
      backgroundColor: "transparent",
    },
    micNeck: {
      marginTop: 4,
      width: 20,
      height: 10,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      borderWidth: 2.5,
      borderBottomWidth: 0,
      borderColor: "#fff",
      backgroundColor: "transparent",
    },
    micBase: {
      marginTop: 2,
      width: 2.5,
      height: 6,
      backgroundColor: "#fff",
      borderRadius: 1,
    },
    idleSubHint: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 24,
      textAlign: "center",
    },

    // Recording
    durationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 36,
    },
    recDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.danger,
    },
    durationText: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.text,
      letterSpacing: 1,
      fontVariant: ["tabular-nums"],
    },

    pulseWrap: {
      width: 130,
      height: 130,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 28,
    },
    pulseRing: {
      position: "absolute",
      borderRadius: 65,
      backgroundColor: theme.danger,
    },
    pulseRing1: { width: 130, height: 130 },
    pulseRing2: { width: 100, height: 100 },
    stopButton: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.danger,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: theme.danger,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 8,
    },
    stopIcon: {
      width: 22,
      height: 22,
      borderRadius: 4,
      backgroundColor: "#fff",
    },

    waveform: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      height: 44,
      marginBottom: 24,
    },
    waveBar: { width: 3, borderRadius: 2, backgroundColor: theme.primary },

    cancelBtn: { paddingVertical: 10, paddingHorizontal: 24 },
    cancelText: { fontSize: 13, color: theme.textMuted },

    // Processing
    processingCard: { alignItems: "center", padding: 32 },
    processingIconWrap: {
      width: 60,
      height: 60,
      borderRadius: 20,
      backgroundColor: theme.accentGlow,
      borderWidth: 1,
      borderColor: `${theme.accent}30`,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    sparkle1: {
      position: "absolute",
      width: 14,
      height: 14,
      borderRadius: 2,
      backgroundColor: theme.accent,
      transform: [{ rotate: "45deg" }],
      top: 10,
      left: 10,
    },
    sparkle2: {
      position: "absolute",
      width: 8,
      height: 8,
      borderRadius: 1.5,
      backgroundColor: theme.accent,
      opacity: 0.6,
      transform: [{ rotate: "45deg" }],
      bottom: 12,
      right: 10,
    },
    sparkle3: {
      position: "absolute",
      width: 6,
      height: 6,
      borderRadius: 1,
      backgroundColor: theme.accent,
      opacity: 0.4,
      transform: [{ rotate: "45deg" }],
      top: 12,
      right: 14,
    },
    processingTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 6,
      letterSpacing: -0.2,
    },
    processingSubtitle: {
      fontSize: 12,
      color: theme.textMuted,
      marginBottom: 24,
    },
    dotsRow: { flexDirection: "row", gap: 8 },
    loadingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.accent,
    },

    // Done
    doneCard: { alignItems: "center", padding: 32 },
    doneCheckWrap: {
      width: 60,
      height: 60,
      borderRadius: 20,
      backgroundColor: theme.accentGlow,
      borderWidth: 1,
      borderColor: `${theme.accent}30`,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    doneCheckLine1: {
      position: "absolute",
      width: 12,
      height: 3,
      backgroundColor: theme.accent,
      borderRadius: 1.5,
      transform: [{ rotate: "45deg" }, { translateX: -4 }, { translateY: 2 }],
    },
    doneCheckLine2: {
      position: "absolute",
      width: 20,
      height: 3,
      backgroundColor: theme.accent,
      borderRadius: 1.5,
      transform: [{ rotate: "-50deg" }, { translateX: 4 }],
    },
    doneTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.accent,
      marginBottom: 6,
      letterSpacing: -0.3,
    },
    doneSub: { fontSize: 12, color: theme.textMuted },

    // Error
    errorCard: { alignItems: "center", padding: 32 },
    errorIconWrap: {
      width: 60,
      height: 60,
      borderRadius: 20,
      backgroundColor: theme.dangerGlow,
      borderWidth: 1,
      borderColor: `${theme.danger}30`,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    errorLine1: {
      position: "absolute",
      width: 24,
      height: 3,
      backgroundColor: theme.danger,
      borderRadius: 1.5,
      transform: [{ rotate: "45deg" }],
    },
    errorLine2: {
      position: "absolute",
      width: 24,
      height: 3,
      backgroundColor: theme.danger,
      borderRadius: 1.5,
      transform: [{ rotate: "-45deg" }],
    },
    errorTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.danger,
      marginBottom: 6,
    },
    errorMsg: {
      fontSize: 12,
      color: theme.textMuted,
      textAlign: "center",
      marginBottom: 24,
      lineHeight: 18,
    },
    retryBtn: {
      paddingVertical: 11,
      paddingHorizontal: 24,
      borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 1.5,
      borderColor: theme.border,
    },
    retryText: { fontSize: 13, fontWeight: "600", color: theme.text },
  });

export default VoiceRecorder;
