import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG, STORAGE_KEYS } from "../utils/constants";

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor - adds auth token to requests
 */
api.interceptors.request.use(
  async (config) => {
    try {
      // Only read from AsyncStorage if not already set on defaults
      // (avoids race condition when token was just set via api.defaults.headers)
      if (!api.defaults.headers.common["Authorization"]) {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.warn("Error reading auth token:", error);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response interceptor - unwrap data, handle errors
 * NOTE: We do NOT clear the token here on 401.
 * authService.restoreSession() handles token clearing to avoid race conditions.
 */
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      return Promise.reject({
        code: "UNAUTHORIZED",
        message: "Session expired. Please log in again.",
      });
    }

    if (!error.response) {
      return Promise.reject({
        code: "NETWORK_ERROR",
        message: "Unable to connect. Please check your internet connection.",
      });
    }

    if (error.response.status >= 500) {
      return Promise.reject({
        code: "SERVER_ERROR",
        message: "Something went wrong. Please try again later.",
      });
    }

    return Promise.reject({
      code: error.response.data?.code || "ERROR",
      message: error.response.data?.message || "An error occurred.",
      details: error.response.data?.details,
    });
  },
);

export const apiHelpers = {
  setAuthToken: async (token) => {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    // Also set immediately on axios defaults to avoid async read delay
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  },

  clearAuthToken: async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    delete api.defaults.headers.common["Authorization"];
  },

  getAuthToken: async () => {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },
};

export default api;
