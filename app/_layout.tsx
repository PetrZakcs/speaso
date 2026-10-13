import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useStoreHydrated } from '../state/store';
import { Colors } from '../theme/tokens';
import { initPurchases } from '../lib/purchases';
import { useReminderSync } from '../lib/reminders';

SplashScreen.preventAutoHideAsync();

const STARTUP_TIMEOUT_MS = 5000;

export default function RootLayout() {
  const hydrated = useStoreHydrated();
  const [fontsLoaded, fontError] = useFonts({
    'Sora-Regular': require('../assets/fonts/Sora-Regular.ttf'),
    'Sora-SemiBold': require('../assets/fonts/Sora-SemiBold.ttf'),
    'Sora-Bold': require('../assets/fonts/Sora-Bold.ttf'),
    'Sora-ExtraBold': require('../assets/fonts/Sora-ExtraBold.ttf'),
    'DMSans-Regular': require('../assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Medium': require('../assets/fonts/DMSans-Medium.ttf'),
    'DMSans-SemiBold': require('../assets/fonts/DMSans-SemiBold.ttf'),
    'DMSans-Bold': require('../assets/fonts/DMSans-Bold.ttf'),
  });
  // Last-resort guard: never leave the user on a blank screen. If storage or
  // fonts haven't answered after a few seconds, start anyway.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setTimedOut(true), STARTUP_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, []);
  // Don't block the app if a font fails — the system font is fine.
  const ready = timedOut || (hydrated && (fontsLoaded || !!fontError));

  useEffect(() => {
    if (timedOut && !(hydrated && (fontsLoaded || fontError))) {
      console.warn('[startup] timed out waiting for', { hydrated, fontsLoaded, fontError: !!fontError });
    }
  }, [timedOut, hydrated, fontsLoaded, fontError]);
  useReminderSync(hydrated);

  useEffect(() => {
    initPurchases();
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);

  // Routing decisions (onboarding vs. home) depend on persisted state,
  // so nothing renders until the store has been rehydrated.
  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.bg.base }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg.base } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        {/* Full-screen pushes, not fullScreenModal: native full-screen modals report a zero
            top safe-area inset in react-native-safe-area-context, so headers hit the clock. */}
        <Stack.Screen name="exercise/[id]" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="situation/[id]" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="recordings" options={{ presentation: 'modal' }} />
        <Stack.Screen name="checkin" options={{ presentation: 'modal', animation: 'fade' }} />
        <Stack.Screen name="panic" options={{ presentation: 'modal', animation: 'fade' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
