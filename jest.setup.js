jest.mock(
  "@react-native-async-storage/async-storage",
  () => require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("expo-audio", () => ({
  AudioModule: {
    getRecordingPermissionsAsync: jest.fn(async () => ({ granted: true })),
    requestRecordingPermissionsAsync: jest.fn(async () => ({ granted: true })),
  },
  RecordingPresets: { HIGH_QUALITY: {} },
  useAudioRecorder: jest.fn(() => ({
    prepareToRecordAsync: jest.fn(async () => undefined),
    record: jest.fn(),
    stop: jest.fn(async () => undefined),
    uri: "file://mock-audio.m4a",
  })),
}));

jest.mock("expo-camera", () => {
  const React = require("react");
  const CameraView = React.forwardRef(({ children, ...props }, ref) =>
    React.createElement("CameraView", { ...props, ref }, children)
  );

  return {
    CameraView,
    useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn(async () => ({ granted: true }))]),
    useMicrophonePermissions: jest.fn(() => [{ granted: true }, jest.fn(async () => ({ granted: true }))]),
  };
});

jest.mock("expo-location", () => ({
  Accuracy: { Balanced: 3 },
  useForegroundPermissions: jest.fn(() => [{ granted: true }, jest.fn(async () => ({ granted: true }))]),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: { latitude: 0, longitude: 0 },
  })),
  reverseGeocodeAsync: jest.fn(async () => []),
}));

jest.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: { Light: "light", Medium: "medium" },
  NotificationFeedbackType: { Success: "success" },
  impactAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  selectionAsync: jest.fn(async () => undefined),
}));
