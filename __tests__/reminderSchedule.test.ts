import { reminderDates } from '../lib/reminderSchedule';

const at = (d: Date) => `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;

describe('reminderDates', () => {
  const morning = new Date(2026, 9, 9, 10, 0); // Oct 9, 10:00

  it('includes today when the plan is not done yet and the time is ahead', () => {
    const dates = reminderDates(morning, 18, 0, false);
    expect(dates).toHaveLength(7);
    expect(at(dates[0])).toBe('10/9 18:00');
    expect(at(dates[6])).toBe('10/15 18:00');
  });

  it('skips today once the plan is done', () => {
    const dates = reminderDates(morning, 18, 0, true);
    expect(dates).toHaveLength(6);
    expect(at(dates[0])).toBe('10/10 18:00');
  });

  it('skips today when the reminder time has already passed', () => {
    const evening = new Date(2026, 9, 9, 20, 0);
    expect(at(reminderDates(evening, 18, 0, false)[0])).toBe('10/10 18:00');
  });

  it('rolls over month ends', () => {
    const lastDay = new Date(2026, 9, 31, 8, 0);
    expect(at(reminderDates(lastDay, 20, 30, true)[0])).toBe('11/1 20:30');
  });
});
