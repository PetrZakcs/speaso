jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'cs' }] }));
jest.mock('expo-print', () => ({}));
jest.mock('expo-sharing', () => ({}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../lib/recordings', () => ({ deleteRecordingFile: () => {} }));

import { EXERCISES } from '../content/exercises';
import { SITUATIONS } from '../content/situations';
import { TEXTS, textsFor } from '../content/texts';
import { translate, translateList } from '../i18n';
import { buildReportHtml } from '../lib/report';
import { averageRating, type Session } from '../lib/streak';
import { activityTitle } from '../lib/activities';

describe('content', () => {
  it('every exercise has a title and steps in both languages', () => {
    for (const ex of EXERCISES) {
      for (const lang of ['cs', 'en'] as const) {
        expect(translate(lang, `exercises.${ex.id}`)).not.toBe(`exercises.${ex.id}`);
        expect(translateList(lang, `exercises.steps.${ex.id}`).length).toBeGreaterThan(2);
      }
    }
  });

  it('situations have matching structure in both languages', () => {
    for (const s of SITUATIONS) {
      expect(s.content.cs.prep).toHaveLength(s.content.en.prep.length);
      expect(s.content.cs.phrases).toHaveLength(s.content.en.phrases.length);
      expect(s.content.cs.challenge.length).toBeGreaterThan(10);
    }
  });

  it('at least one free situation exists', () => {
    expect(SITUATIONS.some((s) => !s.premium)).toBe(true);
  });

  it('has a reading text for every level, for adults and children', () => {
    for (const level of [1, 2, 3] as const) {
      expect(textsFor('adult', level).length).toBeGreaterThan(0);
      expect(textsFor('child', level).every((x) => x.audience === 'child')).toBe(true);
    }
    expect(new Set(TEXTS.map((x) => x.id)).size).toBe(TEXTS.length);
  });

  it('resolves activity titles for exercises and situations', () => {
    expect(activityTitle('breathing', 'cs')).toBe('Bránicové dýchání');
    expect(activityTitle('situation:phone', 'en')).toBe('Phone call');
  });
});

describe('ratings and report', () => {
  const session = (date: string, rating?: 1 | 2 | 3 | 4 | 5, note?: string): Session => ({
    id: `${date}-${rating}`,
    exerciseId: 'reading',
    date,
    durationSec: 300,
    completedAt: `${date}T10:00:00.000Z`,
    rating,
    note,
  });

  it('averages ratings in a date range and ignores unrated sessions', () => {
    const sessions = [session('2026-09-28', 2), session('2026-09-29', 4), session('2026-09-30'), session('2026-09-20', 5)];
    expect(averageRating(sessions, '2026-09-28', '2026-09-30')).toBe(3);
    expect(averageRating(sessions, '2026-10-01', '2026-10-05')).toBeNull();
  });

  it('escapes user content in the PDF html', () => {
    const html = buildReportHtml(
      {
        name: '<b>Petr</b>',
        from: '1. 9. 2026',
        to: '30. 9. 2026',
        sessions: [session('2026-09-29', 3, '<script>alert(1)</script> & "x"')],
        streak: 2,
        panicUses: 1,
        checkInAvg: 3.5,
      },
      'cs',
    );
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;b&gt;Petr&lt;/b&gt;');
    expect(html).toContain('Plynulé čtení');
    expect(html).toContain('3/5');
    expect(html).toContain('Průměrný denní check-in: 3.5/5');
  });

  it('renders clinical diagnostic tension index when present in the PDF report', () => {
    const html = buildReportHtml(
      {
        name: 'Petr',
        from: '1. 9. 2026',
        to: '30. 9. 2026',
        sessions: [session('2026-09-29', 3)],
        streak: 3,
        panicUses: 0,
        diagnosticTensionScore: 78,
        diagnosticTriggers: ['Telefonování', 'Cizí lidé'],
        diagnosticFrictionAreas: ['Křeč hrtanu a hlasivek', 'Mělký hrudní dech'],
      },
      'cs',
    );
    expect(html).toContain('Vstupní diagnostika &amp; index napětí');
    expect(html).toContain('78/100');
    expect(html).toContain('Telefonování, Cizí lidé');
    expect(html).toContain('Křeč hrtanu a hlasivek, Mělký hrudní dech');
  });
});

