import React from 'react';
import { type PressableProps, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { Colors, Depth, Radius, Shadow, Spacing } from '../theme/tokens';
import { PressableRaised, Raised } from './depth/Raised';

interface Props extends Omit<ViewProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const FACE = { backgroundColor: Colors.surface.card, padding: Spacing.cardPad, boxShadow: Shadow.rim };

/** Raised white surface on a soft green ledge. Layout styles go to the outer box, the rest to the face. */
export default function Card({ children, style, ...rest }: Props) {
  return (
    <Raised
      {...rest}
      depth={Depth.card}
      ledgeColor={Colors.surface.ledge}
      radius={Radius.card}
      faceStyle={FACE}
      style={style}
    >
      {children}
    </Raised>
  );
}

interface PressableCardProps extends Omit<PressableProps, 'style' | 'children'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Defaults to the white card's ledge; pass a darker step when the face is tinted. */
  ledgeColor?: string;
}

/** A tappable Card: same face and ledge, sinks in on press. */
export function PressableCard({ children, style, ledgeColor = Colors.surface.ledge, ...rest }: PressableCardProps) {
  return (
    <PressableRaised
      {...rest}
      depth={Depth.card}
      ledgeColor={ledgeColor}
      radius={Radius.card}
      faceStyle={FACE}
      style={style}
    >
      {children}
    </PressableRaised>
  );
}
