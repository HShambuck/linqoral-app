// src/hooks/useLinkedInAuth.js
import { useState, useCallback } from "react";
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export const useLinkedInAuth = () => {
  const { refreshUser } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connectLinkedIn = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const response = await api.get("/publish/linkedin/auth-url");
      const authUrl = response.authUrl;
      if (!authUrl) throw new Error("Could not get LinkedIn auth URL");

      await WebBrowser.openBrowserAsync(authUrl, {
        showTitle: false,
        enableBarCollapsing: true,
        showInRecents: false,
      });

      // linkedin-connected.js screen handles refreshUser after OAuth
      setIsConnecting(false);
    } catch (err) {
      setError(err.message || "Failed to connect LinkedIn");
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await api.post("/publish/linkedin/disconnect");
      await refreshUser();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [refreshUser]);

  return {
    connectLinkedIn,
    disconnect,
    isConnecting,
    error,
    clearError: () => setError(null),
  };
};
