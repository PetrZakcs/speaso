import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { Colors, Radius, FontFamily, FontSize } from '../theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function PillButton({
  label, onPress, variant = 'primary', disabled, loading, style, textStyle,
}: Props) {
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.base, styles[variant], disabled && styles.disabled, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? Colors.accent.on : Colors.text.primary} />
      ) : (
        <Text style={[styles.label, isPrimary && styles.labelPrimary, textStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 54,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  primary: { backgroundColor: Colors.accent.main },
  secondary: { backgroundColor: Colors.surface.card2 },
  ghost: { borderWidth: 1, borderColor: Colors.hairline },
  disabled: { opacity: 0.4 },
  label: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.body,
    color: Colors.text.primary,
  },
  labelPrimary: { color: Colors.accent.on },
});
