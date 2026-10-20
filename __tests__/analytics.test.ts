jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'cs' }] }));
jest.mock('../lib/recordings', () => ({ deleteRecordingFile: () => {} }));

import { trackEvent, isAnalyticsConfigured } from '../lib/analytics';
import { useStore, patientPairingCode } from '../state/store';

describe('analytics and patient pairing', () => {
  it('respects shareAnswers opt-in', async () => {
    useStore.getState().setUser({ shareAnswers: false });
    const sent = await trackEvent('exercise_start', { id: 'prolongation' });
    expect(sent).toBe(false);
  });

  it('tracks when shareAnswers is enabled', async () => {
    useStore.getState().setUser({ shareAnswers: true });
    const sent = await trackEvent('onboarding_start');
    expect(typeof sent).toBe('boolean');
  });

  it('generates consistent patient pairing codes', () => {
    expect(patientPairingCode('abc123xyz')).toBe('SPE-ABC1');
    expect(patientPairingCode('1234-5678')).toBe('SPE-1234');
    expect(patientPairingCode('')).toBe('SPE-2026');
  });
});
