import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from '../../i18n/useTranslation';
import { EXERCISES } from '../../content/exercises';
import { SITUATIONS } from '../../content/situations';
import {
  useCreateScenario, useStartExercise, useStartScenario, useStartSituation,
} from '../../lib/useStartExercise';
import { useIsPremium, useStore } from '../../state/store';
import { SCENARIO_MINUTES, isScenarioUnlocked } from '../../lib/scenarios';
import ActivityIcon from '../../components/ActivityIcon';
import PremiumTag from '../../components/PremiumTag';
import { Colors, FontFamily, FontSize, Radius, Spacing, Shadow, type TintName } from '../../theme/tokens';

function Row({
  icon, tint, title, sub, meta, locked, onPress, first, a11y,
}: {
  icon: string;
  tint: TintName;
  title: string;
  sub: string;
  meta: string;
  locked?: boolean;
  onPress: () => void;
  first: boolean;
  a11y: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, !first && styles.rowBorder]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={a11y}
    >
      <ActivityIcon name={icon} tint={tint} muted={locked} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{sub}</Text>
        <Text style={styles.meta}>{meta}</Text>
      </View>
      {locked ? <PremiumTag /> : <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />}
    </TouchableOpacity>
  );
}

export default function ExercisesScreen() {
  const { t, tn, lang } = useTranslation();
  const startExercise = useStartExercise();
  const startSituation = useStartSituation();
  const startScenario = useStartScenario();
  const createScenario = useCreateScenario();
  const isPremium = useIsPremium();
  const scenarios = useStore((s) => s.scenarios);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.screenTitle} accessibilityRole="header">{t('exercises.title')}</Text>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle} accessibilityRole="header">{t('scenarios.section')}</Text>
          <Text style={styles.sectionSub}>{t('scenarios.section_sub')}</Text>
        </View>
        <View style={styles.group}>
          {scenarios.map((sc, i) => {
            const locked = !isScenarioUnlocked(sc.id, scenarios, isPremium);
            const meta = `${tn('scenarios.phrases_count', sc.phrases.length)} · ${SCENARIO_MINUTES} ${t('common.min_short')}`;
            return (
              <Row
                key={sc.id}
                first={i === 0}
                icon="create-outline"
                tint="lavender"
                title={sc.title}
                sub={t('scenarios.kicker')}
                meta={meta}
                locked={locked}
                onPress={() => startScenario(sc.id)}
                a11y={`${sc.title}, ${meta}${locked ? `, ${t('common.premium')}` : ''}`}
              />
            );
          })}
          <TouchableOpacity
            style={[styles.row, scenarios.length > 0 && styles.rowBorder]}
            onPress={createScenario}
            activeOpacity={0.7}
            accessibilityRole="button"
            testID="scenario-new"
          >
            <View style={styles.addIcon}>
              <Ionicons name="add" size={24} color={Colors.accent.on} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t('scenarios.new')}</Text>
              <Text style={styles.sub}>{t('scenarios.new_sub')}</Text>
            </View>
            {!isPremium && scenarios.length > 0
              ? <PremiumTag />
              : <Ionicons name="chevron-forward" size={18} color={Colors.text.tertiary} />}
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle} accessibilityRole="header">{t('exercises.section_exercises')}</Text>
        </View>

        <View style={styles.group}>
          {EXERCISES.map((ex, i) => {
            const meta = `${ex.minutes} ${t('common.min_short')}`;
            return (
              <Row
                key={ex.id}
                first={i === 0}
                icon={ex.icon}
                tint={ex.tint}
                title={t(`exercises.${ex.id}`)}
                sub={t(`exercises.${ex.id}_sub`)}
                meta={meta}
                onPress={() => startExercise(ex.id)}
                a11y={`${t(`exercises.${ex.id}`)}, ${meta}`}
              />
            );
          })}
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle} accessibilityRole="header">{t('situations.title')}</Text>
          <Text style={styles.sectionSub}>{t('situations.intro')}</Text>
        </View>
        <View style={styles.group}>
          {SITUATIONS.map((sit, i) => {
            const locked = sit.premium && !isPremium;
            const c = sit.content[lang];
            const meta = `${t(`situations.level_${sit.difficulty}`)} · ${sit.minutes} ${t('common.min_short')}`;
            return (
              <Row
                key={sit.id}
                first={i === 0}
                icon={sit.icon}
                tint={sit.tint}
                title={c.title}
                sub={c.sub}
                meta={meta}
                locked={locked}
                onPress={() => startSituation(sit)}
                a11y={`${c.title}, ${meta}${locked ? `, ${t('common.premium')}` : ''}`}
              />
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.base },
  scroll: { paddingHorizontal: Spacing.screenH, paddingTop: 12, paddingBottom: 40, gap: 16 },
  screenTitle: {
    fontFamily: FontFamily.display,
    fontSize: 30,
    color: Colors.text.primary,
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  group: { backgroundColor: Colors.surface.card, borderRadius: Radius.card, paddingHorizontal: 16, ...Shadow.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.hairline },
  title: { fontFamily: FontFamily.soraSemiBold, fontSize: FontSize.body, color: Colors.text.primary },
  sub: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.bodySmall, color: Colors.text.secondary, marginTop: 2 },
  meta: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.meta, color: Colors.text.tertiary, marginTop: 4 },
  sectionHead: { marginTop: 12, gap: 4 },
  sectionTitle: { fontFamily: FontFamily.soraBold, fontSize: 20, color: Colors.text.primary, letterSpacing: -0.3 },
  addIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: Colors.accent.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionSub: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.bodySmall, lineHeight: 19, color: Colors.text.secondary },
});
