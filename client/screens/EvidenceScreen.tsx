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
  const { theme } = useTheme();

  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [filteredEvidence, setFilteredEvidence] = useState<Evidence[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadEvidence = useCallback(async () => {
    try {
      const data = await getAllEvidence();
      setEvidence(data);
      setFilteredEvidence(data);
      setSelectedIds([]);
      setIsSelectMode(false);
    } catch (error) {
      console.error("Error loading evidence:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEvidence();
    }, [loadEvidence]),
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
        new Date(item.timestamp).toLocaleDateString().includes(query),
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
    if (isSelectMode) return;
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
      ],
    );
  };

  const handleCardPress = (item: Evidence) => {
    if (isSelectMode) {
      if (item.submissionStatus !== "draft") {
        Alert.alert(
          "Invalid Selection",
          "Only draft evidence can be selected for submission.",
        );
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (selectedIds.includes(item.id)) {
        setSelectedIds(selectedIds.filter((id) => id !== item.id));
      } else {
        if (selectedIds.length >= 10) {
          Alert.alert(
            "Limit Reached",
            "You can select a maximum of 10 evidence items.",
          );
          return;
        }
        setSelectedIds([...selectedIds, item.id]);
      }
    } else {
      navigation.navigate("EvidenceDetail", { evidenceId: item.id });
    }
  };

  const handleBulkSubmit = () => {
    if (selectedIds.length === 0) return;
    navigation.navigate("ReportSubmission", { evidenceIds: selectedIds });
  };

  const toggleSelectMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isSelectMode) {
      setIsSelectMode(false);
      setSelectedIds([]);
    } else {
      setIsSelectMode(true);
    }
  };

  const renderEvidenceItem = ({ item }: { item: Evidence }) => {
    const isSelected = selectedIds.includes(item.id);
    const isDraft = item.submissionStatus === "draft";
    return (
      <Pressable
        style={[
          styles.evidenceCard,
          { backgroundColor: theme.cardBackground },
          isSelected && { borderColor: theme.primary, borderWidth: 2 },
          isSelectMode && !isDraft && { opacity: 0.5 },
          Shadows.small,
        ]}
        onPress={() => handleCardPress(item)}
        onLongPress={() => handleDelete(item.id)}
      >
        <View style={styles.thumbnailContainer}>
          {item.type === "audio" ? (
            <View style={[styles.thumbnail, styles.audioThumbnail]}>
              <Feather name="mic" size={32} color="rgba(255,255,255,0.6)" />
              <View style={styles.audioWaveRow}>
                {[0.4, 0.8, 0.5, 1, 0.6, 0.9, 0.45].map((h, i) => (
                  <View
                    key={i}
                    style={[styles.audioWaveBar, { height: 24 * h }]}
                  />
                ))}
              </View>
            </View>
          ) : (
            <Image
              source={{ uri: item.uri }}
              style={styles.thumbnail}
              contentFit="cover"
            />
          )}
          <View style={styles.typeBadge}>
            <Feather
              name={
                item.type === "photo"
                  ? "image"
                  : item.type === "video"
                    ? "video"
                    : "mic"
              }
              size={12}
              color="#FFF"
            />
          </View>
          {isSelectMode && isDraft && (
            <View style={styles.selectCheckboxOverlay}>
              <Feather
                name={isSelected ? "check-circle" : "circle"}
                size={22}
                color={isSelected ? theme.primary : "#FFF"}
              />
            </View>
          )}
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
                {
                  backgroundColor: getStatusColor(item.submissionStatus) + "20",
                },
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
  };

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

  const showSelectButton = evidence.some((e) => e.submissionStatus === "draft");

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.headerTitleRow}>
          <ThemedText type="h2">Evidence</ThemedText>
          {showSelectButton && (
            <Pressable
              onPress={toggleSelectMode}
              style={[styles.selectHeaderBtn, { borderColor: theme.border }]}
            >
              <ThemedText
                style={
                  isSelectMode
                    ? { color: Colors.light.accent, fontWeight: "600" }
                    : { color: theme.primary }
                }
              >
                {isSelectMode ? "Cancel" : "Select"}
              </ThemedText>
            </Pressable>
          )}
        </View>
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: theme.backgroundSecondary },
          ]}
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
            paddingBottom: tabBarHeight + Spacing.xl + (isSelectMode ? 80 : 0),
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={!isLoading ? <EmptyState /> : null}
      />

      {isSelectMode && selectedIds.length > 0 && (
        <View
          style={[
            styles.floatingSubmitContainer,
            { bottom: tabBarHeight + Spacing.md },
          ]}
        >
          <Pressable
            style={[styles.floatingSubmitBtn, Shadows.medium]}
            onPress={handleBulkSubmit}
          >
            <Feather name="send" size={18} color="#FFF" />
            <ThemedText style={styles.floatingSubmitText}>
              Submit {selectedIds.length} Item
              {selectedIds.length > 1 ? "s" : ""}
            </ThemedText>
          </Pressable>
        </View>
      )}
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
  audioThumbnail: {
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  audioWaveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  audioWaveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
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
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectHeaderBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  selectCheckboxOverlay: {
    position: "absolute",
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    padding: 2,
  },
  floatingSubmitContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99,
  },
  floatingSubmitBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  floatingSubmitText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
