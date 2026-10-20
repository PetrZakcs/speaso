import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../i18n/useTranslation';
import { useStore, patientPairingCode } from '../state/store';
import { trackEvent } from '../lib/analytics';
import PillButton from './PillButton';
import IconButton from './IconButton';
import { Colors, FontFamily, FontSize, Radius, Shadow } from '../theme/tokens';
import { hapticSelect, hapticSuccess } from '../lib/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function TherapistConnectModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const installId = useStore((s) => s.installId);
  const user = useStore((s) => s.user);
  const setTherapist = useStore((s) => s.setTherapist);

  const pairingCode = patientPairingCode(installId);
  const [name, setName] = useState(user.therapistName || '');

  const handleShare = async () => {
    hapticSelect();
    const message = t('therapist.share_message', { code: pairingCode });
    if (await Sharing.isAvailableAsync()) {
      // In web/expo-sharing on mobile:
      try {
        await Sharing.shareAsync(`data:text/plain;charset=utf-8,${encodeURIComponent(message)}`, {
          dialogTitle: t('therapist.your_code'),
        });
      } catch {
        Alert.alert(t('therapist.your_code'), pairingCode);
      }
    } else {
      Alert.alert(t('therapist.your_code'), pairingCode);
    }
    trackEvent('therapist_paired', { method: 'share' });
  };

  const handleSave = () => {
    setTherapist({ code: pairingCode, name: name.trim() });
    hapticSuccess();
    trackEvent('therapist_paired', { has_name: !!name.trim() });
    onClose();
  };

  const handleUnlink = () => {
    setTherapist({ code: undefined, name: undefined });
    setName('');
    hapticSelect();
    onClose();
  };

  const isLinked = !!user.therapistName;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="medkit" size={24} color={Colors.accent.main} />
              <Text style={styles.title}>{t('therapist.modal_title')}</Text>
            </View>
            <IconButton icon="close" onPress={onClose} accessibilityLabel={t('common.close')} />
          </View>

          <Text style={styles.sub}>{t('therapist.modal_sub')}</Text>

          {/* Patient Code Badge */}
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>{t('therapist.your_code')}</Text>
            <Text style={styles.codeText} selectable>
              {pairingCode}
            </Text>
            <TouchableOpacity
              onPress={handleShare}
              style={styles.shareBtn}
              accessibilityRole="button"
            >
              <Ionicons name="share-outline" size={16} color={Colors.accent.main} />
              <Text style={styles.shareBtnText}>{t('therapist.share_cta')}</Text>
            </TouchableOpacity>
          </View>

          {/* Therapist Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('therapist.therapist_name_label')}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('therapist.therapist_name_ph')}
              placeholderTextColor={Colors.text.tertiary}
              style={styles.input}
            />
          </View>

          <PillButton label={t('therapist.save')} onPress={handleSave} variant="primary" />

          {isLinked && (
            <TouchableOpacity onPress={handleUnlink} style={styles.unlinkBtn}>
              <Text style={styles.unlinkText}>{t('therapist.unlink')}</Text>
            </TouchableOpacity>
          )}
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
    maxWidth: 400,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    padding: 24,
    gap: 16,
    ...Shadow.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.screenTitle,
    color: Colors.text.primary,
  },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  codeContainer: {
    backgroundColor: Colors.surface.card2,
    borderRadius: Radius.cardSmall,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  codeLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  codeText: {
    fontFamily: FontFamily.heading,
    fontSize: 28,
    color: Colors.accent.main,
    letterSpacing: 2,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accent.soft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  shareBtnText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.meta,
    color: Colors.accent.main,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
  },
  input: {
    height: 48,
    borderRadius: Radius.chip,
    backgroundColor: Colors.surface.card2,
    paddingHorizontal: 14,
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.body,
    color: Colors.text.primary,
  },
  unlinkBtn: {
    alignSelf: 'center',
    padding: 6,
  },
  unlinkText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.danger.panic,
  },
});
