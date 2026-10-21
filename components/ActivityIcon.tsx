import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Depth, Shadow, Tints, type TintName } from '../theme/tokens';
import { Raised } from './depth/Raised';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Clay icon tile on a ledge of its own tint — the visual identity of each exercise / situation. */
export default function ActivityIcon({
  name, tint = 'sage', size = 44, muted = false, bg,
}: { name: string; tint?: TintName; size?: number; muted?: boolean; bg?: string }) {
  const c = Tints[tint];
  const depth = size >= 60 ? Depth.card : Depth.tile;
  return (
    <Raised
      depth={depth}
      ledgeColor={muted || bg ? Colors.surface.ledge : c.ledge}
      radius={size * 0.34}
      ambient={false}
      faceStyle={{
        width: size,
        height: size,
        flexGrow: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg ?? (muted ? Colors.surface.card2 : c.bg),
        boxShadow: Shadow.rim,
      }}
    >
      <Ionicons name={name as IconName} size={size * 0.5} color={muted ? Colors.text.tertiary : c.fg} />
    </Raised>
  );
}
