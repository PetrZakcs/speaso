import React, { useMemo, useState } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useBreath } from '../../lib/breath';
import { wavePath } from '../../lib/wave';
import { Colors } from '../../theme/tokens';

/** Layered waveform that swells with the breath rhythm. */
export default function VoiceWave({
  calm, height = 64, color = Colors.accent.main, echo = Colors.brand.main, animated = true, style,
}: {
  calm: number;
  height?: number;
  color?: string;
  /** Second, quieter layer behind the main line. */
  echo?: string;
  animated?: boolean;
  style?: ViewStyle;
}) {
  const [width, setWidth] = useState(0);
  const breath = useBreath(animated);
  const paths = useMemo(
    () => (width ? [wavePath(width, height, calm, 3), wavePath(width, height, calm, 1)] : []),
    [width, height, calm],
  );
  const back = useAnimatedStyle(() => ({ transform: [{ scaleY: 0.7 + breath.value * 0.45 }] }));
  const front = useAnimatedStyle(() => ({ transform: [{ scaleY: 0.85 + breath.value * 0.2 }] }));

  return (
    <View
      style={[{ height }, style]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {width > 0 && (
        <>
          <Animated.View style={[{ position: 'absolute', width, height }, back]}>
            <Svg width={width} height={height}>
              <Path d={paths[0]} stroke={echo} strokeOpacity={0.45} strokeWidth={2} fill="none" strokeLinejoin="round" />
            </Svg>
          </Animated.View>
          <Animated.View style={[{ position: 'absolute', width, height }, front]}>
            <Svg width={width} height={height}>
              <Path d={paths[1]} stroke={color} strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            </Svg>
          </Animated.View>
        </>
      )}
    </View>
  );
}
