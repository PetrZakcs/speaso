import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../i18n/useTranslation';
import { Colors, FontFamily, FontSize, Radius, Shadow } from '../theme/tokens';

interface Props {
  compact?: boolean;
  style?: ViewStyle;
}

/**
 * Visual clinical privacy seal assuring stuttering users that all voice recordings
 * and check-ins remain 100% on their physical device and never touch a cloud/server.
 */
export default function ZeroCloudBadge({ compact = false, style }: Props) {
  const { t } = useTranslation();

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <Ionicons name="shield-checkmark" size={14} color={Colors.accent.main} />
        <Text style={styles.compactText}>{t('privacy.zero_cloud_badge')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.bannerContainer, Shadow.card, style]}>
      <View style={styles.iconWrap}>
        <Ionicons name="shield-checkmark" size={22} color={Colors.accent.main} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{t('privacy.zero_cloud_title')}</Text>
        <Text style={styles.desc}>{t('privacy.zero_cloud_desc')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accent.soft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  compactText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.accent.main,
  },
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface.card,
    borderRadius: Radius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.accent.soft,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.text.primary,
  },
  desc: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.meta,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
});
