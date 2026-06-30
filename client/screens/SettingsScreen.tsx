import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { clearAllData } from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SettingsItemProps {
  icon: string;
  label: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
  showChevron?: boolean;
}

function SettingsItem({
  icon,
  label,
  value,
  onPress,
  destructive,
  showChevron = true,
}: SettingsItemProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingsItem,
        pressed && { backgroundColor: theme.backgroundSecondary },
      ]}
      onPress={onPress}
    >
      <View style={styles.settingsItemContent}>
        <Feather
          name={icon as any}
          size={20}
          color={destructive ? Colors.light.accent : theme.textSecondary}
        />
        <ThemedText
          style={[
            styles.settingsItemLabel,
            destructive && { color: Colors.light.accent },
          ]}
        >
          {label}
        </ThemedText>
      </View>
      <View style={styles.settingsItemRight}>
        {value ? (
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {value}
          </ThemedText>
        ) : null}
        {showChevron ? (
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        ) : null}
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const [isClearing, setIsClearing] = useState(false);

  const handleOpenSettings = async () => {
    if (Platform.OS !== "web") {
      try {
        await Linking.openSettings();
      } catch (error) {
        Alert.alert("Error", "Could not open device settings.");
      }
    }
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all evidence, submissions, and profile data from this device. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            setIsClearing(true);
            try {
              await clearAllData();
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              Alert.alert(
                "Data Cleared",
                "All data has been deleted from this device.",
              );
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", "Failed to clear data. Please try again.");
            } finally {
              setIsClearing(false);
            }
          },
        },
      ],
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      "Privacy Policy",
      "Crime Reporting PNG is committed to protecting your privacy. All evidence is stored locally on your device and only shared with authorities when you explicitly choose to submit a report.\n\nWe do not collect, store, or share your personal information without your consent.",
      [{ text: "OK" }],
    );
  };

  const handleTermsOfService = () => {
    Alert.alert(
      "Terms of Service",
      "By using Crime Reporting PNG, you agree to:\n\n1. Only submit accurate and truthful information\n2. Not use this app for false or malicious reports\n3. Comply with all applicable laws\n4. Accept responsibility for the content you submit\n\nFalse reports may be subject to legal action.",
      [{ text: "OK" }],
    );
  };

  const handleAbout = () => {
    Alert.alert(
      "About Crime Reporting PNG",
      "Version 1.0.0\n\nCrime Reporting PNG empowers citizens to safely and securely report crime-related incidents to local authorities.\n\nBuilt with privacy and security as core priorities.",
      [{ text: "OK" }],
    );
  };

  const handleContact = () => {
    Alert.alert(
      "Contact Support",
      "For support or feedback, please reach out through our official channels.\n\nYour feedback helps us improve the app and better serve our community.",
      [{ text: "OK" }],
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + Spacing.xl },
      ]}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.section}>
        <ThemedText
          type="small"
          style={[styles.sectionTitle, { color: theme.textSecondary }]}
        >
          PERMISSIONS
        </ThemedText>
        <View
          style={[
            styles.sectionContent,
            { backgroundColor: theme.cardBackground },
            Shadows.small,
          ]}
        >
          <SettingsItem
            icon="camera"
            label="Camera Access"
            onPress={handleOpenSettings}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsItem
            icon="map-pin"
            label="Location Access"
            onPress={handleOpenSettings}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsItem
            icon="bell"
            label="Notifications"
            onPress={handleOpenSettings}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText
          type="small"
          style={[styles.sectionTitle, { color: theme.textSecondary }]}
        >
          DATA & PRIVACY
        </ThemedText>
        <View
          style={[
            styles.sectionContent,
            { backgroundColor: theme.cardBackground },
            Shadows.small,
          ]}
        >
          <SettingsItem
            icon="shield"
            label="Privacy Policy"
            onPress={handlePrivacyPolicy}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsItem
            icon="file-text"
            label="Terms of Service"
            onPress={handleTermsOfService}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsItem
            icon="trash-2"
            label="Clear All Data"
            onPress={handleClearData}
            destructive
            showChevron={false}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText
          type="small"
          style={[styles.sectionTitle, { color: theme.textSecondary }]}
        >
          SUPPORT
        </ThemedText>
        <View
          style={[
            styles.sectionContent,
            { backgroundColor: theme.cardBackground },
            Shadows.small,
          ]}
        >
          <SettingsItem
            icon="help-circle"
            label="Help & FAQ"
            onPress={handleContact}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsItem
            icon="mail"
            label="Contact Support"
            onPress={handleContact}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsItem
            icon="info"
            label="About"
            value="v1.0.0"
            onPress={handleAbout}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <ThemedText
          type="caption"
          style={{ color: theme.textSecondary, textAlign: "center" }}
        >
          Crime Reporting PNG v1.0.0
        </ThemedText>
        <ThemedText
          type="caption"
          style={{ color: theme.textSecondary, textAlign: "center" }}
        >
          Your reports help keep our communities safe.
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginLeft: Spacing.lg,
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  sectionContent: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  settingsItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  settingsItemLabel: {
    fontSize: 16,
  },
  settingsItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  divider: {
    height: 1,
    marginLeft: Spacing.lg + 20 + Spacing.md,
  },
  footer: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
});
