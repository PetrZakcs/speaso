import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import ActivityIcon from '../ActivityIcon';
import { Colors, Depth, FontFamily, FontSize, Radius, Shadow, type TintName } from '../../theme/tokens';
import { PressableRaised } from '../depth/Raised';
import { hapticSelect } from '../../lib/haptics';

/** A half-width selectable 3D tile for 2-column onboarding grids; sinks in on press. */
export default function ChoiceTile({
  title, detail, icon, tint, selected, onPress, multi = false,
}: {
  title: string;
  detail?: string;
  icon: string;
  tint?: TintName;
  selected: boolean;
  onPress: () => void;
  multi?: boolean;
}) {
  return (
    <PressableRaised
      onPress={() => {
        hapticSelect();
        onPress();
      }}
      depth={Depth.card}
      ledgeColor={selected ? Colors.accent.ledge : Colors.surface.ledge}
      radius={Radius.card}
      style={styles.tile}
      faceStyle={[styles.face, selected && styles.faceSelected]}
      accessibilityLabel={detail ? `${title}, ${detail}` : title}
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={multi ? { checked: selected } : { selected }}
    >
      <View style={styles.top}>
        <ActivityIcon name={icon} tint={tint} size={48} />
        <View style={[styles.mark, multi && styles.markSquare, selected && styles.markOn]}>
          {selected && <Ionicons name="checkmark" size={14} color={Colors.accent.on} />}
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!detail && <Text style={styles.detail} numberOfLines={3}>{detail}</Text>}
    </PressableRaised>
  );
}

/** Lays tiles out two per row. */
export function TileGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48.4%' },
  face: {
    minHeight: 136,
    padding: 14,
    gap: 6,
    backgroundColor: Colors.surface.card,
    boxShadow: Shadow.rim,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  faceSelected: { borderColor: Colors.accent.main, backgroundColor: Colors.accent.soft },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  title: { fontFamily: FontFamily.heading, fontSize: FontSize.body, lineHeight: 20, color: Colors.text.primary },
  detail: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    lineHeight: 16,
    color: Colors.text.secondary,
  },
  mark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface.card2,
    boxShadow: Shadow.well,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markSquare: { borderRadius: 6 },
  markOn: {
    backgroundColor: Colors.accent.main,
    boxShadow: `0px ${Depth.fill}px 0px ${Colors.accent.ledge}`,
  },
});
