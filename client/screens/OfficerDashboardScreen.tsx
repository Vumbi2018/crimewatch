import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiUrl, readJsonResponse } from "@/lib/query-client";
import { getOfficerProfile, clearOfficerProfile } from "@/lib/storage";

type OfficerDashboardNavigationProp = NativeStackNavigationProp<any>;

interface Assignment {
  id: string;
  reportId: string;
  officerUserId: string;
  assignmentType: string;
  status: string;
  createdAt: string;
  report: {
    id: string;
    referenceNumber: string;
    evidenceType: string;
    incidentType: string;
    description: string;
    latitude: string;
    longitude: string;
    address: string;
    priority: string;
    status: string;
    submittedAt: string;
  };
}

export default function OfficerDashboardScreen({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const navigation = useNavigation<OfficerDashboardNavigationProp>();
  const [profile, setProfile] = useState<any | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfileAndAssignments = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const stored = await getOfficerProfile();
      if (!stored) {
        onLogout();
        return;
      }
      setProfile(stored);

      const response = await fetch(
        apiUrl(
          `/api/officer/assignments?officerUserId=${encodeURIComponent(stored.userId)}`,
        ),
      );
      if (!response.ok) {
        throw new Error("Failed to fetch assignments");
      }
      const data = await readJsonResponse<Assignment[]>(response);
      setAssignments(data);
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfileAndAssignments();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfileAndAssignments(false);
    }, []),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProfileAndAssignments(false);
  };

  const handleLogout = async () => {
    await clearOfficerProfile();
    onLogout();
  };

  const renderPriorityBadge = (priority: string) => {
    const isHigh = priority.toLowerCase() === "high";
    const isLow = priority.toLowerCase() === "low";
    const color = isHigh ? "#EF4444" : isLow ? "#10B981" : "#FBBF24";

    return (
      <View
        style={[
          styles.badge,
          { backgroundColor: color + "20", borderColor: color },
        ]}
      >
        <ThemedText style={[styles.badgeText, { color }]}>
          {priority}
        </ThemedText>
      </View>
    );
  };

  const renderStatusBadge = (status: string) => {
    let color = "#3B82F6";
    if (status === "Resolved") color = "#10B981";
    if (status === "Failed" || status === "Rejected") color = "#EF4444";
    if (status === "On Route") color = "#F59E0B";

    return (
      <View style={[styles.statusBadge, { backgroundColor: color }]}>
        <ThemedText style={styles.statusBadgeText}>{status}</ThemedText>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <ThemedText style={styles.welcomeText}>
            {profile?.rank} {profile?.name}
          </ThemedText>
          <ThemedText style={styles.coverageText}>
            Area: {profile?.responsibilityAreaName}
          </ThemedText>
        </View>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <ThemedText style={styles.logoutText}>Log Out</ThemedText>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>
          Assigned Incident Reports
        </ThemedText>
        <ThemedText style={styles.countText}>
          {assignments.length} Total
        </ThemedText>
      </View>

      <FlatList
        data={assignments}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              No reports assigned to you.
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate("OfficerAssignmentDetail", {
                assignmentId: item.id,
              })
            }
          >
            <View style={styles.cardHeader}>
              <ThemedText style={styles.refNumber}>
                {item.report.referenceNumber}
              </ThemedText>
              {renderPriorityBadge(item.report.priority)}
            </View>

            <ThemedText style={styles.categoryText}>
              Category: {item.report.incidentType || item.report.evidenceType}
            </ThemedText>

            <ThemedText style={styles.descriptionText} numberOfLines={2}>
              {item.report.description || "No description provided."}
            </ThemedText>

            <ThemedText style={styles.addressText} numberOfLines={1}>
              📍 {item.report.address || "Unknown Location"}
            </ThemedText>

            <View style={styles.cardFooter}>
              <ThemedText style={styles.dateText}>
                {new Date(item.report.submittedAt).toLocaleDateString()}
              </ThemedText>
              {renderStatusBadge(item.status)}
            </View>
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
      />
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#1E293B",
  },
  profileInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  coverageText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#94A3B8",
    marginTop: 2,
  },
  logoutButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  countText: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "600",
  },
  listContent: {
    padding: Spacing.xl,
    paddingTop: Spacing.xs,
  },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  refNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3B82F6",
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
  },
  descriptionText: {
    fontSize: 13,
    color: "#94A3B8",
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  addressText: {
    fontSize: 12,
    color: "#60A5FA",
    marginBottom: Spacing.md,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#334155",
    paddingTop: Spacing.md,
  },
  dateText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.xs,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 15,
    textAlign: "center",
  },
});
