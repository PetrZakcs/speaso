import { recommend } from '../lib/recommend';
import type { Session } from '../lib/streak';

const s = (exerciseId: string, date: string): Session => ({
  id: `${exerciseId}-${date}`,
  exerciseId,
  date,
  durationSec: 300,
  completedAt: `${date}T10:00:00.000Z`,
});
const today = '2026-10-01';

describe('recommend', () => {
  it('starts new users with breathing', () => {
    expect(recommend([], ['phone'], today, false)).toEqual({ kind: 'exercise', id: 'breathing' });
  });

  it('suggests a hard situation the user picked and can access', () => {
    const r = recommend([s('breathing', today)], ['meeting', 'phone'], today, false);
    expect(r.kind).toBe('situation');
    if (r.kind === 'situation') expect(r.situation.id).toBe('phone'); // meeting is Premium
  });

  it('does not repeat a situation practised in the last 3 days', () => {
    const r = recommend([s('situation:phone', '2026-09-30')], ['phone'], today, false);
    expect(r.kind).toBe('exercise');
  });

  it('otherwise picks the exercise practised least recently, never one done today', () => {
    const sessions = [s('breathing', today), s('reading', '2026-09-30'), s('softstart', '2026-09-20'), s('metronome', '2026-09-25')];
    expect(recommend(sessions, [], today, false)).toEqual({ kind: 'exercise', id: 'softstart' });
  });

  it('prefers exercises never done', () => {
    const sessions = [s('breathing', '2026-09-30'), s('reading', '2026-09-30')];
    const r = recommend(sessions, [], today, false);
    expect(r.kind === 'exercise' && ['softstart', 'metronome'].includes(r.id)).toBe(true);
  });
});
