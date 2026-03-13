// src/services/authService.js

import api, { apiHelpers } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';
import { createUser } from '../models/User';

/**
 * Helper — maps API user response to frontend user model
 */
const mapUser = (user) => createUser({
  id: user.id,
  displayName: user.displayName,
  initials: user.initials,
  preferredTone: user.preferredTone || 'Professional',
  isDarkMode: user.isDarkMode ?? true,
  linkedInConnected: user.linkedInConnected || false,
  linkedIn: user.linkedIn || { connected: false },
  stats: user.stats,
});

const authService = {
  /**
   * Register a new user
   */
  register: async ({ displayName, preferredTone = 'Professional' }) => {
    const response = await api.post('/auth/register', { displayName, preferredTone });
    const { user, token } = response;

    await apiHelpers.setAuthToken(token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

    return { user: mapUser(user), token };
  },

  /**
   * Anonymous login
   */
  loginAnonymous: async () => {
    const response = await api.post('/auth/anonymous');
    const { user, token } = response;

    await apiHelpers.setAuthToken(token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

    return { user: mapUser(user), token };
  },

  /**
   * Restore session from stored token
   */
  restoreSession: async () => {
    try {
      const token = await apiHelpers.getAuthToken();
      if (!token) return null;

      const response = await api.get('/auth/me');
      const { user } = response;

      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      return mapUser(user);
    } catch (error) {
      await authService.logout();
      return null;
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (updates) => {
    const response = await api.patch('/auth/profile', updates);
    const { user } = response;

    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return mapUser(user);
  },

  /**
   * Logout and clear session
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    }
    await apiHelpers.clearAuthToken();
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  },

  /**
   * Check if onboarding is complete
   */
  isOnboardingComplete: async () => {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
    return value === 'true';
  },

  /**
   * Mark onboarding as complete
   */
  completeOnboarding: async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
  },

  /**
   * Get locally stored user (for offline access)
   */
  getStoredUser: async () => {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (userData) {
        const parsed = JSON.parse(userData);
        return mapUser(parsed);
      }
      return null;
    } catch (error) {
      console.warn('Error reading stored user:', error);
      return null;
    }
  },
};

export default authService;