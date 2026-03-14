// src/context/SubscriptionContext.js

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const SubscriptionContext = createContext(null);

export const SubscriptionProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState({
    tier: "free",
    isPro: false,
    expiresAt: null,
  });
  const [usage, setUsage] = useState({
    aiRefinementsUsed: 0,
    aiRefinementsLimit: 3,
    recordingSecondsUsed: 0,
    recordingSecondsLimit: 120,
    canSchedule: false,
    resetsAt: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const response = await api.get("/subscription/status");
      setSubscription(response.subscription);
      setUsage(response.usage);
    } catch (error) {
      console.warn("Failed to fetch subscription status:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchStatus();
  }, [isAuthenticated]);

  const upgrade = async () => {
    try {
      const response = await api.post("/subscription/upgrade", {});
      setSubscription(response.subscription);
      await fetchStatus();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Check if user can use AI refinement
  const canUseAIRefinement = () => {
    if (subscription.isPro) return true;
    return usage.aiRefinementsUsed < usage.aiRefinementsLimit;
  };

  // Check if user can record given duration in seconds
  const canRecord = (durationSeconds) => {
    if (subscription.isPro) return true;
    return durationSeconds <= (usage.recordingSecondsLimit || 120);
  };

  const canSchedule = () => subscription.isPro || usage.canSchedule;

  const aiRefinementsRemaining = () => {
    if (subscription.isPro) return Infinity;
    return Math.max(0, usage.aiRefinementsLimit - usage.aiRefinementsUsed);
  };

  const value = {
    subscription,
    usage,
    isLoading,
    isPro: subscription.isPro,
    fetchStatus,
    upgrade,
    canUseAIRefinement,
    canRecord,
    canSchedule,
    aiRefinementsRemaining,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context)
    throw new Error("useSubscription must be used within SubscriptionProvider");
  return context;
};

export default SubscriptionContext;
