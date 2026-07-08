import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Colors, Shadows, Spacing } from "@/constants/theme";
import { apiUrl } from "@/lib/query-client";

type PublicCaseStatus = {
  referenceNumber: string;
  status: string;
  submittedAt: string | null;
  agency: string;
  priority: string;
  incidentType: string;
  evidenceType: string;
  location: string;
  nextStep: string;
};

function formatSubmittedAt(value: string | null): string {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusColor(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized.includes("resolved") || normalized.includes("closed")) {
    return Colors.light.success;
  }
  if (normalized.includes("review") || normalized.includes("assigned")) {
    return Colors.light.primary;
  }
  if (normalized.includes("pending") || normalized.includes("new")) {
    return Colors.light.warning;
  }
  return Colors.light.secondary;
}

export default function CaseStatusScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [reference, setReference] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PublicCaseStatus | null>(null);

  const lookupStatus = async () => {
    const cleanReference = reference.trim();
    if (!cleanReference) {
      Alert.alert("Reference Required", "Enter the report reference number.");
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const response = await fetch(
        apiUrl(`/api/public/report-status/${encodeURIComponent(cleanReference)}`),
        { cache: "no-store" },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "No report was found for this reference number.");
      }
      setResult(data as PublicCaseStatus);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert("Status Unavailable", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: Colors.light.primary + "20" }]}> 
            <Feather name="search" size={24} color={Colors.light.primary} />
          </View>
          <ThemedText type="h2">Check Case Status</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}> 
            Enter your reference number to see the latest public status update.
          </ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBackground }, Shadows.small]}>
          <ThemedText style={styles.label}>Reference Number</ThemedText>
          <TextInput
            value={reference}
            onChangeText={(value) => setReference(value.toUpperCase())}
            placeholder="CPNG-2026-ABC12345"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="characters"
            autoCorrect={false}
            style={[
              styles.input,
              {
                borderColor: theme.border,
                color: theme.text,
                backgroundColor: theme.backgroundDefault,
              },
            ]}
          />
          <Pressable
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={lookupStatus}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Feather name="search" size={18} color="#FFF" />
            )}
            <ThemedText style={styles.buttonText}>{isLoading ? "Checking..." : "Check Status"}</ThemedText>
          </Pressable>
        </View>

        {result ? (
          <View style={[styles.resultCard, { backgroundColor: theme.cardBackground }, Shadows.small]}>
            <View style={styles.resultHeader}>
              <View style={[styles.statusDot, { backgroundColor: statusColor(result.status) }]} />
              <View style={styles.resultTitleWrap}>
                <ThemedText style={styles.referenceText}>{result.referenceNumber}</ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Submitted {formatSubmittedAt(result.submittedAt)}
                </ThemedText>
              </View>
            </View>

            <View style={styles.metricGrid}>
              <View style={[styles.metric, { borderColor: theme.border }]}> 
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Status</ThemedText>
                <ThemedText style={[styles.metricValue, { color: statusColor(result.status) }]}>{result.status}</ThemedText>
              </View>
              <View style={[styles.metric, { borderColor: theme.border }]}> 
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Agency</ThemedText>
                <ThemedText style={styles.metricValue}>{result.agency}</ThemedText>
              </View>
              <View style={[styles.metric, { borderColor: theme.border }]}> 
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Incident</ThemedText>
                <ThemedText style={styles.metricValue}>{result.incidentType}</ThemedText>
              </View>
              <View style={[styles.metric, { borderColor: theme.border }]}> 
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>Priority</ThemedText>
                <ThemedText style={styles.metricValue}>{result.priority}</ThemedText>
              </View>
            </View>

            <View style={[styles.nextStep, { backgroundColor: theme.backgroundSecondary }]}> 
              <Feather name="info" size={18} color={Colors.light.primary} />
              <ThemedText style={styles.nextStepText}>{result.nextStep}</ThemedText>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, gap: Spacing.lg },
  header: { alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.sm },
  headerIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  subtitle: { textAlign: "center", lineHeight: 22 },
  card: { borderRadius: BorderRadius.md, padding: Spacing.lg, gap: Spacing.md },
  label: { fontWeight: "700" },
  input: { minHeight: 52, borderWidth: 1, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, fontSize: 16, fontWeight: "700" },
  button: { minHeight: 50, borderRadius: BorderRadius.sm, backgroundColor: Colors.light.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: Spacing.sm },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#FFF", fontWeight: "800" },
  resultCard: { borderRadius: BorderRadius.md, padding: Spacing.lg, gap: Spacing.lg },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  statusDot: { width: 14, height: 14, borderRadius: 7 },
  resultTitleWrap: { flex: 1 },
  referenceText: { fontSize: 18, fontWeight: "800" },
  metricGrid: { gap: Spacing.sm },
  metric: { borderWidth: 1, borderRadius: BorderRadius.sm, padding: Spacing.md, gap: Spacing.xs },
  metricValue: { fontWeight: "800" },
  nextStep: { borderRadius: BorderRadius.sm, padding: Spacing.md, flexDirection: "row", gap: Spacing.sm },
  nextStepText: { flex: 1, lineHeight: 21 },
});