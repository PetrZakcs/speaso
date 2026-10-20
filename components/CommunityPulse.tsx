import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from '../i18n/useTranslation';
import { Colors, FontFamily, FontSize, Radius, Shadow } from '../theme/tokens';

export default function CommunityPulse() {
  const { t } = useTranslation();

  return (
    <View style={styles.card} accessible accessibilityRole="text">
      <View style={styles.row}>
        <View style={styles.pulseOuter}>
          <View style={styles.pulseInner} />
        </View>
        <Text style={styles.title}>{t('home.community_title')}</Text>
      </View>
      <Text style={styles.sub}>{t('home.community_sub')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    ...Shadow.card,
    borderRadius: Radius.card,
    padding: 14,
    gap: 4,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.main,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseOuter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  title: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
  },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
    paddingLeft: 18,
  },
});
