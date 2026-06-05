import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { useAudioRecorder, AudioModule, RecordingPresets } from "expo-audio";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Evidence, saveEvidence, generateEvidenceId, getAllEvidence } from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type CaptureMode = "photo" | "video" | "audio";

const WAVEFORM_BARS = 7;

export default function CaptureScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();

  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [mode, setMode] = useState<CaptureMode>("photo");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [lastCapturedUri, setLastCapturedUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(false);
  const [cachedLocation, setCachedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string | null;
  } | null>(null);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const pulseScale = useSharedValue(1);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const waveBar0 = useSharedValue(0.3);
  const waveBar1 = useSharedValue(0.3);
  const waveBar2 = useSharedValue(0.3);
  const waveBar3 = useSharedValue(0.3);
  const waveBar4 = useSharedValue(0.3);
  const waveBar5 = useSharedValue(0.3);
  const waveBar6 = useSharedValue(0.3);
  const waveBars = [waveBar0, waveBar1, waveBar2, waveBar3, waveBar4, waveBar5, waveBar6];

  const waveBar0Style = useAnimatedStyle(() => ({ transform: [{ scaleY: waveBar0.value }] }));
  const waveBar1Style = useAnimatedStyle(() => ({ transform: [{ scaleY: waveBar1.value }] }));
  const waveBar2Style = useAnimatedStyle(() => ({ transform: [{ scaleY: waveBar2.value }] }));
  const waveBar3Style = useAnimatedStyle(() => ({ transform: [{ scaleY: waveBar3.value }] }));
  const waveBar4Style = useAnimatedStyle(() => ({ transform: [{ scaleY: waveBar4.value }] }));
  const waveBar5Style = useAnimatedStyle(() => ({ transform: [{ scaleY: waveBar5.value }] }));
  const waveBar6Style = useAnimatedStyle(() => ({ transform: [{ scaleY: waveBar6.value }] }));
  const waveBarStyles = [waveBar0Style, waveBar1Style, waveBar2Style, waveBar3Style, waveBar4Style, waveBar5Style, waveBar6Style];

  useEffect(() => {
    checkAudioPermission();
    loadLastEvidence();
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (locationPermission?.granted) {
      prefetchLocation();
    }
  }, [locationPermission?.granted]);

  const checkAudioPermission = async () => {
    const status = await AudioModule.getRecordingPermissionsAsync();
    setAudioPermissionGranted(status.granted);
  };

  const loadLastEvidence = async () => {
    const evidence = await getAllEvidence();
    if (evidence.length > 0) {
      setLastCapturedUri(evidence[0].uri);
    }
  };

  useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(withTiming(1.15, { duration: 500 }), -1, true);

      const durations = [600, 350, 800, 450, 700, 500, 650];
      const heights = [0.9, 0.5, 1.0, 0.6, 0.85, 0.45, 0.75];
      waveBars.forEach((bar, i) => {
        bar.value = withRepeat(
          withTiming(heights[i], { duration: durations[i] }),
          -1,
          true
        );
      });

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      cancelAnimation(pulseScale);
      pulseScale.value = withSpring(1);
      waveBars.forEach((bar) => {
        cancelAnimation(bar);
        bar.value = withTiming(0.3, { duration: 300 });
      });
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingDuration(0);
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const fetchLocationData = async (): Promise<{
    latitude: number | null;
    longitude: number | null;
    address: string | null;
  }> => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      let address = null;
      try {
        const [geocode] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (geocode) {
          address = [geocode.street, geocode.city, geocode.region]
            .filter(Boolean)
            .join(", ");
        }
      } catch {
        // geocoding optional
      }
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address,
      };
    } catch (error) {
      console.error("Error getting location:", error);
      return { latitude: null, longitude: null, address: null };
    }
  };

  const prefetchLocation = async () => {
    const data = await fetchLocationData();
    if (data.latitude !== null && data.longitude !== null) {
      setCachedLocation({
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
      });
    }
  };

  const getCurrentLocation = async (): Promise<{
    latitude: number | null;
    longitude: number | null;
    address: string | null;
  }> => {
    if (!locationPermission?.granted) {
      return { latitude: null, longitude: null, address: null };
    }
    if (cachedLocation) {
      return cachedLocation;
    }
    return fetchLocationData();
  };

  const requestAudioPermission = async (): Promise<boolean> => {
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      setAudioPermissionGranted(status.granted);
      return status.granted;
    } catch (error) {
      console.error("Error requesting audio permission:", error);
      return false;
    }
  };

  const handleStartAudioRecording = async () => {
    if (!audioPermissionGranted) {
      const granted = await requestAudioPermission();
      if (!granted) {
        Alert.alert(
          "Microphone Required",
          "Please enable microphone access to record audio.",
          [
            { text: "Cancel", style: "cancel" },
            Platform.OS !== "web"
              ? { text: "Settings", onPress: openSettings }
              : null,
          ].filter(Boolean) as any
        );
        return;
      }
    }

    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error("Error starting audio recording:", error);
      Alert.alert("Error", "Failed to start audio recording. Please try again.");
    }
  };

  const handleStopAudioRecording = async () => {
    try {
      await audioRecorder.stop();
      setIsRecording(false);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const uri = audioRecorder.uri;
      if (uri) {
        const locationData = await getCurrentLocation();
        const evidence: Evidence = {
          id: generateEvidenceId(),
          type: "audio",
          uri,
          timestamp: Date.now(),
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          address: locationData.address,
          incidentType: null,
          description: null,
          tags: [],
          submissionStatus: "draft",
          submittedAt: null,
        };
        await saveEvidence(evidence);
        setLastCapturedUri(uri);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Error stopping audio recording:", error);
      setIsRecording(false);
    }
  };

  const handleCapture = async () => {
    if (isCapturing) return;

    if (mode === "audio") {
      if (isRecording) {
        await handleStopAudioRecording();
      } else {
        await handleStartAudioRecording();
      }
      return;
    }

    if (!cameraRef.current) return;

    setIsCapturing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (mode === "photo") {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: false,
        });

        if (photo?.uri) {
          const locationData = await getCurrentLocation();

          const evidence: Evidence = {
            id: generateEvidenceId(),
            type: "photo",
            uri: photo.uri,
            timestamp: Date.now(),
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            address: locationData.address,
            incidentType: null,
            description: null,
            tags: [],
            submissionStatus: "draft",
            submittedAt: null,
          };

          await saveEvidence(evidence);
          setLastCapturedUri(photo.uri);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        if (isRecording) {
          cameraRef.current.stopRecording();
          setIsRecording(false);
        } else {
          if (!micPermission?.granted) {
            const result = await requestMicPermission();
            if (!result.granted) {
              Alert.alert(
                "Microphone Required",
                "Please enable microphone access to record video with audio.",
                [
                  { text: "Cancel", style: "cancel" },
                  Platform.OS !== "web" ? { text: "Settings", onPress: openSettings } : null,
                ].filter(Boolean) as any
              );
              setIsCapturing(false);
              return;
            }
          }
          setIsRecording(true);
          const video = await cameraRef.current.recordAsync({
            maxDuration: 60,
          });

          if (video?.uri) {
            const locationData = await getCurrentLocation();

            const evidence: Evidence = {
              id: generateEvidenceId(),
              type: "video",
              uri: video.uri,
              timestamp: Date.now(),
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              address: locationData.address,
              incidentType: null,
              description: null,
              tags: [],
              submissionStatus: "draft",
              submittedAt: null,
            };

            await saveEvidence(evidence);
            setLastCapturedUri(video.uri);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          setIsRecording(false);
        }
      }
    } catch (error) {
      console.error("Capture error:", error);
      Alert.alert("Error", "Failed to capture. Please try again.");
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleFlash = () => {
    setFlash((prev) => (prev === "off" ? "on" : "off"));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const openSettings = async () => {
    if (Platform.OS !== "web") {
      try {
        await Linking.openSettings();
      } catch (error) {
        console.log("Could not open settings");
      }
    }
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.container,
          styles.permissionContainer,
          { backgroundColor: theme.backgroundRoot, paddingTop: insets.top },
        ]}
      >
        <View style={styles.permissionContent}>
          <Feather name="camera-off" size={64} color={theme.textSecondary} />
          <ThemedText type="h3" style={styles.permissionTitle}>
            Camera Access Required
          </ThemedText>
          <ThemedText style={styles.permissionText}>
            Crime Prevention PNG needs camera access to capture photo and video evidence of incidents.
          </ThemedText>
          {permission.status === "denied" && !permission.canAskAgain ? (
            Platform.OS !== "web" ? (
              <Pressable
                style={[styles.permissionButton, { backgroundColor: Colors.light.primary }]}
                onPress={openSettings}
              >
                <ThemedText style={styles.permissionButtonText}>Open Settings</ThemedText>
              </Pressable>
            ) : null
          ) : (
            <Pressable
              style={[styles.permissionButton, { backgroundColor: Colors.light.primary }]}
              onPress={requestPermission}
            >
              <ThemedText style={styles.permissionButtonText}>Enable Camera</ThemedText>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  const ModeSelector = () => (
    <View style={styles.modeSelector}>
      {(["photo", "video", "audio"] as CaptureMode[]).map((m) => (
        <Pressable
          key={m}
          style={[styles.modeButton, mode === m && styles.modeButtonActive]}
          onPress={() => {
            if (isRecording) return;
            setMode(m);
          }}
        >
          <ThemedText
            style={[
              styles.modeButtonText,
              mode === m && styles.modeButtonTextActive,
            ]}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );

  if (mode === "audio") {
    return (
      <View style={[styles.container, { backgroundColor: "#0a0a0f" }]}>
        <View style={[styles.audioOverlay, { paddingTop: insets.top + Spacing.lg }]}>
          <View style={styles.topControls}>
            <View style={styles.controlButton} />
            {isRecording ? (
              <View style={styles.recordingTimer}>
                <View style={styles.recordingDot} />
                <ThemedText style={styles.recordingText}>
                  {formatDuration(recordingDuration)}
                </ThemedText>
              </View>
            ) : null}
            <View style={styles.controlButton} />
          </View>

          <ModeSelector />
        </View>

        <View style={styles.audioCenter}>
          <View style={styles.waveformContainer}>
            {waveBarStyles.map((animStyle, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.waveBar,
                  animStyle,
                  isRecording && { backgroundColor: Colors.light.accent },
                ]}
              />
            ))}
          </View>

          {!isRecording ? (
            <View style={styles.audioIdleIcon}>
              <Feather name="mic" size={48} color="rgba(255,255,255,0.25)" />
              <ThemedText style={styles.audioIdleText}>
                Tap record to capture audio
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 100 }]}>
          <Pressable
            style={styles.galleryThumbnail}
            onPress={() => navigation.navigate("MainTabs", { screen: "EvidenceTab" } as any)}
          >
            <View style={styles.emptyThumbnail}>
              <Feather name="list" size={24} color="#FFF" />
            </View>
          </Pressable>

          <Pressable style={styles.captureButtonOuter} onPress={handleCapture}>
            <Animated.View
              style={[
                styles.captureButtonInner,
                isRecording && styles.captureButtonRecording,
                isRecording && pulseStyle,
              ]}
            >
              {isRecording ? (
                <View style={styles.stopIcon} />
              ) : (
                <Feather name="mic" size={28} color="#111" />
              )}
            </Animated.View>
          </Pressable>

          <View style={styles.placeholderButton} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
      >
        <View style={[styles.overlay, { paddingTop: insets.top + Spacing.lg }]}>
          <View style={styles.topControls}>
            <Pressable
              style={[styles.controlButton, Shadows.small]}
              onPress={toggleFlash}
            >
              <Feather
                name={flash === "on" ? "zap" : "zap-off"}
                size={24}
                color="#FFF"
              />
            </Pressable>

            {isRecording ? (
              <View style={styles.recordingTimer}>
                <View style={styles.recordingDot} />
                <ThemedText style={styles.recordingText}>
                  {formatDuration(recordingDuration)}
                </ThemedText>
              </View>
            ) : null}

            <Pressable style={[styles.controlButton, Shadows.small]} onPress={toggleFacing}>
              <Feather name="refresh-cw" size={24} color="#FFF" />
            </Pressable>
          </View>

          <ModeSelector />
        </View>

        <View
          style={[
            styles.bottomControls,
            { paddingBottom: insets.bottom + 100 },
          ]}
        >
          <Pressable
            style={styles.galleryThumbnail}
            onPress={() => navigation.navigate("MainTabs", { screen: "EvidenceTab" } as any)}
          >
            {lastCapturedUri ? (
              <Image
                source={{ uri: lastCapturedUri }}
                style={styles.thumbnailImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.emptyThumbnail}>
                <Feather name="image" size={24} color="#FFF" />
              </View>
            )}
          </Pressable>

          <Pressable
            style={styles.captureButtonOuter}
            onPress={handleCapture}
            disabled={isCapturing}
          >
            <Animated.View
              style={[
                styles.captureButtonInner,
                mode === "video" && isRecording && styles.captureButtonRecording,
                mode === "video" && isRecording && pulseStyle,
              ]}
            >
              {isCapturing && mode === "photo" ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : mode === "video" && isRecording ? (
                <View style={styles.stopIcon} />
              ) : null}
            </Animated.View>
          </Pressable>

          <View style={styles.placeholderButton} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  permissionContent: {
    alignItems: "center",
    maxWidth: 300,
  },
  permissionTitle: {
    marginTop: Spacing.xl,
    textAlign: "center",
  },
  permissionText: {
    marginTop: Spacing.md,
    textAlign: "center",
    opacity: 0.7,
  },
  permissionButton: {
    marginTop: Spacing["2xl"],
    paddingHorizontal: Spacing["3xl"],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  permissionButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
  },
  audioOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  recordingTimer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.accent,
    marginRight: Spacing.sm,
  },
  recordingText: {
    color: "#FFF",
    fontWeight: "600",
  },
  modeSelector: {
    flexDirection: "row",
    alignSelf: "center",
    marginTop: Spacing.xl,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: BorderRadius.full,
    padding: 4,
  },
  modeButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  modeButtonActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  modeButtonText: {
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  modeButtonTextActive: {
    color: "#FFF",
  },
  audioCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 80,
  },
  waveBar: {
    width: 5,
    height: 80,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  audioIdleIcon: {
    alignItems: "center",
    marginTop: Spacing["2xl"],
    gap: Spacing.md,
  },
  audioIdleText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 14,
  },
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: Spacing.xl,
  },
  galleryThumbnail: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  emptyThumbnail: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  captureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  captureButtonInner: {
    width: "100%",
    height: "100%",
    borderRadius: 34,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  captureButtonRecording: {
    backgroundColor: Colors.light.accent,
  },
  stopIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: "#FFF",
  },
  placeholderButton: {
    width: 60,
    height: 60,
  },
  locationWarning: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  locationWarningText: {
    color: "#FFF",
    fontSize: 14,
  },
});
