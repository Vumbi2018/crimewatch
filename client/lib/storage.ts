import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Evidence {
  id: string;
  type: "picture" | "video";
  uri: string;
  timestamp: number;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  incidentType: string | null;
  description: string | null;
  tags: string[];
  submissionStatus: "draft" | "pending" | "sent";
  submittedAt: number | null;
}

const EVIDENCE_STORAGE_KEY = "@crimestoppers_evidence";
const USER_PROFILE_KEY = "@crimestoppers_profile";

export interface UserProfile {
  displayName: string;
  badgeNumber: string;
  avatarType: "shield" | "star" | "checkmark" | "eye";
  totalSubmissions: number;
  totalEvidence: number;
}

const defaultProfile: UserProfile = {
  displayName: "Anonymous User",
  badgeNumber: "",
  avatarType: "shield",
  totalSubmissions: 0,
  totalEvidence: 0,
};

export async function getAllEvidence(): Promise<Evidence[]> {
  try {
    const data = await AsyncStorage.getItem(EVIDENCE_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error("Error getting evidence:", error);
    return [];
  }
}

export async function getEvidenceById(id: string): Promise<Evidence | null> {
  try {
    const evidence = await getAllEvidence();
    return evidence.find((e) => e.id === id) || null;
  } catch (error) {
    console.error("Error getting evidence by id:", error);
    return null;
  }
}

export async function saveEvidence(evidence: Evidence): Promise<void> {
  try {
    const allEvidence = await getAllEvidence();
    const existingIndex = allEvidence.findIndex((e) => e.id === evidence.id);
    
    if (existingIndex >= 0) {
      allEvidence[existingIndex] = evidence;
    } else {
      allEvidence.unshift(evidence);
    }
    
    await AsyncStorage.setItem(EVIDENCE_STORAGE_KEY, JSON.stringify(allEvidence));
  } catch (error) {
    console.error("Error saving evidence:", error);
    throw error;
  }
}

export async function deleteEvidence(id: string): Promise<void> {
  try {
    const allEvidence = await getAllEvidence();
    const filtered = allEvidence.filter((e) => e.id !== id);
    await AsyncStorage.setItem(EVIDENCE_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting evidence:", error);
    throw error;
  }
}

export async function updateEvidenceSubmissionStatus(
  id: string,
  status: Evidence["submissionStatus"]
): Promise<void> {
  try {
    const evidence = await getEvidenceById(id);
    if (evidence) {
      evidence.submissionStatus = status;
      if (status === "sent") {
        evidence.submittedAt = Date.now();
      }
      await saveEvidence(evidence);
    }
  } catch (error) {
    console.error("Error updating submission status:", error);
    throw error;
  }
}

export async function getUserProfile(): Promise<UserProfile> {
  try {
    const data = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (data) {
      return { ...defaultProfile, ...JSON.parse(data) };
    }
    return defaultProfile;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return defaultProfile;
  }
}

export async function saveUserProfile(profile: Partial<UserProfile>): Promise<void> {
  try {
    const currentProfile = await getUserProfile();
    const updatedProfile = { ...currentProfile, ...profile };
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([EVIDENCE_STORAGE_KEY, USER_PROFILE_KEY]);
  } catch (error) {
    console.error("Error clearing all data:", error);
    throw error;
  }
}

export function generateEvidenceId(): string {
  return `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
