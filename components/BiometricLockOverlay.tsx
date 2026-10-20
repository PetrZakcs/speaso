import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../i18n/useTranslation';
import { useStore } from '../state/store';
import { authenticateWithBiometrics, checkBiometricsAvailability, type BiometryType } from '../lib/biometrics';
import CompanionAvatar from './CompanionAvatar';
import PillButton from './PillButton';
import { Colors, FontFamily, FontSize } from '../theme/tokens';
import { hapticSuccess } from '../lib/haptics';

export default function BiometricLockOverlay() {
  const { t } = useTranslation();
  const setAppLocked = useStore((s) => s.setAppLocked);
  const [biometryType, setBiometryType] = useState<BiometryType>('NONE');
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    checkBiometricsAvailability().then((info) => {
      setBiometryType(info.biometryType);
    });
  }, []);

  const triggerAuth = async () => {
    if (authenticating) return;
    setAuthenticating(true);
    try {
      const ok = await authenticateWithBiometrics(t('biometrics.prompt'));
      if (ok) {
        hapticSuccess();
        setAppLocked(false);
      }
    } finally {
      setAuthenticating(false);
    }
  };

  // Attempt authentication automatically on appear
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerAuth();
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const iconName: React.ComponentProps<typeof Ionicons>['name'] =
    biometryType === 'FACE_ID'
      ? 'scan-outline'
      : biometryType === 'TOUCH_ID' || biometryType === 'FINGERPRINT'
        ? 'finger-print-outline'
        : 'lock-closed-outline';

  const unlockLabel =
    biometryType === 'FACE_ID'
      ? t('biometrics.unlock_face_id')
      : biometryType === 'TOUCH_ID' || biometryType === 'FINGERPRINT'
        ? t('biometrics.unlock_fingerprint')
        : t('biometrics.unlock_pin');

  return (
    <SafeAreaView style={styles.overlay}>
      <View style={styles.center}>
        <CompanionAvatar size={100} mood="breathing" />

        <View style={styles.badgeRing}>
          <Ionicons name={iconName} size={32} color={Colors.accent.main} />
        </View>

        <Text style={styles.title} accessibilityRole="header">
          {t('biometrics.locked_title')}
        </Text>
        <Text style={styles.sub}>{t('biometrics.locked_sub')}</Text>
      </View>

      <View style={styles.bottom}>
        <PillButton label={unlockLabel} onPress={triggerAuth} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.bg.base,
    zIndex: 9999,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  badgeRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accent.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: 24,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  sub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  bottom: {
    paddingBottom: 16,
    width: '100%',
  },
});
