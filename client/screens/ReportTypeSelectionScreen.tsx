import React from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useTheme } from "@/hooks/useTheme";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ReportTypeSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  const handleLiveReport = () => {
    navigation.navigate("MainTabs");
  };

  const handleBehalfReport = () => {
    navigation.navigate("BehalfReport" as any);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={styles.content}
    >
      <ThemedText type="h1" style={styles.title}>
        Submit Incident Report
      </ThemedText>
      <ThemedText style={styles.subtitle}>
        Select how you would like to report this incident to the authorities.
      </ThemedText>

      <Pressable
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: theme.cardBackground, borderColor: theme.border },
          pressed && styles.cardPressed,
        ]}
        onPress={handleLiveReport}
      >
        <View style={[styles.iconContainer, { backgroundColor: "rgba(59, 130, 246, 0.15)" }]}>
          <Feather name="camera" size={32} color="#3b82f6" />
        </View>
        <View style={styles.textContainer}>
          <ThemedText type="h2" style={styles.cardTitle}>
            Report Live Incident
          </ThemedText>
          <ThemedText style={styles.cardDesc}>
            Record live video, audio, or capture photos on scene, then submit instantly.
          </ThemedText>
        </View>
        <Feather name="chevron-right" size={24} color={theme.textSecondary} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: theme.cardBackground, borderColor: theme.border },
          pressed && styles.cardPressed,
        ]}
        onPress={handleBehalfReport}
      >
        <View style={[styles.iconContainer, { backgroundColor: "rgba(168, 85, 247, 0.15)" }]}>
          <Feather name="users" size={32} color="#c084fc" />
        </View>
        <View style={styles.textContainer}>
          <ThemedText type="h2" style={styles.cardTitle}>
            Report on Behalf of Someone
          </ThemedText>
          <ThemedText style={styles.cardDesc}>
            Submit a report for a victim, family member, or friend. Upload existing files from your device.
          </ThemedText>
        </View>
        <Feather name="chevron-right" size={24} color={theme.textSecondary} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginTop: Spacing.md,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    opacity: 0.8,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    opacity: 0.7,
    lineHeight: 18,
  },
});
