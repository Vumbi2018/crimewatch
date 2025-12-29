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
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
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
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title="Evidence Location"
          description={address || undefined}
        >
          <View style={styles.markerContainer}>
            <View style={styles.marker}>
              <Feather name="map-pin" size={20} color="#FFF" />
            </View>
            <View style={styles.markerShadow} />
          </View>
        </Marker>
      </MapView>

      <View
        style={[
          styles.addressCard,
          {
            bottom: insets.bottom + Spacing.lg,
            backgroundColor: theme.cardBackground,
          },
          Shadows.medium,
        ]}
      >
        <View style={styles.addressContent}>
          <View style={styles.addressHeader}>
            <Feather name="map-pin" size={20} color={Colors.light.primary} />
            <ThemedText type="h4" style={styles.addressTitle}>
              Evidence Location
            </ThemedText>
          </View>
          {address ? (
            <ThemedText style={styles.addressText}>{address}</ThemedText>
          ) : null}
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </ThemedText>
          <View style={styles.accuracyRow}>
            <Feather name="target" size={14} color={Colors.light.success} />
            <ThemedText type="caption" style={{ color: Colors.light.success }}>
              High Accuracy
            </ThemedText>
          </View>
        </View>
        <Pressable
          style={[styles.openMapsButton, { backgroundColor: Colors.light.primary }]}
          onPress={openInMaps}
        >
          <Feather name="external-link" size={18} color="#FFF" />
          <ThemedText style={styles.openMapsText}>Open in Maps</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: "center",
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  markerShadow: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(30, 58, 138, 0.3)",
    marginTop: -4,
  },
  addressCard: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  addressContent: {
    padding: Spacing.lg,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  addressTitle: {
    flex: 1,
  },
  addressText: {
    marginBottom: Spacing.xs,
  },
  accuracyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  openMapsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  openMapsText: {
    color: "#FFF",
    fontWeight: "600",
  },
});
