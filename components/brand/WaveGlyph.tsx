import React from 'react';
import Svg, { Path } from 'react-native-svg';

/** The calm wave as a small icon (same shape as the app icon). */
export default function WaveGlyph({ size = 24, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M2 12c1.6 0 2.2-5 4-5s2.2 10 4 10 2.4-12 4.2-12S16.6 17 18.4 17 20.6 12 22 12"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
