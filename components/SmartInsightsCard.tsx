import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../i18n/useTranslation';
import type { CheckIn } from '../state/store';
import type { Session, StreakData } from '../lib/streak';
import { generateSmartInsights } from '../lib/insights';
import Card from './Card';
import { Colors, FontFamily, FontSize, Radius } from '../theme/tokens';

interface SmartInsightsCardProps {
  sessions: Session[];
  checkIns: CheckIn[];
  streak: StreakData;
}

export default function SmartInsightsCard({ sessions, checkIns, streak }: SmartInsightsCardProps) {
  const { t, lang } = useTranslation();

  const insights = useMemo(
    () => generateSmartInsights(sessions, checkIns, streak, lang),
    [sessions, checkIns, streak, lang],
  );

  const needed = Math.max(0, 3 - checkIns.length);

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="bulb-outline" size={20} color={Colors.accent.main} />
          <Text style={styles.title}>{t('insights.title')}</Text>
        </View>
        <Text style={styles.sub}>{t('insights.sub')}</Text>
      </View>

      {insights.length > 0 ? (
        <View style={styles.list}>
          {insights.map((item) => (
            <View
              key={item.id}
              style={[
                styles.item,
                item.type === 'tip' ? styles.itemTip : styles.itemPositive,
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  item.type === 'tip' ? styles.iconWrapTip : styles.iconWrapPositive,
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={18}
                  color={item.type === 'tip' ? '#C05621' : Colors.accent.main}
                />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyWrap}>
          <Ionicons name="analytics-outline" size={28} color={Colors.accent.main} />
          <Text style={styles.emptyTitle}>{t('insights.empty_title')}</Text>
          <Text style={styles.emptyDesc}>
            {needed > 0
              ? t('insights.empty_sub', { n: needed })
              : t('progress.factors_hint')}
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.cardTitle + 2,
    color: Colors.text.primary,
  },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  list: {
    gap: 10,
    marginTop: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: Radius.cardSmall,
    borderWidth: 1,
  },
  itemPositive: {
    backgroundColor: 'rgba(44, 86, 65, 0.06)',
    borderColor: 'rgba(44, 86, 65, 0.15)',
  },
  itemTip: {
    backgroundColor: 'rgba(237, 137, 54, 0.08)',
    borderColor: 'rgba(237, 137, 54, 0.2)',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapPositive: {
    backgroundColor: 'rgba(44, 86, 65, 0.12)',
  },
  iconWrapTip: {
    backgroundColor: 'rgba(237, 137, 54, 0.15)',
  },
  itemTitle: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
  },
  itemDesc: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    lineHeight: 18,
    color: Colors.text.secondary,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    backgroundColor: Colors.surface.card2,
    borderRadius: Radius.cardSmall,
    gap: 6,
  },
  emptyTitle: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
    marginTop: 4,
  },
  emptyDesc: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
