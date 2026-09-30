jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'cs' }] }));

import { translate, translateList, translatePlural } from '../i18n';
import { toVocative } from '../lib/vocative';
import { addressName } from '../lib/names';

describe('translate', () => {
  it('interpolates every placeholder occurrence', () => {
    expect(translate('cs', 'exercises.step_of', { n: 2, total: 6 })).toBe('Krok 2/6');
    expect(translate('en', 'home.greeting_name', { name: 'Anna' })).toBe('Hi, Anna!');
  });

  it('returns lists', () => {
    expect(translateList('en', 'common.weekdays_short')).toHaveLength(7);
    expect(translateList('cs', 'exercises.steps.breathing').length).toBeGreaterThan(0);
  });

  it('has the same exercise steps count in both languages', () => {
    for (const id of ['breathing', 'reading', 'softstart']) {
      expect(translateList('cs', `exercises.steps.${id}`)).toHaveLength(
        translateList('en', `exercises.steps.${id}`).length,
      );
    }
  });
});

describe('plurals', () => {
  it('uses Czech one / few / other forms', () => {
    expect(translatePlural('cs', 'home.streak_days', 1)).toBe('1 den v řadě');
    expect(translatePlural('cs', 'home.streak_days', 3)).toBe('3 dny v řadě');
    expect(translatePlural('cs', 'home.streak_days', 5)).toBe('5 dní v řadě');
    expect(translatePlural('cs', 'home.streak_days', 0)).toBe('0 dní v řadě');
  });

  it('uses English one / other forms', () => {
    expect(translatePlural('en', 'home.streak_days', 1)).toBe('1 day in a row');
    expect(translatePlural('en', 'home.streak_days', 3)).toBe('3 days in a row');
  });
});

describe('vocative', () => {
  it.each([
    ['Petr', 'Petře'],
    ['Jana', 'Jano'],
    ['Marek', 'Marku'],
    ['Lucie', 'Lucie'],
  ])('%s → %s', (name, expected) => {
    expect(toVocative(name)).toBe(expected);
  });

  it('only declines in Czech', () => {
    expect(addressName('Petr', 'cs')).toBe('Petře');
    expect(addressName('Petr', 'en')).toBe('Petr');
    expect(addressName('  ', 'cs')).toBe('');
  });
});
