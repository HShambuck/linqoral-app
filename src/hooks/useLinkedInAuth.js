// src/hooks/useLinkedInAuth.js

import { useState, useEffect, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../context/AuthContext';
import publishService from '../services/publishService';

const useLinkedInAuth = () => {
  const { refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState({
    connected: false,
    devTokenActive: false,
    profile: null,
  });

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const result = await publishService.getLinkedInStatus();
      setStatus(result);
      setError(null);
    } catch (err) {
      setError('Failed to load LinkedIn status');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, []);

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const authUrl = await publishService.getLinkedInAuthUrl();

      await WebBrowser.openBrowserAsync(authUrl, {
        showTitle: false,
        toolbarColor: '#0A66C2',
        secondaryToolbarColor: '#ffffff',
        enableBarCollapsing: true,
      });

      // Browser closed — refresh both LinkedIn status AND full user in AuthContext
      await Promise.all([refresh(), refreshUser()]);
    } catch (err) {
      setError('Failed to open LinkedIn login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [refresh, refreshUser]);

  const disconnect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await publishService.disconnectLinkedIn();
      setStatus({ connected: false, devTokenActive: false, profile: null });
      await refreshUser();
    } catch (err) {
      setError('Failed to disconnect LinkedIn. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [refreshUser]);

  return {
    status,
    isLoading,
    isRefreshing,
    error,
    connect,
    disconnect,
    refresh,
  };
};

const friendlyError = (error) => {
  const map = {
    access_denied: 'You declined LinkedIn access. Tap Connect to try again.',
    missing_params: 'Something went wrong with the LinkedIn redirect. Please try again.',
    invalid_state: 'Security check failed. Please try again.',
    user_not_found: 'Account not found. Please log out and back in.',
  };
  return map[error] || 'LinkedIn connection failed. Please try again.';
};

export default useLinkedInAuth;