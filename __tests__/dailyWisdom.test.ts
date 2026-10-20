import { getDailyWisdom, DAILY_WISDOM_COLLECTION } from '../content/dailyWisdom';

describe('Daily Speech Wisdom (VOS style inspiration)', () => {
  it('contains at least 10 clinician-curated wisdom cards', () => {
    expect(DAILY_WISDOM_COLLECTION.length).toBeGreaterThanOrEqual(10);
  });

  it('deterministically returns wisdom for a given date in CS', () => {
    const wisdom1 = getDailyWisdom('2026-10-20', 'cs');
    const wisdom2 = getDailyWisdom('2026-10-20', 'cs');
    expect(wisdom1).toEqual(wisdom2);
    expect(wisdom1.quote.length).toBeGreaterThan(10);
    expect(wisdom1.challenge.length).toBeGreaterThan(10);
  });

  it('returns valid English translations for EN locale', () => {
    const wisdom = getDailyWisdom('2026-10-20', 'en');
    expect(wisdom.quote).toBeTruthy();
    expect(wisdom.challenge).toBeTruthy();
  });
});
