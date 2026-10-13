import { CALM_AFTER_DAYS, waveCalm, waveCaptionKey, wavePath } from '../lib/wave';

describe('brand wave', () => {
  it('calms with consistency and stays within 0–1', () => {
    expect(waveCalm(0, 0)).toBeLessThan(0.35);
    expect(waveCalm(CALM_AFTER_DAYS, 1)).toBe(1);
    expect(waveCalm(100, 5)).toBe(1);
    expect(waveCalm(7, 0)).toBeGreaterThan(waveCalm(3, 0));
    expect(waveCaptionKey(waveCalm(0, 0))).toBe('home.wave_start');
    expect(waveCaptionKey(1)).toBe('home.wave_calm');
  });

  it('is deterministic, smooth and stays inside its box', () => {
    const d = wavePath(300, 60, 0.2, 1);
    expect(d).toBe(wavePath(300, 60, 0.2, 1));
    expect(d).toMatch(/^M0\.0,30\.0 C/);
    const ys = [...d.matchAll(/,(-?[\d.]+)/g)].map((m) => Number(m[1]));
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(-6);
    expect(Math.max(...ys)).toBeLessThanOrEqual(66);
  });
});
