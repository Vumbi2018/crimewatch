import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import HomeScreen from "@/screens/HomeScreen";
import EvidenceDetailScreen from "@/screens/EvidenceDetailScreen";
import MapViewScreen from "@/screens/MapViewScreen";
import ReportSubmissionScreen from "@/screens/ReportSubmissionScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RootStackParamList = {
  Home: undefined;
  MainTabs: undefined;
  EvidenceDetail: { evidenceId: string };
  MapView: { latitude: number; longitude: number; address?: string };
  ReportSubmission: { evidenceId: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EvidenceDetail"
        component={EvidenceDetailScreen}
        options={{
          headerTitle: "Evidence Details",
          headerTransparent: false,
        }}
      />
      <Stack.Screen
        name="MapView"
        component={MapViewScreen}
        options={{
          presentation: "modal",
          headerTitle: "Location",
        }}
      />
      <Stack.Screen
        name="ReportSubmission"
        component={ReportSubmissionScreen}
        options={{
          headerTitle: "Submit Report",
          headerTransparent: false,
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerTitle: "Settings",
          headerTransparent: false,
        }}
      />
    </Stack.Navigator>
  );
}
