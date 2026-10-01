import { addDays, mondayOf, toDateKey, weekDates, weekdayIndex } from '../lib/dates';
import {
  EMPTY_STREAK, FREE_WEEKLY_LIMIT, canStartExercise, currentStreak, registerActivity,
  sessionsThisWeek, weekActivity, weekMinutes, type Session,
} from '../lib/streak';

const session = (date: string, durationSec = 300): Session => ({
  id: `${date}-${durationSec}`,
  exerciseId: 'breathing',
  date,
  durationSec,
  completedAt: `${date}T10:00:00.000Z`,
});

describe('dates', () => {
  it('formats local dates without UTC shifting', () => {
    // 00:30 local on a Monday must stay Monday regardless of time zone.
    expect(toDateKey(new Date(2026, 8, 28, 0, 30))).toBe('2026-09-28');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('finds the Monday of the week (Sunday belongs to the previous week)', () => {
    expect(mondayOf('2026-09-30')).toBe('2026-09-28'); // Wed
    expect(mondayOf('2026-10-04')).toBe('2026-09-28'); // Sun
    expect(mondayOf('2026-09-28')).toBe('2026-09-28'); // Mon
    expect(weekdayIndex('2026-10-04')).toBe(6);
  });

  it('lists Mon…Sun of the week', () => {
    expect(weekDates('2026-09-30')).toEqual([
      '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01',
      '2026-10-02', '2026-10-03', '2026-10-04',
    ]);
  });
});

describe('streak', () => {
  it('starts at 1 on the first active day', () => {
    expect(registerActivity(EMPTY_STREAK, '2026-09-30')).toEqual({
      current: 1, record: 1, lastActiveDate: '2026-09-30',
    });
  });

  it('counts days, not sessions', () => {
    const once = registerActivity(EMPTY_STREAK, '2026-09-30');
    expect(registerActivity(once, '2026-09-30')).toBe(once);
  });

  it('grows on consecutive days and keeps the record', () => {
    let s = registerActivity(EMPTY_STREAK, '2026-09-28');
    s = registerActivity(s, '2026-09-29');
    s = registerActivity(s, '2026-09-30');
    expect(s.current).toBe(3);
    expect(s.record).toBe(3);
  });

  it('resets after a missed day but keeps the record', () => {
    let s = registerActivity(EMPTY_STREAK, '2026-09-27');
    s = registerActivity(s, '2026-09-28');
    s = registerActivity(s, '2026-09-30'); // skipped the 29th
    expect(s.current).toBe(1);
    expect(s.record).toBe(2);
  });

  it('shows the streak until the end of the next day, then 0', () => {
    const s = registerActivity(registerActivity(EMPTY_STREAK, '2026-09-28'), '2026-09-29');
    expect(currentStreak(s, '2026-09-29')).toBe(2);
    expect(currentStreak(s, '2026-09-30')).toBe(2); // not practised yet today
    expect(currentStreak(s, '2026-10-01')).toBe(0);
  });
});

describe('weekly usage', () => {
  const today = '2026-09-30'; // Wednesday

  it('only counts sessions from this Monday on', () => {
    const sessions = [session('2026-09-27'), session('2026-09-28'), session('2026-09-30')];
    expect(sessionsThisWeek(sessions, today)).toBe(2);
  });

  it('resets automatically in a new week', () => {
    const lastWeek = Array.from({ length: 5 }, () => session('2026-09-25'));
    expect(sessionsThisWeek(lastWeek, today)).toBe(0);
    expect(canStartExercise(lastWeek, today, false)).toBe(true);
  });

  it('blocks free users at the limit, never premium users', () => {
    const full = Array.from({ length: FREE_WEEKLY_LIMIT }, () => session(today));
    expect(canStartExercise(full, today, false)).toBe(false);
    expect(canStartExercise(full, today, true)).toBe(true);
  });

  it('maps activity and minutes onto Mon…Sun', () => {
    const sessions = [session('2026-09-28', 120), session('2026-09-28', 60), session('2026-09-30', 600)];
    expect(weekActivity(sessions, today)).toEqual([true, false, true, false, false, false, false]);
    expect(weekMinutes(sessions, today)).toEqual([3, 0, 10, 0, 0, 0, 0]);
  });
});
