// app/linkedin-connected.js
import { useEffect, useRef } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import authService from "../src/services/authService";
import { apiHelpers } from "../src/services/api";
import api from "../src/services/api";

export default function LinkedInConnectedScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { refreshUser, dispatch } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const handle = async () => {
      const success = params.success === "true";
      const recovered = params.recovered === "true";
      const recoveryToken = params.token;

      if (success && recovered && recoveryToken) {
        // Set token immediately on axios and AsyncStorage
        await apiHelpers.setAuthToken(recoveryToken);
        api.defaults.headers.common["Authorization"] =
          `Bearer ${recoveryToken}`;

        // Fetch fresh user with the new token
        const user = await authService.restoreSession();
        if (user) {
          const isOnboardingComplete = await authService.isOnboardingComplete();
          // Dispatch LOGIN_SUCCESS so isAuthenticated becomes true
          // (handles case where user was on welcome screen with no session)
          dispatch({
            type: "LOGIN_SUCCESS",
            payload: { user, isOnboardingComplete },
          });
        }
        router.replace("/(tabs)/settings");
      } else if (success) {
        // Normal connect — refresh user to pick up new linkedIn fields
        await refreshUser();
        router.replace("/(tabs)/settings");
      } else {
        // Failed — go back
        router.replace("/(tabs)");
      }
    };

    handle();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4F8EF7" />
      <Text style={styles.text}>Finishing up...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A0C10",
    gap: 16,
  },
  text: { fontSize: 15, color: "#9AAAC4" },
});
