import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../i18n/useTranslation';
import { getDailyWisdom } from '../content/dailyWisdom';
import type { DateKey } from '../lib/dates';
import { hapticPress, hapticSuccess } from '../lib/haptics';
import CompanionAvatar from './CompanionAvatar';
import { Colors, FontFamily, FontSize, Radius, Shadow } from '../theme/tokens';

export default function DailyWisdomCard({ today }: { today: DateKey }) {
  const { t, lang, q } = useTranslation();
  const wisdom = getDailyWisdom(today, lang);

  const handleShare = async () => {
    hapticPress();
    try {
      await Share.share({
        message: `${q(wisdom.quote)}\n\n🎯 ${t('wisdom.challenge')}: ${wisdom.challenge}\n\n${t('wisdom.share_footer')} (https://speaso.app)`,
      });
      hapticSuccess();
    } catch {
      // dismissed
    }
  };

  return (
    <View style={[styles.card, Shadow.card]}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Ionicons name="sparkles" size={14} color={Colors.accent.main} />
          <Text style={styles.kicker}>{t('wisdom.title')}</Text>
        </View>
        <TouchableOpacity
          onPress={handleShare}
          style={styles.shareBtn}
          accessibilityRole="button"
          accessibilityLabel={t('wisdom.share')}
          hitSlop={8}
        >
          <Ionicons name="share-outline" size={16} color={Colors.accent.main} />
          <Text style={styles.shareText}>{t('wisdom.share')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quoteRow}>
        <CompanionAvatar size={48} mood="wisdom" />
        <Text style={styles.quote}>{q(wisdom.quote)}</Text>
      </View>

      <View style={styles.challengeBox}>
        <View style={styles.challengeHead}>
          <Ionicons name="flag-outline" size={14} color={Colors.accent.main} />
          <Text style={styles.challengeLabel}>{t('wisdom.challenge')}</Text>
        </View>
        <Text style={styles.challengeText}>{wisdom.challenge}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    padding: 18,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(44, 86, 65, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  kicker: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.meta,
    color: Colors.accent.main,
    letterSpacing: 0.2,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  shareText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.accent.main,
  },
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quote: {
    flex: 1,
    fontFamily: FontFamily.headingItalic,
    fontSize: 17,
    lineHeight: 24,
    color: Colors.text.primary,
  },
  challengeBox: {
    backgroundColor: Colors.surface.card2,
    borderRadius: Radius.cardSmall,
    padding: 12,
    gap: 4,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.main,
  },
  challengeHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  challengeLabel: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.meta,
    color: Colors.accent.main,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  challengeText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    lineHeight: 19,
    color: Colors.text.primary,
  },
});
