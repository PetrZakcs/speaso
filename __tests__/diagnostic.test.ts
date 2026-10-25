import { calculateDiagnosticProfile } from '../lib/diagnostic';
import type { UserState } from '../state/store';

const baseUser: UserState = {
  name: 'Petr',
  ageGroup: 'adult',
  situations: ['phone', 'meeting'],
  goal: 'reduce_stutter',
  therapyStatus: 'never',
  dailyMinutes: 15,
  note: '',
  situationsOther: '',
  goalOther: '',
  shareAnswers: false,
  hasRedeemedReferral: false,
};

describe('calculateDiagnosticProfile', () => {
  it('calculates elevated tension score when situations are selected', () => {
    const profile = calculateDiagnosticProfile(baseUser, 'cs');
    expect(profile.tensionScore).toBeGreaterThanOrEqual(55);
    expect(profile.tensionScore).toBeLessThanOrEqual(92);
    expect(profile.triggerCount).toBe(2);
    expect(profile.primaryTriggers.length).toBe(2);
  });

  it('identifies larynx friction area when phone situation is present', () => {
    const profile = calculateDiagnosticProfile(baseUser, 'cs');
    const hasLarynx = profile.vocalFrictionAreas.some((a) => a.id === 'larynx');
    expect(hasLarynx).toBe(true);
  });

  it('projects higher block reduction for users practicing 15+ minutes', () => {
    const profile15 = calculateDiagnosticProfile({ ...baseUser, dailyMinutes: 15 }, 'cs');
    const profile5 = calculateDiagnosticProfile({ ...baseUser, dailyMinutes: 5 }, 'cs');
    expect(profile15.projectedBlockReductionPct).toBeGreaterThan(profile5.projectedBlockReductionPct);
  });

  it('identifies diaphragm and pace friction areas for social situations', () => {
    const socialUser: UserState = {
      ...baseUser,
      situations: ['meeting', 'presentation'],
      goal: 'confidence',
    };
    const profile = calculateDiagnosticProfile(socialUser, 'cs');
    expect(profile.vocalFrictionAreas.some((a) => a.id === 'diaphragm')).toBe(true);
    expect(profile.vocalFrictionAreas.some((a) => a.id === 'pace')).toBe(true);
  });

  it('handles empty situations gracefully', () => {
    const emptyUser: UserState = {
      ...baseUser,
      situations: [],
      therapyStatus: 'current',
    };
    const profile = calculateDiagnosticProfile(emptyUser, 'en');
    expect(profile.tensionScore).toBeGreaterThanOrEqual(50);
    expect(profile.triggerCount).toBe(0);
    expect(profile.primaryTriggers).toEqual([]);
  });
});
