import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../i18n/useTranslation';
import { useStore, useShallow } from '../state/store';
import { currentStreak } from '../lib/streak';
import { useToday } from '../lib/useToday';
import { trackEvent } from '../lib/analytics';
import PillButton from './PillButton';
import IconButton from './IconButton';
import VoiceWave from './brand/VoiceWave';
import { Colors, FontFamily, FontSize, Radius, Shadow } from '../theme/tokens';
import { hapticPress, hapticSuccess } from '../lib/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function ShareProgressModal({ visible, onClose }: Props) {
  const { t, tn } = useTranslation();
  const today = useToday();
  const { streak, sessions } = useStore(
    useShallow((s) => ({
      streak: s.streak,
      sessions: s.sessions,
    }))
  );

  const streakDays = currentStreak(streak, today);
  const totalMinutes = Math.round(sessions.reduce((sum, s) => sum + s.durationSec, 0) / 60);

  const shareText = t('share.message', {
    days: streakDays,
    minutes: totalMinutes,
  });

  const handleShare = async () => {
    hapticPress();
    trackEvent('paywall_view', { source: 'share_card' }); // growth loop event

    if (await Sharing.isAvailableAsync()) {
      try {
        await Sharing.shareAsync(`data:text/plain;charset=utf-8,${encodeURIComponent(shareText)}`, {
          dialogTitle: t('share.title'),
        });
        hapticSuccess();
      } catch {
        Alert.alert(t('share.title'), shareText);
      }
    } else {
      Alert.alert(t('share.title'), shareText);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('share.title')}</Text>
            <IconButton icon="close" onPress={onClose} accessibilityLabel={t('common.close')} />
          </View>

          {/* Story Preview Card (Calm Dark Luxury) */}
          <View style={styles.previewCard}>
            <View style={styles.previewTop}>
              <Text style={styles.previewWordmark}>speaso</Text>
              <View style={styles.taglineBadge}>
                <Text style={styles.taglineText}>speaso.app</Text>
              </View>
            </View>

            <View style={styles.previewCenter}>
              <View style={styles.flameCircle}>
                <Ionicons name="flame" size={32} color="#F59E0B" />
              </View>
              <Text style={styles.previewStreakNum}>{streakDays}</Text>
              <Text style={styles.previewStreakLabel}>
                {tn('progress.streak_value', streakDays)}
              </Text>
            </View>

            <VoiceWave calm={0.85} height={50} style={styles.previewWave} />

            <View style={styles.previewFooter}>
              <Text style={styles.previewQuote}>„{t('share.quote')}“</Text>
              <Text style={styles.previewSub}>{t('share.download_cta')}</Text>
            </View>
          </View>

          <PillButton label={t('share.share_btn')} onPress={handleShare} variant="primary" />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 36, 28, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    padding: 20,
    gap: 16,
    ...Shadow.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  previewCard: {
    backgroundColor: '#14241C',
    borderRadius: Radius.cardSmall,
    padding: 20,
    gap: 16,
    alignItems: 'center',
  },
  previewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  previewWordmark: {
    fontFamily: FontFamily.heading,
    fontSize: 20,
    color: '#DCEFE4',
    letterSpacing: -0.5,
  },
  taglineBadge: {
    backgroundColor: 'rgba(220, 239, 228, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  taglineText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: 11,
    color: '#DCEFE4',
  },
  previewCenter: {
    alignItems: 'center',
    gap: 4,
    marginVertical: 4,
  },
  flameCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  previewStreakNum: {
    fontFamily: FontFamily.heading,
    fontSize: 48,
    lineHeight: 52,
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  previewStreakLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.body,
    color: '#DCEFE4',
  },
  previewWave: {
    width: '100%',
  },
  previewFooter: {
    alignItems: 'center',
    gap: 4,
  },
  previewQuote: {
    fontFamily: FontFamily.headingSemiBoldItalic,
    fontSize: FontSize.bodySmall,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  previewSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: 'rgba(220, 239, 228, 0.7)',
    textAlign: 'center',
  },
});
