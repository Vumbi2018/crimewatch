import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  UserProfile,
  getUserProfile,
  saveUserProfile,
  getAllEvidence,
  Evidence,
} from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AVATAR_TYPES = [
  { type: "shield" as const, icon: "shield", color: Colors.light.primary },
  { type: "star" as const, icon: "star", color: "#F59E0B" },
  { type: "checkmark" as const, icon: "check-circle", color: Colors.light.success },
  { type: "eye" as const, icon: "eye", color: "#64748B" },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [badgeNumber, setBadgeNumber] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<UserProfile["avatarType"]>("shield");
  const [recentSubmissions, setRecentSubmissions] = useState<Evidence[]>([]);
  const [stats, setStats] = useState({ totalEvidence: 0, totalSubmissions: 0 });

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [])
  );

  const loadProfileData = async () => {
    const profileData = await getUserProfile();
    setProfile(profileData);
    setDisplayName(profileData.displayName);
    setBadgeNumber(profileData.badgeNumber);
    setSelectedAvatar(profileData.avatarType);

    const evidence = await getAllEvidence();
    const submissions = evidence.filter((e) => e.submissionStatus === "sent");
    setRecentSubmissions(submissions.slice(0, 5));
    setStats({
      totalEvidence: evidence.length,
      totalSubmissions: submissions.length,
    });
  };

  const handleSaveProfile = async () => {
    await saveUserProfile({
      displayName: displayName.trim() || "Anonymous User",
      badgeNumber: badgeNumber.trim(),
      avatarType: selectedAvatar,
    });
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsEditing(false);
    loadProfileData();
  };

  const getAvatarConfig = (type: UserProfile["avatarType"]) => {
    return AVATAR_TYPES.find((a) => a.type === type) || AVATAR_TYPES[0];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
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

  const avatarConfig = getAvatarConfig(selectedAvatar);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
        },
      ]}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.header}>
        <ThemedText type="h2">Profile</ThemedText>
        <Pressable
          style={[styles.settingsButton, { backgroundColor: theme.backgroundSecondary }]}
          onPress={() => navigation.navigate("Settings")}
        >
          <Feather name="settings" size={20} color={theme.text} />
        </Pressable>
      </View>

      <View style={[styles.profileCard, { backgroundColor: theme.cardBackground }, Shadows.small]}>
        {isEditing ? (
          <View style={styles.editingContainer}>
            <ThemedText type="h4" style={styles.editingTitle}>
              Edit Profile
            </ThemedText>
            
            <View style={styles.avatarPicker}>
              {AVATAR_TYPES.map((avatar) => (
                <Pressable
                  key={avatar.type}
                  style={[
                    styles.avatarOption,
                    {
                      backgroundColor: avatar.color + "20",
                      borderWidth: selectedAvatar === avatar.type ? 2 : 0,
                      borderColor: avatar.color,
                    },
                  ]}
                  onPress={() => {
                    setSelectedAvatar(avatar.type);
                    Haptics.selectionAsync();
                  }}
                >
                  <Feather name={avatar.icon as any} size={24} color={avatar.color} />
                </Pressable>
              ))}
            </View>

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Display Name"
              placeholderTextColor={theme.textSecondary}
              value={displayName}
              onChangeText={setDisplayName}
            />

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Badge Number (optional)"
              placeholderTextColor={theme.textSecondary}
              value={badgeNumber}
              onChangeText={setBadgeNumber}
            />

            <View style={styles.editingButtons}>
              <Pressable
                style={[styles.cancelButton, { borderColor: theme.border }]}
                onPress={() => {
                  setIsEditing(false);
                  setDisplayName(profile?.displayName || "");
                  setBadgeNumber(profile?.badgeNumber || "");
                  setSelectedAvatar(profile?.avatarType || "shield");
                }}
              >
                <ThemedText>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.saveButton, { backgroundColor: Colors.light.primary }]}
                onPress={handleSaveProfile}
              >
                <ThemedText style={{ color: "#FFF", fontWeight: "600" }}>Save</ThemedText>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.profileHeader}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: avatarConfig.color + "20" },
                ]}
              >
                <Feather
                  name={avatarConfig.icon as any}
                  size={32}
                  color={avatarConfig.color}
                />
              </View>
              <View style={styles.profileInfo}>
                <ThemedText type="h4">{profile?.displayName}</ThemedText>
                {profile?.badgeNumber ? (
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Badge: {profile.badgeNumber}
                  </ThemedText>
                ) : null}
              </View>
              <Pressable
                style={[styles.editButton, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => setIsEditing(true)}
              >
                <Feather name="edit-2" size={16} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <ThemedText type="h3" style={{ color: Colors.light.primary }}>
                  {stats.totalEvidence}
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Evidence
                </ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.statItem}>
                <ThemedText type="h3" style={{ color: Colors.light.success }}>
                  {stats.totalSubmissions}
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Submitted
                </ThemedText>
              </View>
            </View>
          </>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <ThemedText type="h4">Recent Submissions</ThemedText>
      </View>

      {recentSubmissions.length > 0 ? (
        <View style={[styles.submissionsList, { backgroundColor: theme.cardBackground }, Shadows.small]}>
          {recentSubmissions.map((item, index) => (
            <Pressable
              key={item.id}
              style={[
                styles.submissionItem,
                index < recentSubmissions.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                },
              ]}
              onPress={() => navigation.navigate("EvidenceDetail", { evidenceId: item.id })}
            >
              <View style={styles.submissionContent}>
                <Feather
                  name={item.type === "photo" ? "image" : "video"}
                  size={18}
                  color={theme.textSecondary}
                />
                <View style={styles.submissionInfo}>
                  <ThemedText numberOfLines={1}>
                    {item.incidentType || "No incident type"}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Submitted {item.submittedAt ? formatDate(item.submittedAt) : formatDate(item.timestamp)}
                  </ThemedText>
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.submissionStatus) + "20" },
                ]}
              >
                <Feather
                  name="check-circle"
                  size={14}
                  color={getStatusColor(item.submissionStatus)}
                />
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={[styles.emptySubmissions, { backgroundColor: theme.cardBackground }]}>
          <Feather name="inbox" size={40} color={theme.textSecondary} />
          <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
            No submissions yet
          </ThemedText>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  statsContainer: {
    flexDirection: "row",
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: "100%",
  },
  editingContainer: {
    gap: Spacing.md,
  },
  editingTitle: {
    marginBottom: Spacing.sm,
  },
  avatarPicker: {
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    height: 48,
    fontSize: 16,
  },
  editingButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    marginTop: Spacing["2xl"],
    marginBottom: Spacing.md,
  },
  submissionsList: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  submissionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  submissionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  submissionInfo: {
    flex: 1,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptySubmissions: {
    borderRadius: BorderRadius.md,
    padding: Spacing["3xl"],
    alignItems: "center",
  },
});
