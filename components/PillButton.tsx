import React from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { Colors, Radius, FontFamily, FontSize, Depth, Shadow } from '../theme/tokens';
import { PressableRaised } from './depth/Raised';
import { hapticPress } from '../lib/haptics';

type Variant = 'primary' | 'secondary' | 'ghost' | 'apricot';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/** Face, ledge and label colour per variant. Ghost is flat: no ledge. */
const LOOK: Record<Variant, { face: string; ledge: string; label: string; rim?: string }> = {
  primary: { face: Colors.accent.main, ledge: Colors.accent.ledge, label: Colors.accent.on, rim: Shadow.rimOnColor },
  apricot: { face: Colors.brand.main, ledge: Colors.brand.ledge, label: Colors.brand.on, rim: Shadow.rimOnColor },
  secondary: { face: Colors.surface.card, ledge: Colors.surface.ledge, label: Colors.text.primary, rim: Shadow.rim },
  ghost: { face: 'transparent', ledge: 'transparent', label: Colors.accent.main },
};

const DISABLED = { face: Colors.surface.card2, ledge: Colors.surface.ledge, label: Colors.text.tertiary };

/** The 3D pressable button: a face on a solid ledge that sinks in on press. */
export default function PillButton({
  label, onPress, variant = 'primary', disabled, loading, style, textStyle,
}: Props) {
  const ghost = variant === 'ghost';
  const off = !!(disabled || loading);
  const look = disabled && !ghost ? DISABLED : LOOK[variant];
  return (
    <PressableRaised
      onPress={() => {
        if (!ghost) hapticPress();
        onPress();
      }}
      disabled={off}
      depth={ghost ? 0 : Depth.button}
      ledgeColor={look.ledge}
      radius={Radius.button}
      ambient={!ghost}
      style={style}
      faceStyle={[
        styles.face,
        { backgroundColor: look.face },
        !disabled && 'rim' in look && look.rim ? { boxShadow: look.rim } : null,
        ghost && disabled && styles.ghostDisabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: off, busy: !!loading }}
    >
      {loading ? (
        <ActivityIndicator color={look.label} />
      ) : (
        <Text style={[styles.label, { color: look.label }, textStyle]}>{label}</Text>
      )}
    </PressableRaised>
  );
}

const styles = StyleSheet.create({
  face: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  ghostDisabled: { opacity: 0.4 },
  label: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.button,
    letterSpacing: 0.2,
  },
});
