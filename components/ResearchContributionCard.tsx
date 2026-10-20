import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../i18n/useTranslation';
import { useStore, useShallow } from '../state/store';
import { exportResearchDataJson } from '../lib/research';
import { Colors, FontFamily, FontSize, Radius, Shadow } from '../theme/tokens';
import { hapticSelect } from '../lib/haptics';

export default function ResearchContributionCard() {
  const { t, tn } = useTranslation();
  const [exporting, setExporting] = useState(false);
  const { checkIns, sessions, shareAnswers } = useStore(
    useShallow((s) => ({
      checkIns: s.checkIns,
      sessions: s.sessions,
      shareAnswers: s.user.shareAnswers,
    }))
  );

  const totalPoints = checkIns.length + sessions.length;

  const handleExport = async () => {
    hapticSelect();
    setExporting(true);
    try {
      await exportResearchDataJson();
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={styles.card} accessible accessibilityRole="summary">
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="flask-outline" size={20} color={Colors.accent.main} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t('research.card_title')}</Text>
          <Text style={styles.points}>
            {tn('research.points_count', totalPoints)}
          </Text>
        </View>
      </View>

      <Text style={styles.body}>{t('research.card_body')}</Text>

      <View style={styles.footerRow}>
        <View style={styles.badge}>
          <Ionicons
            name={shareAnswers ? 'shield-checkmark' : 'shield-outline'}
            size={14}
            color={shareAnswers ? Colors.accent.main : Colors.text.tertiary}
          />
          <Text style={[styles.badgeText, shareAnswers && styles.badgeTextActive]}>
            {shareAnswers ? t('research.status_contributing') : t('research.status_local_only')}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleExport}
          disabled={exporting}
          style={styles.exportBtn}
          accessibilityRole="button"
        >
          {exporting ? (
            <ActivityIndicator size="small" color={Colors.accent.main} />
          ) : (
            <>
              <Ionicons name="download-outline" size={14} color={Colors.accent.main} />
              <Text style={styles.exportText}>{t('research.download_json')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    ...Shadow.card,
    borderRadius: Radius.card,
    padding: 16,
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.main,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.accent.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.cardTitle,
    color: Colors.text.primary,
  },
  points: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.accent.main,
  },
  body: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.surface.card2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgeText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.meta,
    color: Colors.text.tertiary,
  },
  badgeTextActive: {
    color: Colors.accent.main,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  exportText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.meta,
    color: Colors.accent.main,
  },
});
