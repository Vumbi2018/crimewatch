import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import HomeScreen from "@/screens/HomeScreen";
import EvidenceDetailScreen from "@/screens/EvidenceDetailScreen";
import MapViewScreen from "@/screens/MapViewScreen";
import ReportSubmissionScreen from "@/screens/ReportSubmissionScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import ReportTypeSelectionScreen from "@/screens/ReportTypeSelectionScreen";
import BehalfReportScreen from "@/screens/BehalfReportScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

// Officer Screens
import OfficerLoginScreen from "@/screens/OfficerLoginScreen";
import OfficerDashboardScreen from "@/screens/OfficerDashboardScreen";
import OfficerAssignmentDetailScreen from "@/screens/OfficerAssignmentDetailScreen";

import { getOfficerProfile } from "@/lib/storage";
import ExpoConstants from "expo-constants";

export type RootStackParamList = {
  // Citizen screens
  Home: undefined;
  MainTabs: undefined;
  EvidenceDetail: { evidenceId: string };
  MapView: { latitude: number; longitude: number; address?: string };
  ReportSubmission: { evidenceId: string };
  Settings: undefined;
  ReportTypeSelection: undefined;
  BehalfReport: undefined;

  // Officer screens
  OfficerLogin: undefined;
  OfficerDashboard: undefined;
  OfficerAssignmentDetail: { assignmentId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const appMode = ExpoConstants.expoConfig?.extra?.appMode || "citizen";

  const [loading, setLoading] = useState(appMode === "officer");
  const [isOfficerLoggedIn, setIsOfficerLoggedIn] = useState(false);

  useEffect(() => {
    if (appMode === "officer") {
      getOfficerProfile().then((profile) => {
        if (profile) {
          setIsOfficerLoggedIn(true);
        }
        setLoading(false);
      });
    }
  }, [appMode]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F172A", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (appMode === "officer") {
    return (
      <Stack.Navigator screenOptions={screenOptions}>
        {!isOfficerLoggedIn ? (
          <Stack.Screen name="OfficerLogin" options={{ headerShown: false }}>
            {(props) => (
              <OfficerLoginScreen
                {...props}
                onLoginSuccess={() => setIsOfficerLoggedIn(true)}
              />
            )}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="OfficerDashboard" options={{ headerShown: false }}>
              {(props) => (
                <OfficerDashboardScreen
                  {...props}
                  onLogout={() => setIsOfficerLoggedIn(false)}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="OfficerAssignmentDetail"
              component={OfficerAssignmentDetailScreen}
              options={{
                headerTitle: "Incident Details",
                headerTransparent: false,
                headerStyle: { backgroundColor: "#1E293B" },
                headerTintColor: "#FFFFFF",
              }}
            />
          </>
        )}
      </Stack.Navigator>
    );
  }

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
      <Stack.Screen
        name="ReportTypeSelection"
        component={ReportTypeSelectionScreen}
        options={{
          headerTitle: "Report Incident",
          headerTransparent: false,
        }}
      />
      <Stack.Screen
        name="BehalfReport"
        component={BehalfReportScreen}
        options={{
          headerTitle: "Report on Behalf",
          headerTransparent: false,
        }}
      />
    </Stack.Navigator>
  );
}
