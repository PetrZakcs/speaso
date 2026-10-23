import { dailyPlan, doneOn, isInPlan } from '../lib/plan';
import type { Session } from '../lib/streak';

const ids = (date: string, minutes: number, hard: string[] = [], premium = false) =>
  dailyPlan(date, minutes, hard, premium).map((i) => i.activityId);

describe('dailyPlan', () => {
  it('scales with the daily time the user chose', () => {
    expect(ids('2026-10-08', 5)).toHaveLength(1);
    expect(ids('2026-10-08', 15)).toHaveLength(2);
    expect(ids('2026-10-08', 30)).toHaveLength(3);
  });

  it('is stable within a day and varies between days', () => {
    expect(ids('2026-10-08', 30)).toEqual(ids('2026-10-08', 30));
    expect(ids('2026-10-08', 30)).not.toEqual(ids('2026-10-09', 30));
  });

  it('always starts with a warm-up', () => {
    for (const d of ['2026-10-08', '2026-10-09', '2026-10-10']) {
      expect(['breathing', 'softstart']).toContain(ids(d, 15)[0]);
    }
  });

  it('uses situations the user finds hard, if they can access them', () => {
    expect(ids('2026-10-08', 15, ['phone'])[1]).toBe('situation:phone');
    // meeting is Premium → falls back to a free situation for free users
    const free = ids('2026-10-08', 15, ['meeting'])[1];
    expect(['situation:introduction', 'situation:phone', 'situation:shop']).toContain(free);
    expect(ids('2026-10-08', 15, ['meeting'], true)[1]).toBe('situation:meeting');
  });
});

describe('isInPlan', () => {
  it('matches exactly the activities of that day', () => {
    const plan = ids('2026-10-08', 15, ['phone']);
    expect(isInPlan(plan[0], '2026-10-08', 15, ['phone'], false)).toBe(true);
    expect(isInPlan('situation:phone', '2026-10-08', 15, ['phone'], false)).toBe(true);
    expect(isInPlan('reading', '2026-10-08', 15, ['phone'], false)).toBe(false);
  });
});

describe('doneOn', () => {
  it('collects activities finished on that day only', () => {
    const s = (exerciseId: string, date: string): Session => ({
      id: exerciseId + date, exerciseId, date, durationSec: 60, completedAt: `${date}T10:00:00Z`,
    });
    const done = doneOn([s('breathing', '2026-10-08'), s('situation:phone', '2026-10-08'), s('reading', '2026-10-07')], '2026-10-08');
    expect([...done].sort()).toEqual(['breathing', 'situation:phone']);
  });
});
