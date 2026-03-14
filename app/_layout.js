// app/_layout.js

import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";

import { AuthProvider } from "../src/context/AuthContext";
import { UserProvider } from "../src/context/UserContext";
import { DraftProvider } from "../src/context/DraftContext";
import { SubscriptionProvider } from "../src/context/SubscriptionContext";

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after a short delay
    const hideSplash = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await SplashScreen.hideAsync();
    };
    hideSplash();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <UserProvider>
            <SubscriptionProvider>
              <DraftProvider>
                <StatusBar style="light" />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen
                    name="linkedin-connected"
                    options={{
                      headerShown: false,
                      animation: "fade",
                    }}
                  />
                  <Stack.Screen
                    name="editor/[id]"
                    options={{
                      presentation: "card",
                      animation: "slide_from_right",
                    }}
                  />
                  <Stack.Screen
                    name="publish/options"
                    options={{
                      presentation: "card",
                      animation: "slide_from_right",
                    }}
                  />
                  <Stack.Screen
                    name="publish/schedule"
                    options={{
                      presentation: "card",
                      animation: "slide_from_right",
                    }}
                  />
                </Stack>
              </DraftProvider>
            </SubscriptionProvider>
          </UserProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
