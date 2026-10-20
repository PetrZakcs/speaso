jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'cs' }] }));
jest.mock('../lib/recordings', () => ({ deleteRecordingFile: () => {} }));

import { syncResearchCheckIn } from '../lib/research';
import { useStore } from '../state/store';

describe('balbuties research sync', () => {
  it('does not send data when user opted out', async () => {
    useStore.getState().setUser({ shareAnswers: false });
    const res = await syncResearchCheckIn({
      date: '2026-10-20',
      mood: 4,
      sleepHours: 8,
      waterGlasses: 6,
      weather: 'sunny',
    });
    expect(res).toBe(false);
  });

  it('runs safely when opted in', async () => {
    useStore.getState().setUser({ shareAnswers: true });
    const res = await syncResearchCheckIn({
      date: '2026-10-20',
      mood: 5,
    });
    expect(typeof res).toBe('boolean');
  });
});
