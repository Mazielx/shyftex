import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../config/theme';
import { useAuthStore } from '../stores/AppStore';
import { useLocation } from '../hooks/useLocation';

/**
 * Initializes location tracking after authentication.
 * Only fetches GPS when user is logged in.
 */
function LocationInitializer() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const restoreSession = useAuthStore((s) => s.restoreSession);

  // Only fetch location after auth is confirmed
  useLocation(isAuthenticated);

  return null;
}

export default function RootLayout() {
  // Restore session from SecureStore on app boot
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <LocationInitializer />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: {
            fontWeight: '600',
            color: colors.textPrimary,
          },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(shopping)" options={{ headerShown: false }} />
        <Stack.Screen name="(mission)" options={{ headerShown: false }} />
        <Stack.Screen name="(settings)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
