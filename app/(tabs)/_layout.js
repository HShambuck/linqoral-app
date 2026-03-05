// app/(tabs)/_layout.js

import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../src/context/UserContext";

// Minimum bottom padding — covers Android devices that report insets.bottom = 0
// but still have a software navigation bar eating into the screen
const MIN_BOTTOM_PADDING = Platform.OS === "android" ? 16 : 10;
const TAB_BAR_BASE_HEIGHT = 60;

export default function TabLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Use whichever is larger: the device's reported inset or our minimum
  const bottomPadding = Math.max(insets.bottom, MIN_BOTTOM_PADDING);
  const tabBarHeight = TAB_BAR_BASE_HEIGHT + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingTop: 10,
          paddingBottom: bottomPadding,
          // Ensure tab bar sits above the system nav bar on all Android devices
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
        },
        // Pass the computed height to screens so they can pad their content
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: "Record",
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.recordButton,
                { backgroundColor: theme.primary },
                focused && styles.recordButtonFocused,
              ]}
            >
              <View style={styles.recordDot} />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="drafts"
        options={{
          title: "Drafts",
          tabBarIcon: ({ color }) => <DraftsIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <SettingsIcon color={color} />,
        }}
      />
    </Tabs>
  );
}

// ─── Geometric tab icons (no emoji — consistent across all Android devices) ──

const HomeIcon = ({ color }) => (
  <View
    style={{
      width: 22,
      height: 22,
      alignItems: "center",
      justifyContent: "flex-end",
    }}
  >
    {/* Roof */}
    <View
      style={{
        position: "absolute",
        top: 0,
        width: 0,
        height: 0,
        borderLeftWidth: 11,
        borderRightWidth: 11,
        borderBottomWidth: 9,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: color,
      }}
    />
    {/* Walls */}
    <View
      style={{
        width: 14,
        height: 10,
        borderWidth: 2,
        borderColor: color,
        borderTopWidth: 0,
      }}
    />
    {/* Door */}
    <View
      style={{
        position: "absolute",
        bottom: 0,
        width: 5,
        height: 6,
        borderWidth: 2,
        borderColor: color,
        borderBottomWidth: 0,
      }}
    />
  </View>
);

const DraftsIcon = ({ color }) => (
  <View
    style={{
      width: 22,
      height: 22,
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <View
      style={{
        width: 16,
        height: 18,
        borderRadius: 3,
        borderWidth: 2,
        borderColor: color,
      }}
    />
    <View
      style={{
        position: "absolute",
        top: 7,
        left: 6,
        width: 10,
        height: 2,
        backgroundColor: color,
        borderRadius: 1,
      }}
    />
    <View
      style={{
        position: "absolute",
        top: 11,
        left: 6,
        width: 7,
        height: 2,
        backgroundColor: color,
        borderRadius: 1,
      }}
    />
  </View>
);

const SettingsIcon = ({ color }) => (
  <View
    style={{
      width: 22,
      height: 22,
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <View
      style={{
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: color,
      }}
    />
    <View
      style={{
        position: "absolute",
        width: 6,
        height: 6,
        borderRadius: 3,
        borderWidth: 2,
        borderColor: color,
        backgroundColor: "transparent",
      }}
    />
  </View>
);

const styles = StyleSheet.create({
  recordButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    shadowColor: "#4F8EF7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  recordButtonFocused: {
    shadowOpacity: 0.7,
    elevation: 14,
  },
  recordDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#fff",
  },
});
