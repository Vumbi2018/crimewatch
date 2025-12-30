import React from "react";
import {
  View,
  StyleSheet,
  Platform,
  Pressable,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type RouteType = RouteProp<RootStackParamList, "MapView">;

export default function MapViewScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteType>();
  const { theme } = useTheme();
  const { latitude, longitude, address } = route.params;

  const openInMaps = async () => {
    const label = address || "Evidence Location";
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    });

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(
          `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
        );
      }
    } catch (error) {
      console.error("Error opening maps:", error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.mapIconContainer}>
            <Feather name="map-pin" size={64} color={Colors.light.primary} />
          </View>
          <ThemedText type="h3" style={styles.title}>
            Evidence Location
          </ThemedText>
          
          {address ? (
            <ThemedText style={[styles.address, { color: theme.text }]}>
              {address}
            </ThemedText>
          ) : null}
          
          <ThemedText style={[styles.coordinates, { color: theme.textSecondary }]}>
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </ThemedText>

          <View style={styles.accuracyRow}>
            <Feather name="target" size={16} color={Colors.light.success} />
            <ThemedText type="small" style={{ color: Colors.light.success }}>
              GPS Location Recorded
            </ThemedText>
          </View>

          <Pressable
            style={[styles.openButton, { backgroundColor: Colors.light.primary }]}
            onPress={openInMaps}
          >
            <Feather name="navigation" size={20} color="#FFF" />
            <ThemedText style={styles.openButtonText}>
              Open in Maps App
            </ThemedText>
          </Pressable>
          
          <ThemedText type="caption" style={[styles.hint, { color: theme.textSecondary }]}>
            View the exact location in your device's maps application
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  card: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
  },
  mapIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(30, 58, 138, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  address: {
    textAlign: "center",
    marginBottom: Spacing.sm,
    fontSize: 16,
  },
  coordinates: {
    textAlign: "center",
    marginBottom: Spacing.md,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 14,
  },
  accuracyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  openButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    width: "100%",
    justifyContent: "center",
  },
  openButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
  hint: {
    textAlign: "center",
    marginTop: Spacing.md,
  },
});
