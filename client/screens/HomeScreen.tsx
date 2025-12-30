import React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ImageBackground,
  Image,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const policeCarImage = require("../../assets/images/generated/police_car.png");
const policeEmblem = require("../../assets/images/generated/police_emblem.png");

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const handleGetStarted = () => {
    navigation.navigate("MainTabs");
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={policeCarImage}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        
        <View
          style={[
            styles.content,
            {
              paddingTop: insets.top + Spacing.xl,
              paddingBottom: insets.bottom + Spacing.xl,
            },
          ]}
        >
          <Animated.View 
            entering={FadeInUp.delay(200).duration(800)}
            style={styles.header}
          >
            <View style={styles.logoContainer}>
              <Image 
                source={policeEmblem} 
                style={styles.emblemImage}
                resizeMode="contain"
              />
            </View>
            <ThemedText style={styles.title}>Crimestoppers</ThemedText>
          </Animated.View>

          <Animated.View 
            entering={FadeIn.delay(600).duration(800)}
            style={styles.taglineContainer}
          >
            <ThemedText style={styles.tagline}>
              Report crimes safely and anonymously
            </ThemedText>
            <ThemedText style={styles.taglineSecondary}>
              Capture evidence, protect your community
            </ThemedText>
          </Animated.View>

          <Animated.View 
            entering={FadeInUp.delay(1000).duration(800)}
            style={styles.buttonContainer}
          >
            <Pressable
              style={({ pressed }) => [
                styles.getStartedButton,
                pressed && styles.getStartedButtonPressed,
              ]}
              onPress={handleGetStarted}
            >
              <ThemedText style={styles.getStartedText}>Get Started</ThemedText>
            </Pressable>
          </Animated.View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginTop: Spacing["2xl"],
  },
  logoContainer: {
    marginBottom: Spacing.lg,
  },
  emblemImage: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 1,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 28,
    fontWeight: "600",
    color: Colors.light.accent,
    letterSpacing: 4,
    marginTop: Spacing.xs,
  },
  taglineContainer: {
    alignItems: "center",
  },
  tagline: {
    fontSize: 18,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.95)",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  taglineSecondary: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  },
  buttonContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  getStartedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.md + 4,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    width: "100%",
    maxWidth: 320,
  },
  getStartedButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },
});
