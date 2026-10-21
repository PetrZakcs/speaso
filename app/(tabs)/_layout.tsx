import React from 'react';
import { Tabs, router } from 'expo-router';
import { Pressable, View, StyleSheet, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Calm, Colors, Depth, FontFamily } from '../../theme/tokens';
import WaveGlyph from '../../components/brand/WaveGlyph';
import { useBreath } from '../../lib/breath';
import { useTranslation } from '../../i18n/useTranslation';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ORB_SIZE = 58;
/** Orb ledge: between the button depth and the hero depth so it fits the tab bar. */
const ORB_DEPTH = Depth.button + 1;

function tabIcon(active: IconName, inactive: IconName) {
  function TabIcon({ focused, color }: { focused: boolean; color: ColorValue }) {
    return <Ionicons name={focused ? active : inactive} size={22} color={color} />;
  }
  return TabIcon;
}

/**
 * Panic is a calm place, not an alarm: a deep green orb on its own ledge,
 * breathing slowly with the app's rhythm and sinking in when pressed.
 */
function PanicTabButton({ label }: { label: string }) {
  const breath = useBreath();
  const pressed = useSharedValue(0);
  const breathing = useAnimatedStyle(() => ({ transform: [{ scale: 1 + breath.value * 0.06 }] }));
  const face = useAnimatedStyle(() => ({ transform: [{ translateY: pressed.value * ORB_DEPTH }] }));
  return (
    <Pressable
      onPress={() => router.push('/panic')}
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: 90 });
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, { damping: 14, stiffness: 220 });
      }}
      style={styles.panicWrap}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID="tab-panic"
    >
      <Animated.View style={[styles.orb, breathing]}>
        <View style={styles.orbLedge} />
        <Animated.View style={[styles.orbFace, face]}>
          <WaveGlyph size={28} color={Calm.text} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bg.elevated,
          borderTopColor: Colors.hairline,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarActiveTintColor: Colors.accent.main,
        tabBarInactiveTintColor: Colors.text.tertiary,
        tabBarLabelStyle: { fontFamily: FontFamily.dmSansMedium, fontSize: 10 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: t('tabbar.home'), tabBarIcon: tabIcon('home', 'home-outline'), tabBarButtonTestID: 'tab-home' }}
      />
      <Tabs.Screen
        name="exercises"
        options={{ title: t('tabbar.exercises'), tabBarIcon: tabIcon('mic', 'mic-outline'), tabBarButtonTestID: 'tab-exercises' }}
      />
      <Tabs.Screen
        name="panic-tab"
        options={{
          title: t('tabbar.panic'),
          tabBarButton: () => <PanicTabButton label={t('tabbar.panic')} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: t('tabbar.progress'), tabBarIcon: tabIcon('stats-chart', 'stats-chart-outline'), tabBarButtonTestID: 'tab-progress' }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('tabbar.profile'), tabBarIcon: tabIcon('person', 'person-outline'), tabBarButtonTestID: 'tab-profile' }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  panicWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE + ORB_DEPTH,
  },
  orbLedge: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ORB_DEPTH,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    backgroundColor: Calm.ledge,
    boxShadow: '0px 14px 26px rgba(14,26,20,0.35)',
  },
  orbFace: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    backgroundColor: Calm.bgFrom,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 0px 2px 0px rgba(255,255,255,0.25), inset 0px -10px 18px rgba(116,198,154,0.18)',
  },
});
