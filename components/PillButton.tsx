import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, FontFamily, FontSize } from '../theme/tokens';

type Variant = 'primary' | 'success' | 'gold' | 'purple' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const gradients: Record<Variant, readonly [string, string]> = {
  primary: ['#1741C4', '#2563EB'],
  success: ['#059669', '#10B981'],
  gold: ['#d97706', '#F59E0B'],
  purple: ['#8B5CF6', '#6d28d9'],
  ghost: ['transparent', 'transparent'],
};

export default function PillButton({ label, onPress, variant = 'primary', disabled, loading, style, textStyle }: Props) {
  const colors = gradients[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[styles.outer, disabled && styles.disabled, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
    >
      <LinearGradient
        colors={colors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, variant === 'ghost' && styles.ghostBorder]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.text.primary} />
        ) : (
          <Text style={[styles.label, textStyle]}>{label}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: Radius.pill,
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  gradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  disabled: {
    opacity: 0.45,
  },
  ghostBorder: {
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  label: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.body,
    color: Colors.text.primary,
    letterSpacing: 0.2,
  },
});
