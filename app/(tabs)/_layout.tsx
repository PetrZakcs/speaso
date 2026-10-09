import React from 'react';
import { Tabs, router } from 'expo-router';
import { TouchableOpacity, View, StyleSheet, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, FontFamily } from '../../theme/tokens';
import { useTranslation } from '../../i18n/useTranslation';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(active: IconName, inactive: IconName) {
  function TabIcon({ focused, color }: { focused: boolean; color: ColorValue }) {
    return <Ionicons name={focused ? active : inactive} size={22} color={color} />;
  }
  return TabIcon;
}

function PanicTabButton({ label }: { label: string }) {
  return (
    <TouchableOpacity
      onPress={() => router.push('/panic')}
      style={styles.panicWrap}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID="tab-panic"
    >
      <View style={styles.panicCircle}>
        <Ionicons name="pulse" size={24} color={Colors.text.primary} />
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
    marginTop: -22,
  },
  panicCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.danger.panic,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.danger.panic,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
});
