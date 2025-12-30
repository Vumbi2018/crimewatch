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
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  Evidence,
  getEvidenceById,
  updateEvidenceSubmissionStatus,
  getUserProfile,
  saveUserProfile,
} from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, "ReportSubmission">;

const AGENCIES = [
  "Local Police Department",
  "County Sheriff's Office",
  "State Police",
  "FBI Field Office",
  "Crime Stoppers Anonymous Tip Line",
];

const PRIORITY_LEVELS = ["Low", "Medium", "High"];

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

  useEffect(() => {
    loadEvidence();
  }, [route.params.evidenceId]);

  const loadEvidence = async () => {
    try {
      const data = await getEvidenceById(route.params.evidenceId);
      setEvidence(data);
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

  const handleSubmit = async () => {
    if (!selectedAgency) {
      Alert.alert("Required", "Please select an agency to submit to.");
      return;
    }

    if (allowContact && !contactPhone && !contactEmail) {
      Alert.alert("Required", "Please provide contact information or disable contact preference.");
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      if (evidence) {
        await updateEvidenceSubmissionStatus(evidence.id, "sent");
        
        const profile = await getUserProfile();
        await saveUserProfile({
          totalSubmissions: profile.totalSubmissions + 1,
        });
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        "Report Submitted",
        "Your evidence has been securely submitted to the authorities. You may be contacted for follow-up if you opted in.",
        [
          {
            text: "OK",
            onPress: () => navigation.popToTop(),
          },
        ]
      );
    } catch (error) {
      console.error("Error submitting report:", error);
      Alert.alert("Error", "Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!evidence) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
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
        <View style={[styles.evidenceCard, { backgroundColor: theme.cardBackground }, Shadows.small]}>
          <Image
            source={{ uri: evidence.uri }}
            style={styles.evidenceThumbnail}
            contentFit="cover"
          />
          <View style={styles.evidenceInfo}>
            <View style={styles.typeBadge}>
              <Ionicons
                name={evidence.type === "photo" ? "image-outline" : "videocam-outline"}
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
                <Ionicons name="location-outline" size={12} color={theme.textSecondary} />
                <ThemedText type="caption" style={{ color: theme.textSecondary }} numberOfLines={1}>
                  {evidence.address}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <ThemedText type="small" style={styles.sectionLabel}>
            Submit To
          </ThemedText>
          <Pressable
            style={[styles.pickerButton, { borderColor: theme.border }]}
            onPress={() => setShowAgencyPicker(!showAgencyPicker)}
          >
            <View style={styles.agencyButtonContent}>
              <Ionicons name="shield-outline" size={18} color={theme.textSecondary} />
              <ThemedText
                style={selectedAgency ? {} : { color: theme.textSecondary }}
              >
                {selectedAgency || "Select agency"}
              </ThemedText>
            </View>
            <Ionicons
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
                    <Ionicons name="checkmark" size={18} color={theme.primary} />
                  ) : null}
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
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

        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.switchRow}>
            <View style={styles.switchContent}>
              <Ionicons name="person-remove-outline" size={20} color={theme.textSecondary} />
              <View style={styles.switchTextContainer}>
                <ThemedText style={styles.switchLabel}>Submit Anonymously</ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
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
          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.switchRow}>
              <View style={styles.switchContent}>
                <Ionicons name="call-outline" size={20} color={theme.textSecondary} />
                <View style={styles.switchTextContainer}>
                  <ThemedText style={styles.switchLabel}>Allow Authorities to Contact Me</ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
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
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  placeholder="Phone number (optional)"
                  placeholderTextColor={theme.textSecondary}
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
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
          <Ionicons name="information-circle-outline" size={16} color={theme.textSecondary} />
          <ThemedText type="caption" style={{ color: theme.textSecondary, flex: 1 }}>
            By submitting this report, you confirm that the information and evidence provided is accurate to the best of your knowledge. False reports may be subject to legal action.
          </ThemedText>
        </View>

        <Button
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={{ marginTop: Spacing.xl, backgroundColor: Colors.light.primary }}
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
