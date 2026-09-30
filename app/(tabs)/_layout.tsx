import React from 'react';
import { Tabs, router } from 'expo-router';
import { TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize } from '../../theme/tokens';
import { useTranslation } from '../../i18n/useTranslation';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    home: focused
      ? 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10'
      : 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
    exercises:
      'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 0v10l4 2',
    progress: 'M3 3v18h18 M18 9l-5 5-4-4-3 3',
    profile: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  };

  const color = focused ? Colors.primary.blue : Colors.text.tertiary;

  return (
    <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color, fontSize: focused ? 22 : 20 }}>
        {name === 'home' ? '⌂' : name === 'exercises' ? '◉' : name === 'progress' ? '↗' : '◎'}
      </Text>
    </View>
  );
}

function PanicTabButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.panicWrap} activeOpacity={0.85}>
      <View style={styles.panicCircle}>
        <Text style={styles.panicLabel}>🆘</Text>
      </View>
    </TouchableOpacity>
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
        tabBarActiveTintColor: Colors.primary.blue,
        tabBarInactiveTintColor: Colors.text.tertiary,
        tabBarLabelStyle: {
          fontFamily: FontFamily.dmSansMedium,
          fontSize: 10,
          marginTop: -4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabbar.home'),
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: t('tabbar.exercises'),
          tabBarIcon: ({ focused }) => <TabIcon name="exercises" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="panic-tab"
        options={{
          title: '',
          tabBarButton: () => (
            <PanicTabButton onPress={() => router.push('/panic')} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t('tabbar.progress'),
          tabBarIcon: ({ focused }) => <TabIcon name="progress" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabbar.profile'),
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  panicWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    width: 64,
  },
  panicCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.danger.panic,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.danger.panic,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  panicLabel: { fontSize: 22 },
});
