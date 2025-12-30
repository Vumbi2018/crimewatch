import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
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
import { Evidence, getEvidenceById, saveEvidence, deleteEvidence } from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, "EvidenceDetail">;

const INCIDENT_TYPES = [
  "Theft",
  "Vandalism",
  "Suspicious Activity",
  "Traffic",
  "Assault",
  "Other",
];

export default function EvidenceDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme } = useTheme();

  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [incidentType, setIncidentType] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [showIncidentPicker, setShowIncidentPicker] = useState(false);

  useEffect(() => {
    loadEvidence();
  }, [route.params.evidenceId]);

  const loadEvidence = async () => {
    try {
      const data = await getEvidenceById(route.params.evidenceId);
      if (data) {
        setEvidence(data);
        setIncidentType(data.incidentType);
        setDescription(data.description || "");
        setTags(data.tags);
      }
    } catch (error) {
      console.error("Error loading evidence:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSave = async () => {
    if (!evidence) return;

    const updatedEvidence: Evidence = {
      ...evidence,
      incidentType,
      description: description.trim() || null,
      tags,
    };

    await saveEvidence(updatedEvidence);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Saved", "Evidence details have been updated.");
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Evidence",
      "Are you sure you want to delete this evidence? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (evidence) {
              await deleteEvidence(evidence.id);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = () => {
    if (!evidence) return;
    
    if (!incidentType) {
      Alert.alert("Required", "Please select an incident type before submitting.");
      return;
    }

    navigation.navigate("ReportSubmission", { evidenceId: evidence.id });
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={handleDelete} style={{ marginRight: Spacing.sm }}>
          <Feather name="trash-2" size={22} color={Colors.light.accent} />
        </Pressable>
      ),
    });
  }, [navigation, evidence]);

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
          { paddingBottom: insets.bottom + 80 },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={styles.mediaContainer}>
          <Image
            source={{ uri: evidence.uri }}
            style={styles.media}
            contentFit="cover"
          />
          {evidence.type === "video" ? (
            <View style={styles.playOverlay}>
              <Feather name="play-circle" size={48} color="#FFF" />
            </View>
          ) : null}
        </View>

        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <ThemedText type="small" style={styles.sectionLabel}>
            Captured
          </ThemedText>
          <View style={styles.metadataRow}>
            <Feather name="clock" size={16} color={theme.textSecondary} />
            <ThemedText style={styles.metadataText}>
              {formatDateTime(evidence.timestamp)}
            </ThemedText>
          </View>
          
          {evidence.latitude && evidence.longitude ? (
            <Pressable
              style={styles.metadataRow}
              onPress={() =>
                navigation.navigate("MapView", {
                  latitude: evidence.latitude!,
                  longitude: evidence.longitude!,
                  address: evidence.address || undefined,
                })
              }
            >
              <Feather name="map-pin" size={16} color={theme.primary} />
              <ThemedText style={[styles.metadataText, { color: theme.primary }]}>
                {evidence.address || `${evidence.latitude.toFixed(6)}, ${evidence.longitude.toFixed(6)}`}
              </ThemedText>
              <Feather name="chevron-right" size={16} color={theme.textSecondary} />
            </Pressable>
          ) : (
            <View style={styles.metadataRow}>
              <Feather name="map-pin" size={16} color={theme.textSecondary} />
              <ThemedText style={[styles.metadataText, { color: theme.textSecondary }]}>
                Location not available
              </ThemedText>
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <ThemedText type="small" style={styles.sectionLabel}>
            Incident Type
          </ThemedText>
          <Pressable
            style={[styles.pickerButton, { borderColor: theme.border }]}
            onPress={() => setShowIncidentPicker(!showIncidentPicker)}
          >
            <ThemedText
              style={incidentType ? {} : { color: theme.textSecondary }}
            >
              {incidentType || "Select incident type"}
            </ThemedText>
            <Feather
              name={showIncidentPicker ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.textSecondary}
            />
          </Pressable>
          {showIncidentPicker ? (
            <View style={styles.pickerOptions}>
              {INCIDENT_TYPES.map((type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.pickerOption,
                    incidentType === type && {
                      backgroundColor: theme.primary + "20",
                    },
                  ]}
                  onPress={() => {
                    setIncidentType(type);
                    setShowIncidentPicker(false);
                    Haptics.selectionAsync();
                  }}
                >
                  <ThemedText
                    style={
                      incidentType === type
                        ? { color: theme.primary, fontWeight: "600" }
                        : {}
                    }
                  >
                    {type}
                  </ThemedText>
                  {incidentType === type ? (
                    <Feather name="check" size={18} color={theme.primary} />
                  ) : null}
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <ThemedText type="small" style={styles.sectionLabel}>
              Description
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {description.length}/500
            </ThemedText>
          </View>
          <TextInput
            style={[
              styles.descriptionInput,
              { color: theme.text, borderColor: theme.border },
            ]}
            placeholder="Describe the incident..."
            placeholderTextColor={theme.textSecondary}
            value={description}
            onChangeText={(text) => setDescription(text.slice(0, 500))}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <ThemedText type="small" style={styles.sectionLabel}>
            Tags
          </ThemedText>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={[
                styles.tagInput,
                { color: theme.text, borderColor: theme.border },
              ]}
              placeholder="Add a tag..."
              placeholderTextColor={theme.textSecondary}
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={handleAddTag}
              returnKeyType="done"
            />
            <Pressable
              style={[styles.addTagButton, { backgroundColor: theme.primary }]}
              onPress={handleAddTag}
            >
              <Feather name="plus" size={20} color="#FFF" />
            </Pressable>
          </View>
          {tags.length > 0 ? (
            <View style={styles.tagsContainer}>
              {tags.map((tag) => (
                <Pressable
                  key={tag}
                  style={[styles.tag, { backgroundColor: theme.backgroundSecondary }]}
                  onPress={() => handleRemoveTag(tag)}
                >
                  <ThemedText type="small">{tag}</ThemedText>
                  <Feather name="x" size={14} color={theme.textSecondary} />
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <Pressable
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Feather name="save" size={18} color={theme.primary} />
          <ThemedText style={{ color: theme.primary, fontWeight: "600" }}>
            Save Changes
          </ThemedText>
        </Pressable>
      </ScrollView>

      <View
        style={[
          styles.submitContainer,
          { paddingBottom: insets.bottom + Spacing.lg, backgroundColor: theme.backgroundRoot },
        ]}
      >
        <Button onPress={handleSubmit} style={{ backgroundColor: Colors.light.primary }}>
          Submit to Authorities
        </Button>
      </View>
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
    paddingTop: Spacing.md,
  },
  mediaContainer: {
    aspectRatio: 16 / 9,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    position: "relative",
  },
  media: {
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  section: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionLabel: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  metadataText: {
    flex: 1,
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
  descriptionInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 100,
  },
  tagInputContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    height: 44,
    fontSize: 16,
  },
  addTagButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  submitContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    ...Shadows.medium,
  },
});
