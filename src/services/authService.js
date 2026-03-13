// src/services/authService.js

import api, { apiHelpers } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../utils/constants";
import { createUser } from "../models/User";

const mapUser = (user) =>
  createUser({
    id: user.id,
    displayName: user.displayName,
    initials: user.initials,
    preferredTone: user.preferredTone || "Professional",
    isDarkMode: user.isDarkMode ?? true,
    linkedInConnected: user.linkedInConnected || false,
    linkedIn: user.linkedIn || { connected: false },
    stats: user.stats,
  });

const authService = {
  register: async ({ displayName, preferredTone = "Professional" }) => {
    const response = await api.post("/auth/register", {
      displayName,
      preferredTone,
    });
    const { user, token } = response;
    await apiHelpers.setAuthToken(token); // sets AsyncStorage + axios header
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return { user: mapUser(user), token };
  },

  loginAnonymous: async () => {
    const response = await api.post("/auth/anonymous");
    const { user, token } = response;
    await apiHelpers.setAuthToken(token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return { user: mapUser(user), token };
  },

  restoreSession: async () => {
    try {
      const token = await apiHelpers.getAuthToken();
      if (!token) return null;

      // Ensure axios has the token before the request fires
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      const response = await api.get("/auth/me");
      const { user } = response;

      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      return mapUser(user);
    } catch (error) {
      // On any failure, clear the bad token — do NOT call logout() as it
      // triggers another API call that will also fail and cause loops
      await apiHelpers.clearAuthToken();
      return null;
    }
  },

  updateProfile: async (updates) => {
    const response = await api.patch("/auth/profile", updates);
    const { user } = response;
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return mapUser(user);
  },

  logout: async () => {
    // Clear locally first
    await apiHelpers.clearAuthToken();
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    // Then fire API — ignore failures, we're already logged out locally
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.warn("Logout API call failed:", error);
    }
  },

  isOnboardingComplete: async () => {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
    return value === "true";
  },

  completeOnboarding: async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, "true");
  },

  clearToken: async () => {
    await apiHelpers.clearAuthToken();
  },

  getStoredUser: async () => {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (userData) return createUser(JSON.parse(userData));
      return null;
    } catch {
      return null;
    }
  },
};

export default authService;
