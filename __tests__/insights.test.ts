import { generateSmartInsights } from '../lib/insights';
import type { CheckIn } from '../state/store';
import type { Session, StreakData } from '../lib/streak';

describe('Smart Insights Engine (VOS style)', () => {
  const emptyStreak: StreakData = { current: 0, record: 0, lastActiveDate: null };

  it('detects positive sleep correlation when sleep >= 7h leads to higher speech ratings', () => {
    const checkIns: CheckIn[] = [
      { date: '2026-10-10', mood: 5, sleepHours: 8 },
      { date: '2026-10-11', mood: 4, sleepHours: 7 },
      { date: '2026-10-12', mood: 2, sleepHours: 5 },
      { date: '2026-10-13', mood: 2, sleepHours: 4 },
    ];

    const insights = generateSmartInsights([], checkIns, emptyStreak, 'cs');
    const sleepInsight = insights.find((i) => i.id === 'sleep_correlation');
    expect(sleepInsight).toBeDefined();
    expect(sleepInsight?.title).toBe('Spánek a plynulost');
    expect(sleepInsight?.type).toBe('positive');
  });

  it('detects hydration correlation when drinking 6+ glasses leads to higher speech ratings', () => {
    const checkIns: CheckIn[] = [
      { date: '2026-10-10', mood: 5, waterGlasses: 8 },
      { date: '2026-10-11', mood: 4, waterGlasses: 6 },
      { date: '2026-10-12', mood: 2, waterGlasses: 2 },
      { date: '2026-10-13', mood: 1, waterGlasses: 3 },
    ];

    const insights = generateSmartInsights([], checkIns, emptyStreak, 'cs');
    const waterInsight = insights.find((i) => i.id === 'water_correlation');
    expect(waterInsight).toBeDefined();
    expect(waterInsight?.title).toBe('Hydratace a hlasivky');
  });

  it('highlights practice impact on mood ratings', () => {
    const sessions: Session[] = [
      { id: '1', date: '2026-10-10', exerciseId: 'breathing', durationSec: 180, completedAt: '2026-10-10T10:00:00Z', inPlan: true },
      { id: '2', date: '2026-10-11', exerciseId: 'reading', durationSec: 240, completedAt: '2026-10-11T10:00:00Z', inPlan: true },
    ];
    const checkIns: CheckIn[] = [
      { date: '2026-10-10', mood: 5 },
      { date: '2026-10-11', mood: 4 },
      { date: '2026-10-12', mood: 2 }, // non-practice day
      { date: '2026-10-13', mood: 2 }, // non-practice day
    ];

    const insights = generateSmartInsights(sessions, checkIns, emptyStreak, 'cs');
    const practiceInsight = insights.find((i) => i.id === 'practice_impact');
    expect(practiceInsight).toBeDefined();
    expect(practiceInsight?.title).toBe('Vliv pravidelného tréninku');
  });

  it('identifies frequent somatic tension trigger tags', () => {
    const checkIns: CheckIn[] = [
      { date: '2026-10-10', mood: 3, tags: ['throat_tension', 'fast_pace'] },
      { date: '2026-10-11', mood: 2, tags: ['throat_tension'] },
    ];

    const insights = generateSmartInsights([], checkIns, emptyStreak, 'cs');
    const tensionInsight = insights.find((i) => i.id === 'tension_trigger');
    expect(tensionInsight).toBeDefined();
    expect(tensionInsight?.title).toBe('Častý spouštěč napětí');
    expect(tensionInsight?.description).toContain('Napětí v krku');
  });

  it('adds streak neuroplasticity celebration for streaks >= 3', () => {
    const streak: StreakData = { current: 5, record: 10, lastActiveDate: '2026-10-20' };
    const insights = generateSmartInsights([], [], streak, 'cs');
    const streakInsight = insights.find((i) => i.id === 'streak_neuroplasticity');
    expect(streakInsight).toBeDefined();
    expect(streakInsight?.title).toBe('Neuroplastická adaptace');
  });
});
