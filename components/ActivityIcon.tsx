import React from 'react';
import { View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Line icon on a soft tinted square — used for exercises and situations. */
export default function ActivityIcon({
  name, size = 44, muted = false,
}: { name: string; size?: number; muted?: boolean }) {
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size * 0.32 },
        muted && styles.muted,
      ]}
    >
      <Ionicons
        name={name as IconName}
        size={size * 0.5}
        color={muted ? Colors.text.tertiary : Colors.accent.main}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: Colors.accent.soft, alignItems: 'center', justifyContent: 'center' },
  muted: { backgroundColor: Colors.surface.card2 },
});
