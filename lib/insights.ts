import type { CheckIn } from '../state/store';
import type { Session, StreakData } from './streak';
import type { SupportedLang } from './locale';
import { translate } from '../i18n';

export interface SmartInsight {
  id: string;
  icon: string;
  title: string;
  description: string;
  type: 'positive' | 'tip' | 'neutral';
}

function avg(numbers: number[]): number | null {
  if (numbers.length === 0) return null;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

export function generateSmartInsights(
  sessions: Session[],
  checkIns: CheckIn[],
  streak: StreakData,
  lang: SupportedLang,
): SmartInsight[] {
  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);
  const insights: SmartInsight[] = [];

  // 1. Sleep Correlation
  const withSleep = checkIns.filter((c) => c.sleepHours !== undefined);
  const goodSleep = withSleep.filter((c) => (c.sleepHours ?? 0) >= 7).map((c) => c.mood);
  const poorSleep = withSleep.filter((c) => (c.sleepHours ?? 0) < 6).map((c) => c.mood);
  const goodSleepAvg = avg(goodSleep);
  const poorSleepAvg = avg(poorSleep);

  if (goodSleepAvg !== null && poorSleepAvg !== null && goodSleepAvg > poorSleepAvg) {
    const diffPct = Math.round(((goodSleepAvg - poorSleepAvg) / poorSleepAvg) * 100);
    if (diffPct >= 5) {
      insights.push({
        id: 'sleep_correlation',
        icon: 'moon',
        title: t('insights.sleep_title'),
        description: t('insights.sleep_desc', { pct: diffPct }),
        type: 'positive',
      });
    }
  }

  // 2. Hydration Correlation
  const withWater = checkIns.filter((c) => c.waterGlasses !== undefined);
  const goodWater = withWater.filter((c) => (c.waterGlasses ?? 0) >= 6).map((c) => c.mood);
  const poorWater = withWater.filter((c) => (c.waterGlasses ?? 0) < 4).map((c) => c.mood);
  const goodWaterAvg = avg(goodWater);
  const poorWaterAvg = avg(poorWater);

  if (goodWaterAvg !== null && poorWaterAvg !== null && goodWaterAvg > poorWaterAvg) {
    const diffPct = Math.round(((goodWaterAvg - poorWaterAvg) / poorWaterAvg) * 100);
    if (diffPct >= 5) {
      insights.push({
        id: 'water_correlation',
        icon: 'water',
        title: t('insights.water_title'),
        description: t('insights.water_desc', { pct: diffPct }),
        type: 'positive',
      });
    }
  }

  // 3. Practice impact: compare mood on days where user practised vs didn't
  const sessionDates = new Set(sessions.map((s) => s.date));
  const practiceDaysMood = checkIns.filter((c) => sessionDates.has(c.date)).map((c) => c.mood);
  const nonPracticeDaysMood = checkIns.filter((c) => !sessionDates.has(c.date)).map((c) => c.mood);
  const practiceAvg = avg(practiceDaysMood);
  const nonPracticeAvg = avg(nonPracticeDaysMood);

  if (practiceAvg !== null && nonPracticeAvg !== null && practiceAvg > nonPracticeAvg) {
    const diffPct = Math.round(((practiceAvg - nonPracticeAvg) / nonPracticeAvg) * 100);
    if (diffPct >= 5) {
      insights.push({
        id: 'practice_impact',
        icon: 'fitness',
        title: t('insights.practice_title'),
        description: t('insights.practice_desc', { pct: diffPct }),
        type: 'positive',
      });
    }
  }

  // 4. Somatic tag frequency
  const tagCounts = new Map<string, number>();
  for (const c of checkIns) {
    if (c.tags) {
      for (const tag of c.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
  }

  const tensionTags = ['throat_tension', 'jaw_tension', 'chest_tightness', 'speech_blocks', 'social_anxiety'];
  let topTensionTag: string | null = null;
  let maxTensionCount = 0;

  for (const tTag of tensionTags) {
    const count = tagCounts.get(tTag) ?? 0;
    if (count > maxTensionCount && count >= 2) {
      maxTensionCount = count;
      topTensionTag = tTag;
    }
  }

  if (topTensionTag) {
    insights.push({
      id: 'tension_trigger',
      icon: 'alert-circle',
      title: t('insights.tension_title'),
      description: t('insights.tension_desc', { tag: t(`checkin.tag_${topTensionTag}`) }),
      type: 'tip',
    });
  }

  // 5. Streak / Neuroplasticity
  if (streak.current >= 3) {
    insights.push({
      id: 'streak_neuroplasticity',
      icon: 'sparkles',
      title: t('insights.streak_title'),
      description: t('insights.streak_desc', { days: streak.current }),
      type: 'positive',
    });
  }

  return insights;
}
