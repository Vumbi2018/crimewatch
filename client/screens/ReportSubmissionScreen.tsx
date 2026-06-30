import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import {
  Evidence,
  getEvidenceById,
  updateEvidenceSubmissionStatus,
  getUserProfile,
  saveUserProfile,
  savePendingReportSubmission,
  generatePendingReportId,
  saveSubmittedReportReceipt,
} from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, "ReportSubmission">;

const AGENCIES = ["NCD Command Centre"];

const PRIORITY_LEVELS = ["Low", "Medium", "High"];

type NearestStation = {
  id: string;
  name: string;
  distanceKm: number;
  withinResponseRadius: boolean;
};

type ReportPayload = {
  evidenceType: Evidence["type"];
  incidentType: string | null;
  description: string | null;
  latitude: string | null;
  longitude: string | null;
  address: string | null;
  tags: string[];
  agency: string;
  priority: string;
  isAnonymous: number;
  contactPhone: string | null;
  contactEmail: string | null;
  reporterName: string | null;
  fileUrl: string | null;
};

const DEFAULT_EVIDENCE_EXTENSIONS: Record<Evidence["type"], string> = {
  photo: ".jpg",
  video: ".mp4",
  audio: ".m4a",
};

const EVIDENCE_MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  m4a: "audio/mp4",
  caf: "audio/x-caf",
  wav: "audio/wav",
  aac: "audio/aac",
  "3gp": "audio/3gpp",
};

const getEvidenceUploadMetadata = (evidence: Evidence) => {
  const uriExtension = evidence.uri
    .split("?")[0]
    .match(/\.([a-zA-Z0-9]+)$/)?.[1]
    ?.toLowerCase();
  const extension = uriExtension
    ? `.${uriExtension}`
    : DEFAULT_EVIDENCE_EXTENSIONS[evidence.type];
  const fallbackMimeType =
    evidence.type === "photo"
      ? "image/jpeg"
      : evidence.type === "video"
        ? "video/mp4"
        : "audio/mp4";

  return {
    extension,
    mimeType: uriExtension
      ? EVIDENCE_MIME_TYPES[uriExtension] || fallbackMimeType
      : fallbackMimeType,
  };
};
function getSubmitErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (
    message.includes("Network request failed") ||
    message.includes("Failed to fetch") ||
    message.includes("NetworkError")
  ) {
    return "We could not reach the reporting server. The report has been saved on this device so it can be retried when the connection is working.";
  }

  if (message.startsWith("413:")) {
    return "The evidence file is too large to upload. Try submitting a shorter video or smaller file.";
  }

  if (message.startsWith("401:") || message.startsWith("403:")) {
    return "The reporting server rejected this request. Please check the app configuration and try again.";
  }

  return "The report could not be submitted right now. It has been saved on this device so it can be retried later.";
}

export default function ReportSubmissionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme } = useTheme();

  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);
  const [showAgencyPicker, setShowAgencyPicker] = useState(false);
  const [priority, setPriority] = useState("Medium");
  const [allowContact, setAllowContact] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [nearestStation, setNearestStation] = useState<NearestStation | null>(
    null,
  );

  useEffect(() => {
    loadEvidence();
  }, [route.params.evidenceId]);

  const loadEvidence = async () => {
    try {
      const data = await getEvidenceById(route.params.evidenceId);
      setEvidence(data);
      if (data?.latitude && data.longitude) {
        const url = new URL("/api/police-stations/nearest", getApiUrl());
        url.searchParams.set("latitude", String(data.latitude));
        url.searchParams.set("longitude", String(data.longitude));
        const response = await fetch(url.toString());
        if (response.ok) {
          const station = (await response.json()) as NearestStation | null;
          setNearestStation(station);
          if (station) setSelectedAgency("NCD Command Centre");
        }
      }
    } catch (error) {
      console.error("Error loading evidence:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const uploadEvidenceFile = async (
    evidence: Evidence,
  ): Promise<string | null> => {
    try {
      const { extension, mimeType } = getEvidenceUploadMetadata(evidence);
      const filename = `evidence_${Date.now()}${extension}`;

      const formData = new FormData();
      formData.append("file", {
        uri: evidence.uri,
        name: filename,
        type: mimeType,
      } as any);

      const uploadUrl = new URL("/api/upload", getApiUrl()).toString();
      const res = await fetch(uploadUrl, { method: "POST", body: formData });
      if (!res.ok) {
        throw new Error(`Upload failed with status ${res.status}`);
      }
      const data = await res.json();
      return data.fileUrl || null;
    } catch (err) {
      console.error("File upload failed:", err);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!selectedAgency) {
      Alert.alert("Required", "Please select an agency to submit to.");
      return;
    }

    if (allowContact && !contactPhone && !contactEmail) {
      Alert.alert(
        "Required",
        "Please provide contact information or disable contact preference.",
      );
      return;
    }

    setIsSubmitting(true);

    let reportPayload: ReportPayload | null = null;

    try {
      if (evidence) {
        const profile = await getUserProfile();
        const fileUrl = await uploadEvidenceFile(evidence);
        if (!fileUrl) {
          throw new Error("Evidence file upload failed.");
        }

        reportPayload = {
          evidenceType: evidence.type,
          incidentType: evidence.incidentType || null,
          description: evidence.description || null,
          latitude: evidence.latitude ? String(evidence.latitude) : null,
          longitude: evidence.longitude ? String(evidence.longitude) : null,
          address: evidence.address || null,
          tags: evidence.tags || [],
          agency: selectedAgency,
          priority,
          isAnonymous: isAnonymous ? 1 : 0,
          contactPhone: allowContact ? contactPhone || null : null,
          contactEmail: allowContact ? contactEmail || null : null,
          reporterName: isAnonymous ? null : profile.displayName,
          fileUrl: fileUrl || null,
        };

        const response = await apiRequest(
          "POST",
          "/api/reports",
          reportPayload,
        );
        const submittedReport = (await response.json().catch(() => null)) as {
          referenceNumber?: string;
        } | null;

        await updateEvidenceSubmissionStatus(evidence.id, "sent");
        await saveSubmittedReportReceipt({
          id: submittedReport?.referenceNumber || evidence.id,
          evidenceId: evidence.id,
          referenceNumber: submittedReport?.referenceNumber || null,
          agency: selectedAgency,
          priority,
          status: "submitted",
          submittedAt: Date.now(),
        });
        await saveUserProfile({
          totalSubmissions: profile.totalSubmissions + 1,
        });

        const referenceLine = submittedReport?.referenceNumber
          ? `\n\nReference: ${submittedReport.referenceNumber}`
          : "";

        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );

        Alert.alert(
          "Report Submitted",
          `Your evidence has been securely submitted to the authorities.${referenceLine}\n\nYou may be contacted for follow-up if you opted in.`,
          [
            {
              text: "OK",
              onPress: () => navigation.popToTop(),
            },
          ],
        );
      }
    } catch (error) {
      console.error("Error submitting report:", error);

      if (evidence && reportPayload) {
        await savePendingReportSubmission({
          id: generatePendingReportId(),
          evidenceId: evidence.id,
          payload: reportPayload,
          createdAt: Date.now(),
          attempts: 0,
          lastError: error instanceof Error ? error.message : String(error),
        });
        await updateEvidenceSubmissionStatus(evidence.id, "pending");
      }

      Alert.alert("Report Saved", getSubmitErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.backgroundRoot },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!evidence) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.backgroundRoot },
        ]}
      >
        <ThemedText>Evidence not found</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View
          style={[
            styles.evidenceCard,
            { backgroundColor: theme.cardBackground },
            Shadows.small,
          ]}
        >
          {evidence.type === "audio" ? (
            <View style={[styles.evidenceThumbnail, styles.audioThumbnail]}>
              <Feather name="mic" size={36} color="rgba(255,255,255,0.5)" />
            </View>
          ) : (
            <Image
              source={{ uri: evidence.uri }}
              style={styles.evidenceThumbnail}
              contentFit="cover"
            />
          )}
          <View style={styles.evidenceInfo}>
            <View style={styles.typeBadge}>
              <Feather
                name={
                  evidence.type === "photo"
                    ? "image"
                    : evidence.type === "video"
                      ? "video"
                      : "mic"
                }
                size={14}
                color="#FFF"
              />
              <ThemedText style={styles.typeText}>
                {evidence.type.charAt(0).toUpperCase() + evidence.type.slice(1)}
              </ThemedText>
            </View>
            <ThemedText type="small" style={{ marginTop: Spacing.xs }}>
              {formatDateTime(evidence.timestamp)}
            </ThemedText>
            {evidence.incidentType ? (
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {evidence.incidentType}
              </ThemedText>
            ) : null}
            {evidence.address ? (
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={12} color={theme.textSecondary} />
                <ThemedText
                  type="caption"
                  style={{ color: theme.textSecondary }}
                  numberOfLines={1}
                >
                  {evidence.address}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>

        <View
          style={[styles.section, { backgroundColor: theme.cardBackground }]}
        >
          <View style={styles.reviewHeader}>
            <Feather name="clipboard" size={18} color={theme.primary} />
            <ThemedText style={styles.reviewTitle}>
              Review Before Sending
            </ThemedText>
          </View>
          <View style={styles.reviewGrid}>
            <View style={styles.reviewItem}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Incident
              </ThemedText>
              <ThemedText style={styles.reviewValue}>
                {evidence.incidentType || "Not specified"}
              </ThemedText>
            </View>
            <View style={styles.reviewItem}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                GPS
              </ThemedText>
              <ThemedText style={styles.reviewValue}>
                {evidence.latitude && evidence.longitude
                  ? "Captured"
                  : "Not available"}
              </ThemedText>
            </View>
            <View style={styles.reviewItemWide}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Description
              </ThemedText>
              <ThemedText style={styles.reviewValue} numberOfLines={3}>
                {evidence.description || "No description added"}
              </ThemedText>
            </View>
            <View style={styles.reviewItemWide}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Location
              </ThemedText>
              <ThemedText style={styles.reviewValue} numberOfLines={2}>
                {evidence.address || "No address captured"}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.safetyNotice}>
          <Feather name="shield" size={18} color={Colors.light.warning} />
          <ThemedText type="caption" style={styles.safetyText}>
            Stay safe. Do not record or submit evidence while it puts you at
            risk. Anonymous reports do not include your name or contact details.
          </ThemedText>
        </View>

        {nearestStation ? (
          <View style={styles.dispatchNotice}>
            <Feather name="radio" size={18} color={Colors.light.success} />
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.dispatchTitle}>
                Nearest police command detected
              </ThemedText>
              <ThemedText type="caption" style={styles.dispatchText}>
                {nearestStation.name} is about {nearestStation.distanceKm} km
                away and will be notified immediately when you submit.
              </ThemedText>
            </View>
          </View>
        ) : null}

        <View
          style={[styles.section, { backgroundColor: theme.cardBackground }]}
        >
          <ThemedText type="small" style={styles.sectionLabel}>
            Submit To
          </ThemedText>
          <Pressable
            style={[styles.pickerButton, { borderColor: theme.border }]}
            onPress={() => setShowAgencyPicker(!showAgencyPicker)}
          >
            <View style={styles.agencyButtonContent}>
              <Feather name="shield" size={18} color={theme.textSecondary} />
              <ThemedText
                style={selectedAgency ? {} : { color: theme.textSecondary }}
              >
                {selectedAgency || "Select agency"}
              </ThemedText>
            </View>
            <Feather
              name={showAgencyPicker ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.textSecondary}
            />
          </Pressable>
          {showAgencyPicker ? (
            <View style={styles.pickerOptions}>
              {AGENCIES.map((agency) => (
                <Pressable
                  key={agency}
                  style={[
                    styles.pickerOption,
                    selectedAgency === agency && {
                      backgroundColor: theme.primary + "20",
                    },
                  ]}
                  onPress={() => {
                    setSelectedAgency(agency);
                    setShowAgencyPicker(false);
                    Haptics.selectionAsync();
                  }}
                >
                  <ThemedText
                    style={
                      selectedAgency === agency
                        ? { color: theme.primary, fontWeight: "600" }
                        : {}
                    }
                  >
                    {agency}
                  </ThemedText>
                  {selectedAgency === agency ? (
                    <Feather name="check" size={18} color={theme.primary} />
                  ) : null}
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View
          style={[styles.section, { backgroundColor: theme.cardBackground }]}
        >
          <ThemedText type="small" style={styles.sectionLabel}>
            Priority Level
          </ThemedText>
          <View style={styles.priorityContainer}>
            {PRIORITY_LEVELS.map((level) => (
              <Pressable
                key={level}
                style={[
                  styles.priorityButton,
                  {
                    backgroundColor:
                      priority === level
                        ? level === "High"
                          ? Colors.light.accent
                          : level === "Medium"
                            ? Colors.light.warning
                            : Colors.light.success
                        : theme.backgroundSecondary,
                  },
                ]}
                onPress={() => {
                  setPriority(level);
                  Haptics.selectionAsync();
                }}
              >
                <ThemedText
                  style={[
                    styles.priorityText,
                    priority === level && { color: "#FFF" },
                  ]}
                >
                  {level}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View
          style={[styles.section, { backgroundColor: theme.cardBackground }]}
        >
          <View style={styles.switchRow}>
            <View style={styles.switchContent}>
              <Feather name="user-x" size={20} color={theme.textSecondary} />
              <View style={styles.switchTextContainer}>
                <ThemedText style={styles.switchLabel}>
                  Submit Anonymously
                </ThemedText>
                <ThemedText
                  type="caption"
                  style={{ color: theme.textSecondary }}
                >
                  Your identity will not be shared
                </ThemedText>
              </View>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={(value) => {
                setIsAnonymous(value);
                if (value) {
                  setAllowContact(false);
                }
                Haptics.selectionAsync();
              }}
              trackColor={{ true: Colors.light.primary }}
            />
          </View>
        </View>

        {!isAnonymous ? (
          <View
            style={[styles.section, { backgroundColor: theme.cardBackground }]}
          >
            <View style={styles.switchRow}>
              <View style={styles.switchContent}>
                <Feather name="phone" size={20} color={theme.textSecondary} />
                <View style={styles.switchTextContainer}>
                  <ThemedText style={styles.switchLabel}>
                    Allow Authorities to Contact Me
                  </ThemedText>
                  <ThemedText
                    type="caption"
                    style={{ color: theme.textSecondary }}
                  >
                    For follow-up questions about your report
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={allowContact}
                onValueChange={(value) => {
                  setAllowContact(value);
                  Haptics.selectionAsync();
                }}
                trackColor={{ true: Colors.light.primary }}
              />
            </View>
            {allowContact ? (
              <View style={styles.contactInputs}>
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.text, borderColor: theme.border },
                  ]}
                  placeholder="Phone number (optional)"
                  placeholderTextColor={theme.textSecondary}
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.text, borderColor: theme.border },
                  ]}
                  placeholder="Email address (optional)"
                  placeholderTextColor={theme.textSecondary}
                  value={contactEmail}
                  onChangeText={setContactEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.disclaimer}>
          <Feather name="info" size={16} color={theme.textSecondary} />
          <ThemedText
            type="caption"
            style={{ color: theme.textSecondary, flex: 1 }}
          >
            By submitting this report, you confirm that the information and
            evidence provided is accurate to the best of your knowledge. False
            reports may be subject to legal action.
          </ThemedText>
        </View>

        <Button
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={{
            marginTop: Spacing.xl,
            backgroundColor: Colors.light.primary,
          }}
        >
          {isSubmitting ? "Submitting..." : "Submit Report"}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: Spacing.lg,
  },
  evidenceCard: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  evidenceThumbnail: {
    width: 100,
    height: 100,
  },
  audioThumbnail: {
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
  },
  evidenceInfo: {
    flex: 1,
    padding: Spacing.md,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: Spacing.xs,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  typeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  section: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  sectionLabel: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  reviewTitle: {
    fontWeight: "700",
  },
  reviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  reviewItem: {
    flexBasis: "48%",
    minHeight: 64,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(100,116,139,0.10)",
  },
  reviewItemWide: {
    width: "100%",
    minHeight: 64,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(100,116,139,0.10)",
  },
  reviewValue: {
    marginTop: Spacing.xs,
    fontWeight: "600",
  },
  safetyNotice: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(245,158,11,0.12)",
  },
  safetyText: {
    flex: 1,
    color: Colors.light.textSecondary,
  },
  dispatchNotice: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(5,150,105,0.12)",
  },
  dispatchTitle: {
    fontWeight: "700",
  },
  dispatchText: {
    marginTop: Spacing.xs,
    color: Colors.light.textSecondary,
  },
  pickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
  },
  agencyButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  pickerOptions: {
    marginTop: Spacing.sm,
  },
  pickerOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  priorityContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  priorityText: {
    fontWeight: "600",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchLabel: {
    fontWeight: "500",
  },
  contactInputs: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    height: 48,
    fontSize: 16,
  },
  disclaimer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    padding: Spacing.md,
    alignItems: "flex-start",
  },
});
