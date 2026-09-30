import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useStoreHydrated } from '../state/store';
import { Colors } from '../theme/tokens';
import { initPurchases } from '../lib/purchases';

SplashScreen.preventAutoHideAsync();

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
  // Don't block the app forever if a font fails — system font is fine.
  const ready = hydrated && (fontsLoaded || !!fontError);

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
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg.base } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="exercise/[id]" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="panic" options={{ presentation: 'modal', animation: 'fade' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
