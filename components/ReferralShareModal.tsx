import React from 'react';
import {
  Modal, View, Text, StyleSheet,
  KeyboardAvoidingView, Platform, Share, Alert,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../i18n/useTranslation';
import { useStore } from '../state/store';
import { userReferralCode } from '../lib/promocodes';
import { trackEvent } from '../lib/analytics';
import PillButton from './PillButton';
import IconButton from './IconButton';
import { Colors, FontFamily, FontSize, Radius, Shadow } from '../theme/tokens';
import { hapticSelect, hapticSuccess } from '../lib/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function ReferralShareModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const installId = useStore((s) => s.installId);
  const giftCode = userReferralCode(installId);

  const message = t('referral.share_message', { code: giftCode });

  const handleShare = async () => {
    hapticSelect();
    trackEvent('promo_code_redeem', { referral_share: true, code: giftCode });

    try {
      if (Platform.OS !== 'web') {
        await Share.share({
          message,
          title: t('referral.modal_title'),
        });
        hapticSuccess();
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(`data:text/plain;charset=utf-8,${encodeURIComponent(message)}`, {
          dialogTitle: t('referral.modal_title'),
        });
      } else {
        Alert.alert(t('referral.your_code'), giftCode);
      }
    } catch {
      Alert.alert(t('referral.your_code'), giftCode);
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
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t('referral.modal_title')}</Text>
            </View>
            <IconButton icon="close" size={20} onPress={onClose} accessibilityLabel={t('common.close')} />
          </View>

          <Text style={styles.description}>{t('referral.modal_desc')}</Text>

          {/* Gift code banner */}
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>{t('referral.your_code')}</Text>
            <Text style={styles.codeValue}>{giftCode}</Text>
            <View style={styles.giftBadge}>
              <Ionicons name="gift-outline" size={14} color={Colors.accent.main} />
              <Text style={styles.giftBadgeText}>30 dní Premium zdarma</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <PillButton label={t('referral.share_cta')} onPress={handleShare} />
          </View>
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
    borderRadius: Radius.sheet,
    padding: 22,
    ...Shadow.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.cardTitle + 2,
    color: Colors.text.primary,
  },
  description: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  codeBox: {
    backgroundColor: Colors.surface.card2,
    borderRadius: Radius.cardSmall,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  codeLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeValue: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: 26,
    color: Colors.accent.main,
    letterSpacing: 1.5,
    marginVertical: 6,
  },
  giftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface.card,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.pill,
    marginTop: 4,
  },
  giftBadgeText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.accent.main,
  },
  footer: {
    gap: 10,
  },
});
