import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Share } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../i18n/useTranslation';
import { hapticPress, hapticSuccess } from '../lib/haptics';
import { maybeRequestReview } from '../lib/review';
import CompanionAvatar from './CompanionAvatar';
import { Colors, FontFamily, FontSize, Radius, Shadow } from '../theme/tokens';

export const MILESTONE_DAYS = [3, 7, 14, 30] as const;
export type MilestoneDay = (typeof MILESTONE_DAYS)[number];

interface MilestoneModalProps {
  visible: boolean;
  days: number;
  onDismiss: () => void;
}

export default function MilestoneModal({ visible, days, onDismiss }: MilestoneModalProps) {
  const { t } = useTranslation();

  const titleKey = `milestone.day_${days}_title` as const;
  const descKey = `milestone.day_${days}_desc` as const;

  const handleShare = async () => {
    hapticPress();
    try {
      await Share.share({
        message: `🏆 ${t(titleKey)}!\n\n${t(descKey)}\n\nTrénuji klidné mluvení se Speaso (https://speaso.app)`,
      });
      hapticSuccess();
      maybeRequestReview(days >= 7 ? 'streak_7' : 'streak_3');
    } catch {
      // dismissed
    }
  };

  const handleContinue = () => {
    hapticSuccess();
    maybeRequestReview(days >= 7 ? 'streak_7' : 'streak_3');
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.card, Shadow.card]}>
          <CompanionAvatar size={96} mood="celebrate" style={{ marginBottom: 4 }} />

          <Text style={styles.kicker}>{t('milestone.title')}</Text>
          <Text style={styles.title}>{t(titleKey)}</Text>
          <Text style={styles.desc}>{t(descKey)}</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleShare}
              style={styles.shareBtn}
              accessibilityRole="button"
            >
              <Ionicons name="share-social-outline" size={18} color={Colors.accent.main} />
              <Text style={styles.shareBtnText}>{t('milestone.share')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleContinue}
              style={styles.continueBtn}
              accessibilityRole="button"
            >
              <Text style={styles.continueBtnText}>{t('milestone.continue')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.sheet,
    padding: 26,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(44, 86, 65, 0.15)',
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(44, 86, 65, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  kicker: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.meta,
    color: Colors.accent.main,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.cardTitle + 2,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  desc: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  actions: {
    width: '100%',
    gap: 10,
    marginTop: 12,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(44, 86, 65, 0.1)',
  },
  shareBtnText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.accent.main,
  },
  continueBtn: {
    paddingVertical: 14,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent.main,
    alignItems: 'center',
  },
  continueBtnText: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: FontSize.body,
    color: Colors.accent.on,
  },
});
