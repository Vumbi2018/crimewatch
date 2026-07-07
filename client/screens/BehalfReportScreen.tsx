import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useTheme } from "@/hooks/useTheme";
import { apiUrl } from "@/lib/query-client";
import { getUserProfile, saveUserProfile } from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Attachment {
  uri: string;
  name: string;
  type: string;
  size: number;
}

export default function BehalfReportScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  // Victim Details
  const [victimName, setVictimName] = useState("");
  const [victimPhone, setVictimPhone] = useState("");
  const [relationship, setRelationship] = useState("Family");
  const [consent, setConsent] = useState(false);

  // Incident Details
  const [incidentType, setIncidentType] = useState("");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState("");

  // Validation Errors
  const [victimNameError, setVictimNameError] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [incidentTypeError, setIncidentTypeError] = useState(false);
  const [descriptionError, setDescriptionError] = useState(false);

  const scrollViewRef = React.useRef<any>(null);

  const relationships = ["Family", "Friend", "Neighbor", "Colleague", "Other"];

  // Request location on mount
  useEffect(() => {
    fetchLocation();
  }, []);

  const fetchLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationText("Location permission denied. Enter location manually.");
        setIsLocating(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      let lat = loc.coords.latitude;
      let lon = loc.coords.longitude;

      // Override default emulator Googleplex coordinates with Port Moresby, PNG for localized testing in DEV mode.
      if (
        __DEV__ &&
        Math.abs(lat - 37.422) < 0.01 &&
        Math.abs(lon - -122.0841) < 0.01
      ) {
        lat = -9.4438;
        lon = 147.1803;
      }

      setLatitude(lat);
      setLongitude(lon);

      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lon,
      });

      if (geocode) {
        const address = [geocode.street, geocode.city, geocode.region]
          .filter(Boolean)
          .join(", ");
        setLocationText(address);
      } else {
        setLocationText(
          `${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}`,
        );
      }
    } catch (err) {
      console.error("Location lookup failed:", err);
      setLocationText(
        "Could not determine location automatically. Enter manually.",
      );
    } finally {
      setIsLocating(false);
    }
  };

  const handlePickMedia = async () => {
    if (attachments.length >= 10) {
      Alert.alert(
        "Limit Reached",
        "You can upload a maximum of 10 attachments.",
      );
      return;
    }

    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need media library permissions to select files.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const remainingSlots = 10 - attachments.length;
        const selectedAssets = result.assets.slice(0, remainingSlots);

        if (result.assets.length > remainingSlots) {
          Alert.alert(
            "Limit Reached",
            `Only the first ${remainingSlots} selected file(s) were added because the limit is 10.`,
          );
        }

        const newAttachments: Attachment[] = [];
        let tooLargeCount = 0;

        for (const asset of selectedAssets) {
          const fileSize = asset.fileSize || 0;
          const name =
            asset.fileName ||
            `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${asset.type === "video" ? "mp4" : "jpg"}`;
          const mimeType = asset.type === "video" ? "video/mp4" : "image/jpeg";

          if (fileSize > 10 * 1024 * 1024) {
            tooLargeCount++;
            continue;
          }

          newAttachments.push({
            uri: asset.uri,
            name,
            type: mimeType,
            size: fileSize,
          });
        }

        if (tooLargeCount > 0) {
          Alert.alert(
            "Files Too Large",
            `${tooLargeCount} file(s) were skipped because they exceed the 10MB limit.`,
          );
        }

        if (newAttachments.length > 0) {
          setAttachments([...attachments, ...newAttachments]);
        }
      }
    } catch (err) {
      console.error("Media selection failed:", err);
    }
  };

  const handlePickDocument = async () => {
    if (attachments.length >= 10) {
      Alert.alert(
        "Limit Reached",
        "You can upload a maximum of 10 attachments.",
      );
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const remainingSlots = 10 - attachments.length;
        const selectedAssets = result.assets.slice(0, remainingSlots);

        if (result.assets.length > remainingSlots) {
          Alert.alert(
            "Limit Reached",
            `Only the first ${remainingSlots} selected document(s) were added because the limit is 10.`,
          );
        }

        const newAttachments: Attachment[] = [];
        let tooLargeCount = 0;

        for (const asset of selectedAssets) {
          const size = asset.size || 0;

          if (size > 10 * 1024 * 1024) {
            tooLargeCount++;
            continue;
          }

          newAttachments.push({
            uri: asset.uri,
            name: asset.name,
            type: asset.mimeType || "application/octet-stream",
            size,
          });
        }

        if (tooLargeCount > 0) {
          Alert.alert(
            "Files Too Large",
            `${tooLargeCount} document(s) were skipped because they exceed the 10MB limit.`,
          );
        }

        if (newAttachments.length > 0) {
          setAttachments([...attachments, ...newAttachments]);
        }
      }
    } catch (err) {
      console.error("Document selection failed:", err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "Unknown size";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const getSubmissionErrorMessage = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("413") || message.includes("Payload Too Large")) {
      return "The evidence file is too large for the server to accept. Try a shorter video, smaller audio file, or submit fewer files at once.";
    }
    if (
      message.includes("502") ||
      message.includes("503") ||
      message.includes("504") ||
      message.toLowerCase().includes("timeout")
    ) {
      return "The server took too long to accept the upload. Try again on a stronger connection or submit a shorter recording.";
    }
    if (
      message.includes("Network request failed") ||
      message.includes("Failed to fetch") ||
      message.includes("NetworkError")
    ) {
      return "We could not reach the reporting server. Check your internet connection and try again.";
    }
    return "Could not submit report. Check your network connection and try again.";
  };

  const uploadFile = async (file: Attachment): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    const uploadUrl = apiUrl("/api/upload");
    const res = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Upload failed with status ${res.status}${body ? `: ${body}` : ""}`,
      );
    }
    const data = await res.json();
    return data.fileUrl || null;
  };

  const executeSubmission = async () => {
    setIsSubmitting(true);
    setSubmitProgress("Preparing report details...");

    try {
      const profile = await getUserProfile();
      const uploadedUrls: string[] = [];
      const attachmentsPayload: any[] = [];

      for (let i = 0; i < attachments.length; i++) {
        const att = attachments[i];
        setSubmitProgress(
          `Uploading attachment ${i + 1} of ${attachments.length}...`,
        );
        const fileUrl = await uploadFile(att);
        if (!fileUrl) {
          throw new Error(`Upload did not return a file URL for ${att.name}.`);
        }
        uploadedUrls.push(fileUrl);
        attachmentsPayload.push({
          fileUrl,
          fileName: att.name,
          fileType: att.type.startsWith("image/")
            ? "photo"
            : att.type.startsWith("video/")
              ? "video"
              : "document",
          mimeType: att.type,
          fileSize: att.size,
          evidenceSource: "uploaded",
        });
      }

      setSubmitProgress("Submitting report to police...");

      const payload = {
        isBehalfReport: true,
        behalfName: victimName,
        behalfContact: victimPhone || null,
        behalfRelationship: relationship,
        behalfConsent: true,
        behalfSource: "citizen",
        evidenceType:
          attachments.length > 0
            ? attachments[0].type.startsWith("image")
              ? "photo"
              : attachments[0].type.startsWith("video")
                ? "video"
                : "document"
            : "witness_statement",
        fileUrl: uploadedUrls.length > 0 ? uploadedUrls[0] : null,
        attachments: attachmentsPayload,
        incidentType,
        description,
        latitude: latitude ? String(latitude) : null,
        longitude: longitude ? String(longitude) : null,
        address: locationText || null,
        priority: "Medium",
        isAnonymous: 0,
        reporterProfileId: profile.id,
        reporterDisplayName: profile.displayName,
        reporterBadgeNumber: profile.badgeNumber,
        reporterAvatarType: profile.avatarType,
        reportSourceType: "ON_BEHALF_OF_SOMEONE",
        confirmationTextVersion:
          "Confirm Report Accuracy: Please confirm that the information you have provided is accurate to the best of your knowledge. False or misleading reports may affect response and investigation processes. Do you want to submit this report?",
        confirmationAcknowledgedAt: new Date().toISOString(),
      };

      const res = await fetch(apiUrl("/api/reports"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "No error text");
        console.error(
          "Submission failed with status:",
          res.status,
          "body:",
          errorText,
        );
        throw new Error(
          `Failed to submit behalf report. Status: ${res.status}. Error: ${errorText}`,
        );
      }

      const result = await res.json();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Increment submissions count
      await saveUserProfile({
        totalSubmissions: profile.totalSubmissions + 1,
      });

      Alert.alert(
        "Report Submitted Successfully",
        `Incident report filed on behalf of ${victimName}.\n\nReference Code: ${result.referenceNumber || result.id.slice(0, 8).toUpperCase()}`,
        [{ text: "OK", onPress: () => navigation.popToTop() }],
      );
    } catch (err) {
      console.error("Submission failed:", err);
      Alert.alert("Submission Failed", getSubmissionErrorMessage(err));
    } finally {
      setIsSubmitting(false);
      setSubmitProgress("");
    }
  };

  const handleSubmit = async () => {
    let hasError = false;

    if (!victimName.trim()) {
      setVictimNameError(true);
      hasError = true;
    } else {
      setVictimNameError(false);
    }

    if (!consent) {
      setConsentError(true);
      hasError = true;
    } else {
      setConsentError(false);
    }

    if (!incidentType.trim()) {
      setIncidentTypeError(true);
      hasError = true;
    } else {
      setIncidentTypeError(false);
    }

    if (!description.trim()) {
      setDescriptionError(true);
      hasError = true;
    } else {
      setDescriptionError(false);
    }

    if (hasError) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (scrollViewRef.current) {
        if (scrollViewRef.current.scrollToPosition) {
          scrollViewRef.current.scrollToPosition(0, 0, true);
        } else if (scrollViewRef.current.scrollTo) {
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
        }
      }
      Alert.alert(
        "Required Fields",
        "Please fill in all mandatory fields highlighted in red.",
      );
      return;
    }

    Alert.alert(
      "Confirm Report Accuracy",
      "Please confirm that the information you have provided is accurate to the best of your knowledge. False or misleading reports may affect response and investigation processes. Do you want to submit this report?",
      [
        {
          text: "Cancel / Review Again",
          style: "cancel",
        },
        {
          text: "Confirm and Submit",
          style: "default",
          onPress: executeSubmission,
        },
      ],
    );
  };

  return (
    <KeyboardAwareScrollViewCompat
      ref={scrollViewRef}
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <ThemedText type="h1" style={styles.title}>
          Report on Behalf of Someone
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Use this form to submit reports for victims, friends, or family
          members.
        </ThemedText>
      </View>

      {/* Victim Info Section */}
      <View
        style={[
          styles.section,
          { backgroundColor: theme.cardBackground, borderColor: theme.border },
        ]}
      >
        <ThemedText type="h3" style={styles.sectionTitle}>
          1. Victim/Person Details
        </ThemedText>

        <View style={styles.field}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <ThemedText style={styles.label}>Full Name</ThemedText>
            <ThemedText style={{ color: "#ef4444", fontWeight: "bold" }}>
              {" "}
              *
            </ThemedText>
          </View>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: victimNameError ? "#ef4444" : theme.border,
                backgroundColor: theme.backgroundSecondary,
              },
            ]}
            value={victimName}
            onChangeText={(text) => {
              setVictimName(text);
              if (victimNameError && text.trim()) setVictimNameError(false);
            }}
            placeholder="Enter victim's full name"
            placeholderTextColor={theme.textSecondary}
          />
          {victimNameError ? (
            <ThemedText style={{ color: "#ef4444", fontSize: 12 }}>
              {"Victim's name is required."}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Contact Phone Number</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.backgroundSecondary,
              },
            ]}
            value={victimPhone}
            onChangeText={setVictimPhone}
            placeholder="e.g. +675 7000 0000"
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>
            Your Relationship to Them
          </ThemedText>
          <View style={styles.pillContainer}>
            {relationships.map((rel) => {
              const active = relationship === rel;
              return (
                <Pressable
                  key={rel}
                  style={[
                    styles.pill,
                    { borderColor: theme.border },
                    active && {
                      backgroundColor: theme.primary,
                      borderColor: theme.primary,
                    },
                  ]}
                  onPress={() => setRelationship(rel)}
                >
                  <ThemedText
                    style={[
                      styles.pillText,
                      active && { color: "#ffffff", fontWeight: "bold" },
                    ]}
                  >
                    {rel}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View
          style={[
            styles.field,
            styles.switchField,
            consentError && {
              borderWidth: 1,
              borderColor: "#ef4444",
              borderRadius: 8,
              padding: 8,
            },
          ]}
        >
          <View style={{ flex: 1, paddingRight: Spacing.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <ThemedText style={styles.consentLabel}>
                Consent Obtained
              </ThemedText>
              <ThemedText style={{ color: "#ef4444", fontWeight: "bold" }}>
                {" "}
                *
              </ThemedText>
            </View>
            <ThemedText style={styles.consentSub}>
              I confirm the victim gave permission to file this report.
            </ThemedText>
          </View>
          <Switch
            value={consent}
            onValueChange={(val) => {
              setConsent(val);
              if (consentError && val) setConsentError(false);
            }}
            trackColor={{ true: theme.primary }}
          />
        </View>
        {consentError ? (
          <ThemedText style={{ color: "#ef4444", fontSize: 12 }}>
            You must confirm you have obtained consent.
          </ThemedText>
        ) : null}
      </View>

      {/* Incident Details Section */}
      <View
        style={[
          styles.section,
          { backgroundColor: theme.cardBackground, borderColor: theme.border },
        ]}
      >
        <ThemedText type="h3" style={styles.sectionTitle}>
          2. Incident Details
        </ThemedText>

        <View style={styles.field}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <ThemedText style={styles.label}>Incident Type</ThemedText>
            <ThemedText style={{ color: "#ef4444", fontWeight: "bold" }}>
              {" "}
              *
            </ThemedText>
          </View>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: incidentTypeError ? "#ef4444" : theme.border,
                backgroundColor: theme.backgroundSecondary,
              },
            ]}
            value={incidentType}
            onChangeText={(text) => {
              setIncidentType(text);
              if (incidentTypeError && text.trim()) setIncidentTypeError(false);
            }}
            placeholder="e.g. Theft, Assault, Property Damage"
            placeholderTextColor={theme.textSecondary}
          />
          {incidentTypeError ? (
            <ThemedText style={{ color: "#ef4444", fontSize: 12 }}>
              Incident type is required.
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.field}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <ThemedText style={styles.label}>
              Description of Incident
            </ThemedText>
            <ThemedText style={{ color: "#ef4444", fontWeight: "bold" }}>
              {" "}
              *
            </ThemedText>
          </View>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                color: theme.text,
                borderColor: descriptionError ? "#ef4444" : theme.border,
                backgroundColor: theme.backgroundSecondary,
              },
            ]}
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (descriptionError && text.trim()) setDescriptionError(false);
            }}
            placeholder="Describe what happened as detailed as possible..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {descriptionError ? (
            <ThemedText style={{ color: "#ef4444", fontSize: 12 }}>
              Description of the incident is required.
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.field}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <ThemedText style={styles.label}>Incident Location</ThemedText>
            {isLocating && (
              <ActivityIndicator size="small" color={theme.primary} />
            )}
          </View>
          <View style={styles.locationContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  flex: 1,
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.backgroundSecondary,
                },
              ]}
              value={locationText}
              onChangeText={setLocationText}
              placeholder="Retrieving current location..."
              placeholderTextColor={theme.textSecondary}
            />
            <Pressable
              style={[
                styles.locationBtn,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.border,
                },
              ]}
              onPress={fetchLocation}
            >
              <Feather name="map-pin" size={18} color={theme.primary} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Evidence Attachments Section */}
      <View
        style={[
          styles.section,
          { backgroundColor: theme.cardBackground, borderColor: theme.border },
        ]}
      >
        <ThemedText type="h3" style={styles.sectionTitle}>
          3. Media Evidence (Optional)
        </ThemedText>
        <ThemedText style={styles.consentSub}>
          Select up to 10 pictures, videos, audio clips, or documents from your
          phone (Max file size: 10MB per file).
        </ThemedText>

        <ThemedText
          style={[
            styles.consentSub,
            { marginTop: 8, fontWeight: "600", color: theme.primary },
          ]}
        >
          Attachments: {attachments.length} of 10 added
        </ThemedText>

        <View style={styles.attachBtnContainer}>
          <Pressable
            style={[
              styles.attachBtn,
              {
                backgroundColor: theme.backgroundSecondary,
                borderColor: theme.border,
              },
            ]}
            onPress={handlePickMedia}
          >
            <Feather name="image" size={22} color={theme.primary} />
            <ThemedText style={styles.attachBtnText}>
              Pick Photo/Video
            </ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.attachBtn,
              {
                backgroundColor: theme.backgroundSecondary,
                borderColor: theme.border,
              },
            ]}
            onPress={handlePickDocument}
          >
            <Feather name="file" size={22} color={theme.primary} />
            <ThemedText style={styles.attachBtnText}>Pick Document</ThemedText>
          </Pressable>
        </View>

        {attachments.map((att, index) => (
          <View
            key={index}
            style={[
              styles.attachmentPreview,
              {
                backgroundColor: theme.backgroundSecondary,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.attachmentName} numberOfLines={1}>
                {att.name}
              </ThemedText>
              <ThemedText style={styles.attachmentSize}>
                {formatFileSize(att.size)}
              </ThemedText>
            </View>
            <Pressable
              style={styles.clearAttachment}
              onPress={() =>
                setAttachments(attachments.filter((_, i) => i !== index))
              }
            >
              <Feather name="trash-2" size={18} color={theme.accent} />
            </Pressable>
          </View>
        ))}
      </View>

      {/* Submit Button */}
      <Pressable
        style={[
          styles.submitBtn,
          {
            backgroundColor:
              consent && victimName && incidentType && description
                ? theme.primary
                : theme.border,
          },
        ]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.sm,
            }}
          >
            <ActivityIndicator size="small" color="#ffffff" />
            <ThemedText style={styles.submitBtnText}>
              {submitProgress || "Submitting..."}
            </ThemedText>
          </View>
        ) : (
          <ThemedText style={styles.submitBtnText}>
            Submit Incident Report
          </ThemedText>
        )}
      </Pressable>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 150,
    gap: Spacing.md,
  },
  header: {
    alignItems: "center",
    marginVertical: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.8,
    marginTop: 4,
    paddingHorizontal: Spacing.md,
  },
  section: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  field: {
    gap: 6,
  },
  switchField: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  consentLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  consentSub: {
    fontSize: 12,
    opacity: 0.65,
    lineHeight: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  pillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: {
    fontSize: 12,
  },
  locationContainer: {
    flexDirection: "row",
    gap: 8,
  },
  locationBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  attachBtnContainer: {
    flexDirection: "row",
    gap: 12,
  },
  attachBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },
  attachBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  attachmentPreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
  attachmentName: {
    fontSize: 13,
    fontWeight: "600",
  },
  attachmentSize: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: 2,
  },
  clearAttachment: {
    padding: 8,
  },
  submitBtn: {
    height: 54,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
