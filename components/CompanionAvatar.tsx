import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Ellipse,
  Path,
  Defs,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';
import { CUSTOM_MASCOT_SOURCE } from './companion/companionAsset';
import { useBreath } from '../lib/breath';
import { hapticPress } from '../lib/haptics';
import { Colors, FontFamily, FontSize, Radius, Shadow } from '../theme/tokens';

export type CompanionMood = 'idle' | 'breathing' | 'celebrate' | 'wisdom' | 'listening' | 'sleeping';

export interface CompanionAvatarProps {
  size?: number;
  mood?: CompanionMood;
  message?: string;
  customSource?: ImageSourcePropType | null;
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * Procedural SVG Companion Mascot ("Speasy Companion")
 * Renders an organic, friendly and tactile character that breathes, floats,
 * blinks, celebrates and reacts to user touch.
 *
 * When the user or designer provides their custom illustration (PNG/SVG),
 * it seamlessly plugs into `customSource` or `CUSTOM_MASCOT_SOURCE` in `companionAsset.ts`.
 */
export default function CompanionAvatar({
  size = 80,
  mood = 'idle',
  message,
  customSource,
  onPress,
  style,
}: CompanionAvatarProps) {
  const breath = useBreath(mood === 'breathing' || mood === 'idle');
  const wobble = useSharedValue(0);
  const celebrateJump = useSharedValue(0);
  const [blinking, setBlinking] = useState(false);

  // Periodic eye blink effect for realistic living feel
  useEffect(() => {
    if (mood === 'sleeping' || mood === 'breathing') return;
    const interval = setInterval(() => {
      setBlinking(true);
      const timer = setTimeout(() => setBlinking(false), 160);
      return () => clearTimeout(timer);
    }, 4000);
    return () => clearInterval(interval);
  }, [mood]);

  // Celebrate bounce animation
  useEffect(() => {
    if (mood === 'celebrate') {
      celebrateJump.value = withRepeat(
        withSequence(
          withTiming(-12, { duration: 320, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 280, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        true,
      );
    } else {
      celebrateJump.value = withTiming(0, { duration: 200 });
    }
    return () => cancelAnimation(celebrateJump);
  }, [mood, celebrateJump]);

  const handlePress = () => {
    hapticPress();
    wobble.value = withSequence(
      withSpring(-8, { damping: 4, stiffness: 200 }),
      withSpring(8, { damping: 4, stiffness: 200 }),
      withSpring(0, { damping: 6, stiffness: 150 }),
    );
    onPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => {
    const scale =
      mood === 'breathing'
        ? 0.94 + breath.value * 0.16
        : mood === 'idle'
          ? 0.98 + breath.value * 0.05
          : 1;

    const translateY =
      mood === 'celebrate'
        ? celebrateJump.value
        : mood === 'idle'
          ? -breath.value * 4
          : 0;

    return {
      transform: [
        { translateY },
        { scale },
        { rotate: `${wobble.value}deg` },
      ],
    };
  });

  const source = customSource ?? CUSTOM_MASCOT_SOURCE;

  return (
    <View style={[styles.wrapper, style]}>
      {!!message && (
        <View style={[styles.bubble, Shadow.card]}>
          <Text style={styles.bubbleText}>{message}</Text>
          <View style={styles.bubbleTail} />
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        disabled={!onPress}
        style={{ width: size, height: size }}
      >
        <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, animatedStyle]}>
          {source ? (
            <Image
              source={source}
              style={{ width: size, height: size, resizeMode: 'contain' }}
              accessibilityLabel="Speasy Companion"
            />
          ) : (
            <ProceduralCompanionSVG size={size} mood={mood} blinking={blinking} />
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

function ProceduralCompanionSVG({
  size,
  mood,
  blinking,
}: {
  size: number;
  mood: CompanionMood;
  blinking: boolean;
}) {
  const vbSize = 100;
  const isHappyClosedEyes = mood === 'sleeping' || mood === 'breathing' || blinking;
  const isSurprised = mood === 'celebrate';

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${vbSize} ${vbSize}`}>
      <Defs>
        <LinearGradient id="pebbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFF7EE" />
          <Stop offset="65%" stopColor="#FFEBD6" />
          <Stop offset="100%" stopColor="#FED7AA" />
        </LinearGradient>
        <LinearGradient id="auraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={Colors.accent.main} stopOpacity="0.3" />
          <Stop offset="100%" stopColor={Colors.brand.main} stopOpacity="0.05" />
        </LinearGradient>
      </Defs>

      {/* Ambient soft glow aura */}
      <Circle cx="50" cy="52" r="44" fill="url(#auraGrad)" />

      {/* Main Organic Pebble Body */}
      {/* Path creates an asymmetrical warm pebble/droplet with soft contours */}
      <Path
        d="M 50 14
           C 72 14, 88 28, 88 52
           C 88 74, 73 88, 50 88
           C 27 88, 12 74, 12 52
           C 12 28, 28 14, 50 14 Z"
        fill="url(#pebbleGrad)"
        stroke={Colors.surface.card2}
        strokeWidth="1.5"
      />

      {/* Cheeks - Rosy Blush */}
      <Circle cx="30" cy="57" r="5" fill="#F87171" opacity="0.35" />
      <Circle cx="70" cy="57" r="5" fill="#F87171" opacity="0.35" />

      {/* Left and Right Eyes */}
      {isHappyClosedEyes ? (
        <G>
          {/* Happy curved resting eyes: ‿ ‿ */}
          <Path d="M 33 50 Q 38 55 43 50" stroke="#4A3B32" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <Path d="M 57 50 Q 62 55 67 50" stroke="#4A3B32" strokeWidth="2.8" strokeLinecap="round" fill="none" />
        </G>
      ) : (
        <G>
          {/* Open warm eyes with glossy white reflection */}
          <Ellipse cx="38" cy="49" rx={isSurprised ? 4.8 : 4.2} ry={isSurprised ? 5.5 : 4.8} fill="#382C24" />
          <Circle cx="36.5" cy="47.2" r="1.6" fill="#FFFFFF" />
          <Circle cx="39.5" cy="50.5" r="0.8" fill="#FFFFFF" opacity="0.8" />

          <Ellipse cx="62" cy="49" rx={isSurprised ? 4.8 : 4.2} ry={isSurprised ? 5.5 : 4.8} fill="#382C24" />
          <Circle cx="60.5" cy="47.2" r="1.6" fill="#FFFFFF" />
          <Circle cx="63.5" cy="50.5" r="0.8" fill="#FFFFFF" opacity="0.8" />
        </G>
      )}

      {/* Mouth */}
      {mood === 'celebrate' ? (
        /* Joyful open mouth */
        <Path d="M 45 57 Q 50 65 55 57 Z" fill="#D9534F" stroke="#4A3B32" strokeWidth="1.5" />
      ) : mood === 'wisdom' ? (
        /* Thoughtful gentle smile */
        <Path d="M 47 57 Q 52 61 56 58" stroke="#4A3B32" strokeWidth="2" strokeLinecap="round" fill="none" />
      ) : (
        /* Friendly contented curve */
        <Path d="M 46 58 Q 50 62 54 58" stroke="#4A3B32" strokeWidth="2" strokeLinecap="round" fill="none" />
      )}

      {/* Mood Accessory Overlay */}
      {mood === 'celebrate' && (
        <G>
          {/* Little sparkling stars */}
          <Path d="M 18 28 L 20 22 L 22 28 L 28 30 L 22 32 L 20 38 L 18 32 L 12 30 Z" fill="#FBBF24" />
          <Path d="M 80 22 L 81.5 18 L 83 22 L 87 23.5 L 83 25 L 81.5 29 L 80 25 L 76 23.5 Z" fill="#FBBF24" />
        </G>
      )}

      {mood === 'wisdom' && (
        <G>
          {/* Gentle sprout / inspiration leaf */}
          <Path d="M 50 14 Q 50 6 56 6 Q 58 10 52 14 Z" fill={Colors.accent.main} />
        </G>
      )}

      {mood === 'listening' && (
        <G>
          {/* Acoustic wave rings */}
          <Path d="M 12 45 A 8 8 0 0 0 12 59" stroke={Colors.accent.main} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <Path d="M 88 45 A 8 8 0 0 1 88 59" stroke={Colors.accent.main} strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </G>
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.cardSmall,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    maxWidth: 220,
    borderWidth: 1,
    borderColor: Colors.accent.soft,
    alignItems: 'center',
  },
  bubbleText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -6,
    width: 10,
    height: 10,
    backgroundColor: Colors.surface.card,
    transform: [{ rotate: '45deg' }],
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.accent.soft,
  },
});
