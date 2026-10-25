import { calculateWpm, classifyWpm } from '../lib/pacing';

describe('PacingMeter calculation & clinical zones', () => {
  describe('classifyWpm', () => {
    it('classifies under 100 WPM as slow', () => {
      expect(classifyWpm(60)).toBe('slow');
      expect(classifyWpm(99)).toBe('slow');
    });

    it('classifies 100 to 135 WPM as calm optimal zone', () => {
      expect(classifyWpm(100)).toBe('calm');
      expect(classifyWpm(120)).toBe('calm');
      expect(classifyWpm(135)).toBe('calm');
    });

    it('classifies 136 to 155 WPM as elevated tension zone', () => {
      expect(classifyWpm(136)).toBe('elevated');
      expect(classifyWpm(145)).toBe('elevated');
      expect(classifyWpm(155)).toBe('elevated');
    });

    it('classifies above 155 WPM as fast', () => {
      expect(classifyWpm(156)).toBe('fast');
      expect(classifyWpm(180)).toBe('fast');
    });
  });

  describe('calculateWpm', () => {
    it('returns 0 for empty or single tap', () => {
      expect(calculateWpm([])).toBe(0);
      expect(calculateWpm([1000])).toBe(0);
    });

    it('calculates 120 WPM for 500ms intervals', () => {
      const timestamps = [1000, 1500, 2000, 2500];
      expect(calculateWpm(timestamps)).toBe(120);
    });

    it('calculates 60 WPM for 1000ms intervals', () => {
      const timestamps = [1000, 2000, 3000, 4000];
      expect(calculateWpm(timestamps)).toBe(60);
    });

    it('ignores pauses greater than 2.5 seconds', () => {
      const timestamps = [1000, 5000];
      expect(calculateWpm(timestamps)).toBe(0);
    });
  });
});
