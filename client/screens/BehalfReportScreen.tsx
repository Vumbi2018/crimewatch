import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
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
import { getApiUrl } from "@/lib/query-client";

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

  // Attachment
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState("");

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

      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);

      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (geocode) {
        const address = [geocode.street, geocode.city, geocode.region]
          .filter(Boolean)
          .join(", ");
        setLocationText(address);
      } else {
        setLocationText(`${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}`);
      }
    } catch (err) {
      console.error("Location lookup failed:", err);
      setLocationText("Could not determine location automatically. Enter manually.");
    } finally {
      setIsLocating(false);
    }
  };

  const handlePickMedia = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "We need media library permissions to select files.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileSize = asset.fileSize || 0;
        const name = asset.fileName || `media_${Date.now()}.${asset.type === "video" ? "mp4" : "jpg"}`;
        const mimeType = asset.type === "video" ? "video/mp4" : "image/jpeg";

        setAttachment({
          uri: asset.uri,
          name,
          type: mimeType,
          size: fileSize,
        });
      }
    } catch (err) {
      console.error("Media selection failed:", err);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const size = asset.size || 0;
        setAttachment({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || "application/octet-stream",
          size,
        });
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

  const isFileSizeTooLarge = attachment ? attachment.size > 10 * 1024 * 1024 : false;

  const uploadFile = async (file: Attachment): Promise<string | null> => {
    setSubmitProgress("Uploading attachment evidence...");
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);

      const uploadUrl = `${getApiUrl()}/api/upload`;
      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Server rejected evidence file upload.");
      }
      const data = await res.json();
      return data.fileUrl || null;
    } catch (err) {
      console.error("Upload failed:", err);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!victimName.trim()) {
      Alert.alert("Validation Error", "Please enter the victim's full name.");
      return;
    }
    if (!consent) {
      Alert.alert("Validation Error", "You must confirm you have obtained consent to submit on their behalf.");
      return;
    }
    if (!incidentType.trim()) {
      Alert.alert("Validation Error", "Please select or type an incident type.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Validation Error", "Please describe the incident.");
      return;
    }
    if (isFileSizeTooLarge) {
      Alert.alert("Validation Error", "Selected file exceeds the 10MB limit. Please select a smaller file.");
      return;
    }

    setIsSubmitting(true);
    setSubmitProgress("Preparing report details...");

    try {
      let fileUrl = null;
      if (attachment) {
        fileUrl = await uploadFile(attachment);
        if (!fileUrl) {
          Alert.alert("Submission Failed", "Failed to upload evidence file. Please try again.");
          setIsSubmitting(false);
          return;
        }
      }

      setSubmitProgress("Submitting report to police...");

      const payload = {
        isBehalfReport: 1,
        behalfName: victimName,
        behalfContact: victimPhone || null,
        behalfRelationship: relationship,
        behalfConsent: 1,
        behalfSource: "citizen",
        evidenceType: attachment ? (attachment.type.startsWith("image") ? "photo" : attachment.type.startsWith("video") ? "video" : "document") : "witness_statement",
        fileUrl,
        incidentType,
        description,
        latitude: latitude ? String(latitude) : null,
        longitude: longitude ? String(longitude) : null,
        address: locationText || null,
        priority: "Medium",
        isAnonymous: 0,
      };

      const res = await fetch(`${getApiUrl()}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to submit behalf report.");
      }

      const result = await res.json();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        "Report Submitted Successfully",
        `Incident report filed on behalf of ${victimName}.\n\nReference Code: ${result.referenceNumber || result.id.slice(0, 8).toUpperCase()}`,
        [{ text: "OK", onPress: () => navigation.popToTop() }]
      );
    } catch (err) {
      console.error("Submission failed:", err);
      Alert.alert("Error", "Could not submit report. Check your network connection and try again.");
    } finally {
      setIsSubmitting(false);
      setSubmitProgress("");
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <ThemedText type="h1" style={styles.title}>
          Report on Behalf of Someone
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Use this form to submit reports for victims, friends, or family members.
        </ThemedText>
      </View>

      {/* Victim Info Section */}
      <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          1. Victim/Person Details
        </ThemedText>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Full Name *</ThemedText>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundSecondary }]}
            value={victimName}
            onChangeText={setVictimName}
            placeholder="Enter victim's full name"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Contact Phone Number</ThemedText>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundSecondary }]}
            value={victimPhone}
            onChangeText={setVictimPhone}
            placeholder="e.g. +675 7000 0000"
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Your Relationship to Them</ThemedText>
          <View style={styles.pillContainer}>
            {relationships.map((rel) => {
              const active = relationship === rel;
              return (
                <Pressable
                  key={rel}
                  style={[
                    styles.pill,
                    { borderColor: theme.border },
                    active && { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => setRelationship(rel)}
                >
                  <ThemedText style={[styles.pillText, active && { color: "#ffffff", fontWeight: "bold" }]}>
                    {rel}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.field, styles.switchField]}>
          <View style={{ flex: 1, paddingRight: Spacing.sm }}>
            <ThemedText style={styles.consentLabel}>Consent Obtained *</ThemedText>
            <ThemedText style={styles.consentSub}>
              I confirm the victim gave permission to file this report.
            </ThemedText>
          </View>
          <Switch value={consent} onValueChange={setConsent} trackColor={{ true: theme.primary }} />
        </View>
      </View>

      {/* Incident Details Section */}
      <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          2. Incident Details
        </ThemedText>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Incident Type *</ThemedText>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundSecondary }]}
            value={incidentType}
            onChangeText={setIncidentType}
            placeholder="e.g. Theft, Assault, Property Damage"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Description of Incident *</ThemedText>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundSecondary },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what happened as detailed as possible..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.field}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <ThemedText style={styles.label}>Incident Location</ThemedText>
            {isLocating && <ActivityIndicator size="small" color={theme.primary} />}
          </View>
          <View style={styles.locationContainer}>
            <TextInput
              style={[
                styles.input,
                { flex: 1, color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundSecondary },
              ]}
              value={locationText}
              onChangeText={setLocationText}
              placeholder="Retrieving current location..."
              placeholderTextColor={theme.textSecondary}
            />
            <Pressable
              style={[styles.locationBtn, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
              onPress={fetchLocation}
            >
              <Feather name="map-pin" size={18} color={theme.primary} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Evidence Attachments Section */}
      <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          3. Media Evidence (Optional)
        </ThemedText>
        <ThemedText style={styles.consentSub}>
          Select existing pictures, videos, audio clips, or documents from your phone (Max file size: 10MB).
        </ThemedText>

        <View style={styles.attachBtnContainer}>
          <Pressable
            style={[styles.attachBtn, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
            onPress={handlePickMedia}
          >
            <Feather name="image" size={22} color={theme.primary} />
            <ThemedText style={styles.attachBtnText}>Pick Photo/Video</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.attachBtn, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
            onPress={handlePickDocument}
          >
            <Feather name="file" size={22} color={theme.primary} />
            <ThemedText style={styles.attachBtnText}>Pick Document</ThemedText>
          </Pressable>
        </View>

        {attachment && (
          <View style={[styles.attachmentPreview, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.attachmentName} numberOfLines={1}>
                {attachment.name}
              </ThemedText>
              <ThemedText style={[styles.attachmentSize, isFileSizeTooLarge && { color: theme.accent, fontWeight: "bold" }]}>
                {formatFileSize(attachment.size)} {isFileSizeTooLarge ? "(EXCEEDS 10MB LIMIT)" : ""}
              </ThemedText>
            </View>
            <Pressable style={styles.clearAttachment} onPress={() => setAttachment(null)}>
              <Feather name="trash-2" size={18} color={theme.accent} />
            </Pressable>
          </View>
        )}
      </View>

      {/* Submit Button */}
      <Pressable
        style={[
          styles.submitBtn,
          { backgroundColor: consent && victimName && incidentType && description && !isFileSizeTooLarge ? theme.primary : theme.border },
        ]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
            <ActivityIndicator size="small" color="#ffffff" />
            <ThemedText style={styles.submitBtnText}>{submitProgress || "Submitting..."}</ThemedText>
          </View>
        ) : (
          <ThemedText style={styles.submitBtnText}>Submit Incident Report</ThemedText>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 40,
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
