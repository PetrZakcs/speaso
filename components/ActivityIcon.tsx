import React from 'react';
import { View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Tints, type TintName } from '../theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Line icon on a pastel tile — the visual identity of each exercise / situation. */
export default function ActivityIcon({
  name, tint = 'sage', size = 44, muted = false,
}: { name: string; tint?: TintName; size?: number; muted?: boolean }) {
  const c = Tints[tint];
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size * 0.34, backgroundColor: muted ? Colors.surface.card2 : c.bg },
      ]}
    >
      <Ionicons name={name as IconName} size={size * 0.5} color={muted ? Colors.text.tertiary : c.fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
