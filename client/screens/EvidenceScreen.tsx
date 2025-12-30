import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Evidence, getAllEvidence, deleteEvidence } from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function EvidenceScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();

  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [filteredEvidence, setFilteredEvidence] = useState<Evidence[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvidence = useCallback(async () => {
    try {
      const data = await getAllEvidence();
      setEvidence(data);
      setFilteredEvidence(data);
    } catch (error) {
      console.error("Error loading evidence:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEvidence();
    }, [loadEvidence])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvidence();
    setRefreshing(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredEvidence(evidence);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = evidence.filter(
      (item) =>
        item.address?.toLowerCase().includes(lowerQuery) ||
        item.incidentType?.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery) ||
        item.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
        new Date(item.timestamp).toLocaleDateString().includes(query)
    );
    setFilteredEvidence(filtered);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: Evidence["submissionStatus"]) => {
    switch (status) {
      case "sent":
        return Colors.light.success;
      case "pending":
        return Colors.light.warning;
      default:
        return Colors.light.secondary;
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Evidence",
      "Are you sure you want to delete this evidence? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteEvidence(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadEvidence();
          },
        },
      ]
    );
  };

  const renderEvidenceItem = ({ item }: { item: Evidence }) => (
    <Pressable
      style={[
        styles.evidenceCard,
        { backgroundColor: theme.cardBackground },
        Shadows.small,
      ]}
      onPress={() => navigation.navigate("EvidenceDetail", { evidenceId: item.id })}
      onLongPress={() => handleDelete(item.id)}
    >
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: item.uri }}
          style={styles.thumbnail}
          contentFit="cover"
        />
        <View style={styles.typeBadge}>
          <Feather
            name={item.type === "photo" ? "image" : "video"}
            size={12}
            color="#FFF"
          />
        </View>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <ThemedText type="small" style={styles.dateText}>
            {formatDate(item.timestamp)}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {formatTime(item.timestamp)}
          </ThemedText>
        </View>
        {item.address ? (
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={12} color={theme.textSecondary} />
            <ThemedText
              type="caption"
              numberOfLines={1}
              style={[styles.locationText, { color: theme.textSecondary }]}
            >
              {item.address}
            </ThemedText>
          </View>
        ) : null}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.submissionStatus) + "20" },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(item.submissionStatus) },
              ]}
            />
            <ThemedText
              type="caption"
              style={{ color: getStatusColor(item.submissionStatus) }}
            >
              {item.submissionStatus.charAt(0).toUpperCase() +
                item.submissionStatus.slice(1)}
            </ThemedText>
          </View>
        </View>
      </View>
    </Pressable>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="folder" size={64} color={theme.textSecondary} />
      <ThemedText type="h4" style={styles.emptyTitle}>
        No Evidence Captured
      </ThemedText>
      <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
        Tap Capture to begin documenting incidents.
      </ThemedText>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText type="h2">Evidence</ThemedText>
        <View
          style={[styles.searchContainer, { backgroundColor: theme.backgroundSecondary }]}
        >
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by tag, location, date..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery ? (
            <Pressable onPress={() => handleSearch("")}>
              <Feather name="x" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={filteredEvidence}
        renderItem={renderEvidenceItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={!isLoading ? <EmptyState /> : null}
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
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  columnWrapper: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  evidenceCard: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  thumbnailContainer: {
    aspectRatio: 1,
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  typeBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    padding: Spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: {
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  locationText: {
    flex: 1,
  },
  statusContainer: {
    marginTop: Spacing.sm,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emptyState: {
    flex: 1,
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
