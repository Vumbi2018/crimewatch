import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
  Linking,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

interface Note {
  id: string;
  reportId: string;
  noteType: string;
  note: string;
  createdBy: string;
  createdAt: string;
}

export default function OfficerAssignmentDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { assignmentId } = route.params;

  const [assignment, setAssignment] = useState<any | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingStatus, setSubmittingStatus] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");

  const fetchDetails = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/officer/assignments`);
      if (!response.ok) throw new Error("Failed to fetch assignments");
      const list = await response.json();
      const match = list.find((a: any) => a.id === assignmentId);
      if (!match) {
        Alert.alert("Error", "Assignment not found.");
        navigation.goBack();
        return;
      }
      setAssignment(match);
      setSelectedStatus(match.status);

      // Fetch notes for the report
      const notesRes = await fetch(`${getApiUrl()}/api/reports/${match.reportId}/notes`);
      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotes(notesData);
      }
    } catch (error) {
      console.error("Failed to fetch assignment details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [assignmentId]);

  const handleUpdateStatus = async (status: string) => {
    setSubmittingStatus(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/officer/assignments/${assignmentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status.");
      Alert.alert("Success", "Status updated successfully.");
      setSelectedStatus(status);
      fetchDetails();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update status.");
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleAddNote = async () => {
    const trimmedNote = newNote.trim();
    if (!trimmedNote) return;

    setSubmittingNote(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/officer/assignments/${assignmentId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: trimmedNote }),
      });
      if (!res.ok) throw new Error("Failed to add note.");
      setNewNote("");
      fetchDetails();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to add note.");
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const report = assignment.report;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title Block */}
        <View style={styles.section}>
          <View style={styles.row}>
            <ThemedText style={styles.title}>{report.referenceNumber}</ThemedText>
            <View style={[styles.badge, { backgroundColor: report.priority === "High" ? "#EF4444" : "#FBBF24" }]}>
              <ThemedText style={styles.badgeText}>{report.priority} Priority</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.metaText}>
            Submitted: {new Date(report.submittedAt).toLocaleString()}
          </ThemedText>
          <ThemedText style={styles.metaText}>
            Type: {report.incidentType || report.evidenceType}
          </ThemedText>
        </View>

        {/* Description & Location */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Incident Location</ThemedText>
          <ThemedText style={styles.bodyText}>📍 {report.address || "No address provided."}</ThemedText>
          <ThemedText style={styles.coordsText}>
            Coordinates: {report.latitude}, {report.longitude}
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Description</ThemedText>
          <ThemedText style={styles.bodyText}>{report.description || "No description provided."}</ThemedText>
        </View>

        {/* Behalf Reporting Info */}
        {report.isBehalfReport && (
          <View style={[styles.section, styles.behalfSection]}>
            <ThemedText style={styles.behalfTitle}>Reported on Behalf of Someone Else</ThemedText>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Victim Name:</ThemedText>
              <ThemedText style={styles.detailValue}>{report.behalfName || "Anonymous"}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Contact Info:</ThemedText>
              <ThemedText style={styles.detailValue}>{report.behalfContact || "None Provided"}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Relationship:</ThemedText>
              <ThemedText style={styles.detailValue}>{report.behalfRelationship || "Not Stated"}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Consent Obtained:</ThemedText>
              <ThemedText style={styles.detailValue}>{report.behalfConsent ? "Yes ✅" : "No ❌"}</ThemedText>
            </View>
          </View>
        )}

        {/* Reporter Info if not anonymous */}
        {!report.isAnonymous && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Reporter Details</ThemedText>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Name:</ThemedText>
              <ThemedText style={styles.detailValue}>{report.reporterName || "N/A"}</ThemedText>
            </View>
            {report.contactPhone && (
              <Pressable
                style={styles.detailRow}
                onPress={() => Linking.openURL(`tel:${report.contactPhone}`)}
              >
                <ThemedText style={styles.detailLabel}>Phone (Tap to Call):</ThemedText>
                <ThemedText style={[styles.detailValue, styles.linkText]}>{report.contactPhone}</ThemedText>
              </Pressable>
            )}
            {report.contactEmail && (
              <Pressable
                style={styles.detailRow}
                onPress={() => Linking.openURL(`mailto:${report.contactEmail}`)}
              >
                <ThemedText style={styles.detailLabel}>Email (Tap to Write):</ThemedText>
                <ThemedText style={[styles.detailValue, styles.linkText]}>{report.contactEmail}</ThemedText>
              </Pressable>
            )}
          </View>
        )}

        {/* Status Selector */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Update Status</ThemedText>
          <View style={styles.statusButtons}>
            {["Acknowledged", "On Route", "Resolved", "Failed"].map((status) => {
              const active = selectedStatus === status;
              return (
                <Pressable
                  key={status}
                  style={[
                    styles.statusBtn,
                    active && styles.statusBtnActive,
                    submittingStatus && styles.statusBtnDisabled,
                  ]}
                  onPress={() => !submittingStatus && handleUpdateStatus(status)}
                  disabled={submittingStatus}
                >
                  <ThemedText style={[styles.statusBtnText, active && styles.statusBtnTextActive]}>
                    {status}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Notes log */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Officer Activity Notes</ThemedText>
          <View style={styles.noteInputContainer}>
            <TextInput
              style={styles.noteInput}
              value={newNote}
              onChangeText={setNewNote}
              placeholder="Add update or action note..."
              placeholderTextColor="#94A3B8"
              multiline
            />
            <Pressable
              style={({ pressed }) => [
                styles.addNoteBtn,
                pressed && styles.addNoteBtnPressed,
                submittingNote && styles.addNoteBtnDisabled,
              ]}
              onPress={handleAddNote}
              disabled={submittingNote}
            >
              {submittingNote ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.addNoteBtnText}>Submit</ThemedText>
              )}
            </Pressable>
          </View>

          <View style={styles.notesList}>
            {notes.map((n) => (
              <View key={n.id} style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <ThemedText style={styles.noteAuthor}>{n.createdBy.toUpperCase()}</ThemedText>
                  <ThemedText style={styles.noteTime}>
                    {new Date(n.createdAt).toLocaleTimeString()}
                  </ThemedText>
                </View>
                <ThemedText style={styles.noteText}>{n.note}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  section: {
    backgroundColor: "#1E293B",
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "#334155",
  },
  behalfSection: {
    borderColor: "#3B82F6",
    borderWidth: 1.5,
  },
  behalfTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#60A5FA",
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.xs,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  metaText: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "500",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: Spacing.md,
  },
  bodyText: {
    fontSize: 15,
    color: "#E2E8F0",
    lineHeight: 22,
  },
  coordsText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: Spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderColor: "#334155",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  linkText: {
    color: "#60A5FA",
    textDecorationLine: "underline",
  },
  statusButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statusBtn: {
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs,
  },
  statusBtnActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  statusBtnDisabled: {
    opacity: 0.5,
  },
  statusBtnText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "700",
  },
  statusBtnTextActive: {
    color: "#FFFFFF",
  },
  noteInputContainer: {
    marginBottom: Spacing.lg,
  },
  noteInput: {
    backgroundColor: "#0F172A",
    color: "#FFFFFF",
    borderRadius: BorderRadius.xs,
    padding: Spacing.md,
    fontSize: 14,
    height: 80,
    borderWidth: 1,
    borderColor: "#334155",
    textAlignVertical: "top",
  },
  addNoteBtn: {
    backgroundColor: "#3B82F6",
    height: Spacing.buttonHeight - 10,
    borderRadius: BorderRadius.xs,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  addNoteBtnPressed: {
    opacity: 0.8,
  },
  addNoteBtnDisabled: {
    backgroundColor: "#475569",
  },
  addNoteBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  notesList: {
    gap: Spacing.sm,
  },
  noteCard: {
    backgroundColor: "#0F172A",
    borderRadius: BorderRadius.xs,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "#334155",
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  noteAuthor: {
    fontSize: 11,
    fontWeight: "700",
    color: "#60A5FA",
  },
  noteTime: {
    fontSize: 11,
    color: "#64748B",
  },
  noteText: {
    fontSize: 13,
    color: "#E2E8F0",
    lineHeight: 18,
  },
});
