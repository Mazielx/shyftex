import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../config/theme';
import { useAuthStore } from '../stores/AppStore';
import { useLocation } from '../hooks/useLocation';

/**
 * Initializes location tracking on app start.
 * Renders as a side-effect component (no UI).
 */
function LocationInitializer() {
  // This triggers the useLocation hook which auto-fetches location when authenticated
  useLocation();
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
      <StatusBar style="light" />
      <LocationInitializer />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.textInverse,
          headerTitleStyle: { fontWeight: '600' },
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
