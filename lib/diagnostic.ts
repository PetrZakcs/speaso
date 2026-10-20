import type { UserState } from '../state/store';
import { SITUATIONS } from '../content/situations';
import type { SupportedLang } from './locale';

export interface VocalFrictionArea {
  id: string;
  titleKey: string;
  descKey: string;
  icon: string;
}

export interface DiagnosticProfile {
  tensionScore: number;
  triggerCount: number;
  primaryTriggers: Array<{ id: string; title: string }>;
  vocalFrictionAreas: VocalFrictionArea[];
  dailyMinutes: number;
  projectedBlockReductionPct: number;
}

/**
 * Calculates a personalized speech diagnostic & tension profile based on
 * the user's selected situations, goal, daily minutes and therapy status.
 */
export function calculateDiagnosticProfile(user: UserState, lang: SupportedLang = 'cs'): DiagnosticProfile {
  const situationIds = user.situations ?? [];
  const selectedSituations = SITUATIONS.filter((s) => situationIds.includes(s.id));

  // Base score from trigger intensity
  let baseScore = 45;
  baseScore += Math.min(35, situationIds.length * 8);

  // Adjustment based on therapy status
  if (user.therapyStatus === 'never') {
    baseScore += 6; // higher unmanaged tension
  } else if (user.therapyStatus === 'past') {
    baseScore += 4;
  }

  // Cap tension score between 55 and 92 for realistic clinical relevance
  const tensionScore = Math.max(55, Math.min(92, baseScore));

  // Determine top triggers
  const primaryTriggers = selectedSituations.slice(0, 3).map((s) => ({
    id: s.id,
    title: s.content[lang].title,
  }));

  // Identify primary somatic friction centers based on triggers
  const frictionAreas: VocalFrictionArea[] = [];

  const hasPhone = situationIds.includes('phone') || situationIds.includes('phone_order');
  const hasSocial = situationIds.includes('strangers') || situationIds.includes('meeting') || situationIds.includes('presentation');

  if (hasPhone || situationIds.length > 0) {
    frictionAreas.push({
      id: 'larynx',
      titleKey: 'diagnostic.area_larynx_title',
      descKey: 'diagnostic.area_larynx_desc',
      icon: 'pulse-outline',
    });
  }

  frictionAreas.push({
    id: 'diaphragm',
    titleKey: 'diagnostic.area_diaphragm_title',
    descKey: 'diagnostic.area_diaphragm_desc',
    icon: 'water-outline',
  });

  if (hasSocial || user.goal === 'confidence') {
    frictionAreas.push({
      id: 'pace',
      titleKey: 'diagnostic.area_pace_title',
      descKey: 'diagnostic.area_pace_desc',
      icon: 'speedometer-outline',
    });
  }

  // 30-day projection calculation: consistent 5-15 min daily practice reduces somatic tension
  const dailyMinutes = user.dailyMinutes || 5;
  const projectedBlockReductionPct = dailyMinutes >= 15 ? 48 : dailyMinutes >= 10 ? 42 : 35;

  return {
    tensionScore,
    triggerCount: situationIds.length,
    primaryTriggers,
    vocalFrictionAreas: frictionAreas.slice(0, 3),
    dailyMinutes,
    projectedBlockReductionPct,
  };
}
