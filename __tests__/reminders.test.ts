jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'cs' }] }));
jest.mock('../lib/recordings', () => ({ deleteRecordingFile: () => {} }));

import {
  formatTime,
  syncReminderSchedule,
  updateReminderSettings,
  REMINDER_TIMES,
  MORNING_REMINDER_TIMES,
  STREAK_REMINDER_TIMES,
} from '../lib/reminders';
import { useStore } from '../state/store';

describe('reminders telemetry and schedule', () => {
  it('formats hours and minutes with leading zero', () => {
    expect(formatTime(8, 0)).toBe('08:00');
    expect(formatTime(18, 5)).toBe('18:05');
    expect(formatTime(20, 30)).toBe('20:30');
  });

  it('exposes expected default presets for slots', () => {
    expect(REMINDER_TIMES.length).toBeGreaterThanOrEqual(4);
    expect(MORNING_REMINDER_TIMES.length).toBeGreaterThanOrEqual(4);
    expect(STREAK_REMINDER_TIMES.length).toBeGreaterThanOrEqual(4);
  });

  it('syncReminderSchedule handles opt-out gracefully', async () => {
    useStore.getState().setUser({ shareAnswers: false });
    const res = await syncReminderSchedule({
      enabled: true,
      hour: 18,
      minute: 0,
      morningEnabled: true,
      morningHour: 8,
      morningMinute: 0,
      streakSaverEnabled: false,
    });
    expect(res).toBe(false);
  });

  it('syncReminderSchedule runs without throwing when opted in', async () => {
    useStore.getState().setUser({ shareAnswers: true });
    const res = await syncReminderSchedule({
      enabled: true,
      hour: 19,
      minute: 15,
      morningEnabled: false,
      streakSaverEnabled: true,
      streakSaverHour: 21,
      streakSaverMinute: 0,
    });
    expect(typeof res).toBe('boolean');
  });

  it('updates store reminder settings properly', async () => {
    await updateReminderSettings({
      hour: 17,
      minute: 45,
      morningHour: 7,
      morningMinute: 30,
    });
    const { reminder } = useStore.getState();
    expect(reminder.hour).toBe(17);
    expect(reminder.minute).toBe(45);
    expect(reminder.morningHour).toBe(7);
    expect(reminder.morningMinute).toBe(30);
  });
});
