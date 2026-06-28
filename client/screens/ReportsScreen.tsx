import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Colors, Shadows, Spacing } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import {
  PendingReportSubmission,
  SubmittedReportReceipt,
  deletePendingReportSubmission,
  getPendingReportSubmissions,
  getSubmittedReportReceipts,
  savePendingReportSubmission,
  saveSubmittedReportReceipt,
  updateEvidenceSubmissionStatus,
} from "@/lib/storage";

type ReportListItem =
  | { kind: "pending"; item: PendingReportSubmission }
  | { kind: "receipt"; item: SubmittedReportReceipt };

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: SubmittedReportReceipt["status"]): string {
  switch (status) {
    case "under_review":
      return "Under review";
    case "actioned":
      return "Actioned";
    case "closed":
      return "Closed";
    case "received":
      return "Received";
    default:
      return "Submitted";
  }
}

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();

  const [pending, setPending] = useState<PendingReportSubmission[]>([]);
  const [receipts, setReceipts] = useState<SubmittedReportReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    try {
      const [pendingReports, submittedReports] = await Promise.all([
        getPendingReportSubmissions(),
        getSubmittedReportReceipts(),
      ]);
      setPending(pendingReports);
      setReceipts(submittedReports);
    } catch (error) {
      console.error("Error loading report history:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports]),
  );

  const refresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const retryPendingReport = async (report: PendingReportSubmission) => {
    setRetryingId(report.id);
    try {
      const response = await apiRequest("POST", "/api/reports", report.payload);
      const submitted = (await response.json().catch(() => null)) as {
        referenceNumber?: string;
      } | null;
      const payload = report.payload as {
        agency?: string;
        priority?: string;
      };

      await deletePendingReportSubmission(report.id);
      await updateEvidenceSubmissionStatus(report.evidenceId, "sent");
      await saveSubmittedReportReceipt({
        id: submitted?.referenceNumber || report.id,
        evidenceId: report.evidenceId,
        referenceNumber: submitted?.referenceNumber || null,
        agency: payload.agency || "Submitted agency",
        priority: payload.priority || "Medium",
        status: "submitted",
        submittedAt: Date.now(),
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Report Submitted",
        submitted?.referenceNumber
          ? "Reference: " + submitted.referenceNumber
          : "The saved report was submitted successfully.",
      );
      await loadReports();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await savePendingReportSubmission({
        ...report,
        attempts: report.attempts + 1,
        lastError: message,
      });
      Alert.alert(
        "Still Saved",
        "The report could not be sent yet. It remains saved on this phone for another retry.",
      );
      await loadReports();
    } finally {
      setRetryingId(null);
    }
  };

  const data: ReportListItem[] = [
    ...pending.map((item) => ({ kind: "pending" as const, item })),
    ...receipts.map((item) => ({ kind: "receipt" as const, item })),
  ];

  const renderItem = ({ item }: { item: ReportListItem }) => {
    if (item.kind === "pending") {
      const payload = item.item.payload as {
        agency?: string;
        priority?: string;
        incidentType?: string | null;
        address?: string | null;
      };
      const isRetrying = retryingId === item.item.id;

      return (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.cardBackground },
            Shadows.small,
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconBadge, { backgroundColor: "#F59E0B20" }]}>
              <Feather name="clock" size={18} color={Colors.light.warning} />
            </View>
            <View style={styles.cardTitleWrap}>
              <ThemedText style={styles.cardTitle}>Saved for Retry</ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {formatDate(item.item.createdAt)}
              </ThemedText>
            </View>
          </View>

          <View style={styles.detailGrid}>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {payload.incidentType || "Incident not specified"}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {payload.address || "No address captured"}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {payload.agency || "Agency not selected"} | {payload.priority || "Medium"}
            </ThemedText>
          </View>

          {item.item.lastError ? (
            <ThemedText type="caption" style={styles.errorText} numberOfLines={2}>
              Last error: {item.item.lastError}
            </ThemedText>
          ) : null}

          <Pressable
            style={[styles.retryButton, isRetrying && styles.disabledButton]}
            onPress={() => retryPendingReport(item.item)}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Feather name="refresh-cw" size={16} color="#FFF" />
            )}
            <ThemedText style={styles.retryButtonText}>
              {isRetrying ? "Retrying..." : "Retry Submit"}
            </ThemedText>
          </Pressable>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: theme.cardBackground },
          Shadows.small,
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, { backgroundColor: "#05966920" }]}>
            <Feather name="check-circle" size={18} color={Colors.light.success} />
          </View>
          <View style={styles.cardTitleWrap}>
            <ThemedText style={styles.cardTitle}>
              {item.item.referenceNumber || "Submitted Report"}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {formatDate(item.item.submittedAt)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.timeline}>
          {["submitted", "received", "under_review", "actioned", "closed"].map(
            (step, index) => {
              const active = step === item.item.status || index === 0;
              return (
                <View key={step} style={styles.timelineStep}>
                  <View
                    style={[
                      styles.timelineDot,
                      { backgroundColor: active ? Colors.light.success : theme.border },
                    ]}
                  />
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {statusLabel(step as SubmittedReportReceipt["status"])}
                  </ThemedText>
                </View>
              );
            },
          )}
        </View>

        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {item.item.agency} | {item.item.priority}
        </ThemedText>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText type="h2">Reports</ThemedText>
        <ThemedText style={{ color: theme.textSecondary }}>
          Track submitted references and retry saved reports.
        </ThemedText>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) =>
          item.kind === "pending" ? item.item.id : item.item.id
        }
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Feather name="file-text" size={56} color={theme.textSecondary} />
              <ThemedText type="h4" style={styles.emptyTitle}>
                No Reports Yet
              </ThemedText>
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                Submitted reports and saved retries will appear here.
              </ThemedText>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.xs,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: "700",
  },
  detailGrid: {
    gap: Spacing.xs,
  },
  errorText: {
    color: Colors.light.accent,
  },
  retryButton: {
    height: 44,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  disabledButton: {
    opacity: 0.7,
  },
  retryButtonText: {
    color: "#FFF",
    fontWeight: "700",
  },
  timeline: {
    gap: Spacing.sm,
  },
  timelineStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  timelineDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    marginTop: Spacing.xl,
    textAlign: "center",
  },
  emptyText: {
    marginTop: Spacing.sm,
    textAlign: "center",
  },
});
