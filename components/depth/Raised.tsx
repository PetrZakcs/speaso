import React from 'react';
import {
  View, Pressable, StyleSheet, type StyleProp, type ViewStyle, type ViewProps, type PressableProps,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { Shadow } from '../../theme/tokens';

/** Style keys that place the element in its parent; everything else styles the face. */
const LAYOUT_KEYS = new Set<string>([
  'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf',
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
  'marginHorizontal', 'marginVertical', 'marginStart', 'marginEnd',
  'width', 'minWidth', 'maxWidth',
  'position', 'top', 'bottom', 'left', 'right', 'zIndex',
]);

/** Splits a caller's style into the outer (layout) part and the face part. */
export function splitLayoutStyle(style: StyleProp<ViewStyle>) {
  const flat = StyleSheet.flatten(style) ?? {};
  const outer: Record<string, unknown> = {};
  const face: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(flat)) (LAYOUT_KEYS.has(k) ? outer : face)[k] = v;
  return { outer: outer as ViewStyle, face: face as ViewStyle };
}

interface LedgeProps {
  depth: number;
  ledgeColor: string;
  radius: number;
  /** Soft ambient shadow under the ledge. */
  ambient?: boolean;
}

function Ledge({ depth, ledgeColor, radius, ambient }: LedgeProps) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.ledge,
        { top: depth, borderRadius: radius, backgroundColor: ledgeColor },
        ambient && { boxShadow: Shadow.ambient },
      ]}
    />
  );
}

type RaisedProps = LedgeProps & Omit<ViewProps, 'style'> & {
  children?: React.ReactNode;
  /** Layout keys go to the outer box, the rest to the face. */
  style?: StyleProp<ViewStyle>;
  faceStyle?: StyleProp<ViewStyle>;
};

/** A static raised surface: a face standing on a solid ledge `depth` px tall. */
export function Raised({ depth, ledgeColor, radius, ambient = true, children, style, faceStyle, ...rest }: RaisedProps) {
  const { outer, face } = splitLayoutStyle(style);
  return (
    <View {...rest} style={[{ paddingBottom: depth }, outer]}>
      <Ledge depth={depth} ledgeColor={ledgeColor} radius={radius} ambient={ambient} />
      <View style={[styles.face, { borderRadius: radius }, faceStyle, face]}>{children}</View>
    </View>
  );
}

type PressableRaisedProps = LedgeProps & Omit<PressableProps, 'style' | 'children'> & {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  faceStyle?: StyleProp<ViewStyle>;
};

/** A raised face that sinks into its ledge while pressed. */
export function PressableRaised({
  depth, ledgeColor, radius, ambient = true, children, style, faceStyle, onPressIn, onPressOut, disabled, ...rest
}: PressableRaisedProps) {
  const { outer, face } = splitLayoutStyle(style);
  const pressed = useSharedValue(0);
  const faceAnim = useAnimatedStyle(() => ({ transform: [{ translateY: pressed.value * depth }] }));

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        pressed.value = withTiming(1, { duration: 90 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withSpring(0, { damping: 14, stiffness: 220 });
        onPressOut?.(e);
      }}
      style={[{ paddingBottom: depth }, outer]}
    >
      <Ledge depth={depth} ledgeColor={ledgeColor} radius={radius} ambient={ambient && !disabled} />
      <Animated.View style={[styles.face, { borderRadius: radius }, faceStyle, face, faceAnim]}>{children}</Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ledge: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  face: { flexGrow: 1 },
});
