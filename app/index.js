// app/index.js

import { Redirect, usePathname } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useAuth } from '../src/context/AuthContext';

export default function Index() {
  const { isLoading, isAuthenticated } = useAuth();
  const pathname = usePathname();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🎙</Text>
        </View>
        <Text style={styles.appName}>Linquoral</Text>
        <ActivityIndicator size="small" color="#4F8EF7" style={styles.loader} />
      </View>
    );
  }

  // Don't redirect if we're already on a deep link screen
  if (pathname !== '/') return null;

  // Redirect based on auth state
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0C10',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#4F8EF7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoEmoji: {
    fontSize: 36,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#EAF0FF',
    marginBottom: 24,
  },
  loader: {
    marginTop: 8,
  },
});