import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, HitSlop } from '../theme/tokens';

interface Props {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  style?: ViewStyle;
}

/** Round icon-only button (close, back). Always requires an a11y label. */
export default function IconButton({ icon, onPress, accessibilityLabel, size = 38, style }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={HitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.btn, { width: size, height: size, borderRadius: size / 2 }, style]}
    >
      <Ionicons name={icon} size={size * 0.47} color={Colors.text.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: Colors.surface.card,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
