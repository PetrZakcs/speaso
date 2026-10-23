jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'cs' }] }));
jest.mock('../lib/recordings', () => ({ deleteRecordingFile: () => {} }));
jest.mock('expo-constants', () => ({ expoConfig: { version: '1.0.0' } }));

import { useStore, type CustomScenario } from '../state/store';
import { canCreateScenario, isScenarioUnlocked } from '../lib/scenarios';
import { buildAnswersRow, submitAnswers } from '../lib/answers';

const sc = (id: string, createdAt: string): CustomScenario => ({
  id, title: id, phrases: ['a'], challenge: '', createdAt,
});

describe('own scenarios access', () => {
  const list = [sc('second', '2026-10-02T10:00:00Z'), sc('first', '2026-10-01T10:00:00Z')];

  it('unlocks only the oldest scenario for free users', () => {
    expect(isScenarioUnlocked('first', list, false)).toBe(true);
    expect(isScenarioUnlocked('second', list, false)).toBe(false);
    expect(isScenarioUnlocked('second', list, true)).toBe(true);
  });

  it('lets free users create just one', () => {
    expect(canCreateScenario([], false)).toBe(true);
    expect(canCreateScenario(list.slice(0, 1), false)).toBe(false);
    expect(canCreateScenario(list, true)).toBe(true);
  });
});

describe('scenario store', () => {
  it('trims text and drops empty sentences', () => {
    const id = useStore.getState().addScenario({ title: '  Pizza ', phrases: [' Dobrý den ', '', '  '], challenge: ' ' });
    const saved = useStore.getState().scenarios.find((s) => s.id === id)!;
    expect(saved).toMatchObject({ title: 'Pizza', phrases: ['Dobrý den'], challenge: '' });
    useStore.getState().updateScenario(id, { title: 'Pizza 2', phrases: ['x'], challenge: 'y' });
    expect(useStore.getState().scenarios.find((s) => s.id === id)!.title).toBe('Pizza 2');
    useStore.getState().removeScenario(id);
    expect(useStore.getState().scenarios).toHaveLength(0);
  });

  it('migrates v3 state to v4 without losing data', () => {
    const migrate = useStore.persist.getOptions().migrate!;
    const v3 = { onboardingDone: true, user: { name: 'Eva', situations: ['phone'], dailyMinutes: 5 }, checkIns: [] };
    const out = migrate(v3, 3) as any;
    expect(out.user).toMatchObject({ name: 'Eva', situations: ['phone'], situationsOther: '', shareAnswers: true });
    expect(out.scenarios).toEqual([]);
    expect(typeof out.installId).toBe('string');
    expect(out.answersPending).toBe(false);
  });
});

describe('onboarding answers', () => {
  it('never includes the name', () => {
    useStore.getState().setUser({ name: 'Tajné jméno', situationsOther: 'Říct jméno', goalOther: 'klid' });
    const row = buildAnswersRow();
    expect(JSON.stringify(row)).not.toContain('Tajné jméno');
    expect(row).toMatchObject({ situations_other: 'Říct jméno', goal_other: 'klid', lang: 'cs' });
  });

  it('sends nothing without opt-in', async () => {
    const fetchSpy = jest.fn();
    (global as any).fetch = fetchSpy;
    useStore.getState().setUser({ shareAnswers: false });
    expect(await submitAnswers()).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(useStore.getState().answersPending).toBe(false);
  });

  it('keeps answers pending when the backend is not configured', async () => {
    useStore.getState().setUser({ shareAnswers: true });
    expect(await submitAnswers()).toBe(false);
    expect(useStore.getState().answersPending).toBe(true);
  });
});
