import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../../i18n/useTranslation';
import { redeemPromoCode } from '../../lib/promocodes';
import { presentCodeRedemptionSheet } from '../../lib/purchases';
import PillButton from '../PillButton';
import IconButton from '../IconButton';
import { Colors, FontFamily, FontSize, Radius, Spacing, Shadow } from '../../theme/tokens';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PromoCodeModal({ visible, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRedeem = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true);

    try {
      const res = await redeemPromoCode(trimmed);
      if (res.success) {
        Alert.alert(t('promo.success_title'), t('promo.success_body'), [
          {
            text: t('common.close'),
            onPress: () => {
              setCode('');
              onClose();
              onSuccess?.();
            },
          },
        ]);
      } else {
        const errorBody =
          res.error === 'referral_already_used'
            ? t('promo.error_referral_used')
            : res.error === 'active_store_trial'
              ? t('promo.error_active_trial')
              : res.error === 'max_uses_reached'
                ? t('promo.error_max_uses')
                : res.error === 'already_redeemed'
                  ? t('promo.error_already_redeemed')
                  : t('promo.invalid_body');
        Alert.alert(t('promo.invalid_title'), errorBody);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppStoreSheet = async () => {
    onClose();
    await presentCodeRedemptionSheet();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">{t('promo.title')}</Text>
            <IconButton icon="close" size={32} onPress={onClose} accessibilityLabel={t('common.close')} />
          </View>

          <Text style={styles.sub}>{t('promo.sub')}</Text>

          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder={t('promo.placeholder')}
            placeholderTextColor={Colors.text.tertiary}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleRedeem}
          />

          <PillButton
            label={t('promo.submit')}
            onPress={handleRedeem}
            loading={loading}
            disabled={!code.trim() || loading}
          />

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              onPress={handleAppStoreSheet}
              style={styles.storeCta}
              accessibilityRole="button"
            >
              <Ionicons name="logo-apple" size={16} color={Colors.accent.main} />
              <Text style={styles.storeCtaText}>{t('promo.app_store_cta')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 36, 28, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.screenH,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    padding: 24,
    gap: 16,
    ...Shadow.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.screenTitle,
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    lineHeight: 22,
    color: Colors.text.secondary,
  },
  input: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: 18,
    color: Colors.text.primary,
    backgroundColor: Colors.surface.card2,
    borderRadius: Radius.cardSmall,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.hairline,
    letterSpacing: 1.5,
  },
  storeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  storeCtaText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.accent.main,
  },
});
