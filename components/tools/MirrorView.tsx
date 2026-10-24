import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../../i18n/useTranslation';
import CompanionAvatar from '../CompanionAvatar';
import ZeroCloudBadge from '../ZeroCloudBadge';
import { Colors, FontFamily, FontSize, Radius, Shadow, Spacing } from '../../theme/tokens';
import { hapticPress, hapticSelect } from '../../lib/haptics';

// Safe lazy loading of native expo-camera module to gracefully handle
// dev simulator runs where native binary hasn't been recompiled with the new pod.
/* eslint-disable @typescript-eslint/no-require-imports */
let CameraViewComponent: any = null;
let useCameraPermissionsHook: any = () => [null, () => Promise.resolve(null)];
let isNativeCameraAvailable = false;

try {
  const cameraModule = require('expo-camera');
  if (cameraModule && cameraModule.CameraView) {
    CameraViewComponent = cameraModule.CameraView;
    useCameraPermissionsHook = cameraModule.useCameraPermissions;
    isNativeCameraAvailable = true;
  }
} catch {
  isNativeCameraAvailable = false;
}
/* eslint-enable @typescript-eslint/no-require-imports */

interface MirrorViewProps {
  compact?: boolean;
  onClose?: () => void;
  onToggleExpand?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Clinical Mirror Biofeedback View for stuttering (balbuties) therapy.
 * Provides real-time visual feedback of facial tension, lip pressing, and shoulder elevation.
 * Runs 100% on-device (Zero-Cloud).
 */
export default function MirrorView({
  compact = false,
  onClose,
  onToggleExpand,
  style,
}: MirrorViewProps) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissionsHook();
  const [activeCue, setActiveCue] = useState<'jaw' | 'shoulders' | 'breath'>('jaw');

  const cycleCue = () => {
    hapticSelect();
    setActiveCue((curr) => {
      if (curr === 'jaw') return 'shoulders';
      if (curr === 'shoulders') return 'breath';
      return 'jaw';
    });
  };

  if (isNativeCameraAvailable && (!permission || !permission.granted)) {
    return (
      <View style={[styles.permContainer, compact && styles.permCompact, style]}>
        <View style={styles.permIconWrap}>
          <Ionicons name="videocam-outline" size={24} color={Colors.accent.main} />
        </View>
        <Text style={styles.permTitle}>{t('mirror.permission_title')}</Text>
        <Text style={styles.permSub}>{t('mirror.permission_sub')}</Text>
        <TouchableOpacity
          style={styles.permBtn}
          onPress={() => {
            hapticPress();
            requestPermission();
          }}
          accessibilityRole="button"
          accessibilityLabel={t('mirror.permission_btn')}
        >
          <Ionicons name="camera" size={16} color={Colors.accent.on} />
          <Text style={styles.permBtnText}>{t('mirror.permission_btn')}</Text>
        </TouchableOpacity>
        <ZeroCloudBadge compact style={{ marginTop: 6 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, compact ? styles.containerCompact : styles.containerFull, style]}>
      {isNativeCameraAvailable && CameraViewComponent ? (
        <CameraViewComponent style={StyleSheet.absoluteFill} facing="front" mode="video" />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.simulatedFeed]}>
          <Ionicons name="videocam" size={32} color="rgba(255, 255, 255, 0.25)" />
          <Text style={styles.simulatedText}>Zrcadlový biofeedback (Kamera)</Text>
        </View>
      )}

      {/* Tension Guide Overlay */}
      <View style={styles.overlay} pointerEvents="box-none">
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <View style={styles.privacyPill}>
            <View style={styles.liveDot} />
            <Text style={styles.privacyPillText}>{t('mirror.zero_cloud')}</Text>
          </View>
          <View style={styles.topActions}>
            {onToggleExpand && (
              <TouchableOpacity
                onPress={() => {
                  hapticPress();
                  onToggleExpand();
                }}
                style={styles.circleBtn}
                accessibilityRole="button"
                accessibilityLabel={compact ? t('mirror.dock_full') : t('mirror.dock_compact')}
              >
                <Ionicons name={compact ? 'expand-outline' : 'contract-outline'} size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            {onClose && (
              <TouchableOpacity
                onPress={() => {
                  hapticPress();
                  onClose();
                }}
                style={styles.circleBtn}
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
              >
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Head & Jaw Posture Alignment Ring */}
        <View style={styles.alignmentWrap} pointerEvents="none">
          <View style={[styles.alignmentOval, compact && styles.alignmentOvalCompact]}>
            <View style={styles.chinLine} />
          </View>
        </View>

        {/* Bottom Biofeedback Cues Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.cuePill}
            onPress={cycleCue}
            accessibilityRole="button"
            accessibilityLabel={`${t(`mirror.cue_${activeCue}`)} · Klepnutím přepneš`}
          >
            <Ionicons
              name={
                activeCue === 'jaw'
                  ? 'happy-outline'
                  : activeCue === 'shoulders'
                  ? 'body-outline'
                  : 'leaf-outline'
              }
              size={14}
              color={Colors.accent.main}
            />
            <Text style={styles.cueText}>{t(`mirror.cue_${activeCue}`)}</Text>
            <Ionicons name="swap-horizontal" size={12} color={Colors.text.tertiary} style={{ marginLeft: 2 }} />
          </TouchableOpacity>

          <View style={styles.mascotWrap}>
            <CompanionAvatar size={34} mood="listening" />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: Radius.card,
    backgroundColor: '#14241C',
    ...Shadow.card,
  },
  containerCompact: {
    height: 190,
    width: '100%',
    marginBottom: 12,
  },
  containerFull: {
    flex: 1,
    minHeight: 310,
    width: '100%',
  },
  simulatedFeed: {
    backgroundColor: '#1B3125',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  simulatedText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: 'rgba(255, 255, 255, 0.45)',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: 'rgba(20, 36, 28, 0.12)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  privacyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(20, 36, 28, 0.72)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent.main,
  },
  privacyPillText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta - 1,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  topActions: {
    flexDirection: 'row',
    gap: 6,
  },
  circleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(20, 36, 28, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alignmentWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  alignmentOval: {
    width: 140,
    height: 170,
    borderRadius: 70,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 16,
  },
  alignmentOvalCompact: {
    width: 110,
    height: 130,
    borderRadius: 55,
    paddingBottom: 10,
  },
  chinLine: {
    width: 32,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(163, 194, 177, 0.75)',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  cuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    ...Shadow.card,
  },
  cueText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.meta,
    color: Colors.text.primary,
  },
  mascotWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
  },
  permContainer: {
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    padding: Spacing.cardPad,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surface.card2,
    ...Shadow.card,
  },
  permCompact: {
    marginBottom: 12,
  },
  permIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  permTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.body,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  permSub: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
    maxWidth: 280,
  },
  permBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accent.main,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    marginBottom: 8,
  },
  permBtnText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.meta,
    color: Colors.accent.on,
  },
});
